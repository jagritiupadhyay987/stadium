import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { BrowserQRCodeReader } from "@zxing/browser";
import { CheckCircle2, XCircle, QrCode, ArrowRightCircle, Send, RefreshCcw } from "lucide-react";
import { auth } from "../firebase";
import { cn } from "../lib/utils";

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

type TicketPayload = {
  ticket_id: string;
  fan_name: string;
  seat: string;
  gate: string;
  blockchain_tx_hash: string;
  ticket_hash: string;
  verification_url: string;
  network: string;
  explorer_url?: string;
  simulation: boolean;
};

type VerificationResult = {
  ticket_id: string;
  ticket_hash: string;
  verified: boolean;
  blockchain_tx_hash?: string;
  network: string;
  explorer_url?: string;
  message: string;
  simulation: boolean;
};

function parseTicketPayload(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (parsed?.ticket_id && parsed?.ticket_hash) {
      return {
        ticket_id: parsed.ticket_id,
        ticket_hash: parsed.ticket_hash,
      };
    }
  } catch {
    // not JSON
  }

  try {
    const url = new URL(value);
    const params = new URLSearchParams(url.search);
    const ticket_id = params.get("ticket_id") || undefined;
    const ticket_hash = params.get("ticket_hash") || undefined;
    if (ticket_id && ticket_hash) {
      return { ticket_id, ticket_hash };
    }
  } catch {
    // not a URL
  }

  return null;
}

export function TicketVerificationPanel() {
  const [ticket, setTicket] = useState<TicketPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferStatus, setTransferStatus] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    registerTicket();
    return () => {
      codeReaderRef.current = null;
    };
  }, []);

  async function registerTicket() {
    setLoading(true);
    setScanError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/tickets/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fan_name: auth.currentUser?.displayName ?? "Guest User",
          seat: "N-Stand / Row G / 42",
          gate: "Gate 3",
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to create ticket registration.");
      }
      const result = await response.json();
      setTicket(result);
      setVerification(null);
    } catch (error: any) {
      setScanError(error?.message ?? "Ticket registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyTicket(ticketId: string, ticketHash: string) {
    setLoading(true);
    setScanError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/tickets/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId, ticket_hash: ticketHash }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? "Ticket verification failed.");
      }
      const result = await response.json();
      setVerification(result);
    } catch (error: any) {
      setScanError(error?.message ?? "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function transferTicket() {
    setLoading(true);
    setTransferStatus(null);
    setScanError(null);
    if (!ticket) {
      setScanError("Register or load a ticket before transferring.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/v1/tickets/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticket.ticket_id,
          ticket_hash: ticket.ticket_hash,
          new_owner_address: transferAddress,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? "Transfer failed.");
      }
      const result = await response.json();
      setTransferStatus(result.message || "Transfer completed.");
    } catch (error: any) {
      setScanError(error?.message ?? "Transfer failed.");
    } finally {
      setLoading(false);
    }
  }

  async function startScan() {
    setScanError(null);
    setTransferStatus(null);
    setScanResult(null);
    if (!videoRef.current) {
      setScanError("Camera video element not available.");
      return;
    }
    setScanning(true);
    const codeReader = new BrowserQRCodeReader();
    codeReaderRef.current = codeReader;
    try {
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const chosenDevice = devices[0];
      if (!chosenDevice) {
        throw new Error("No camera devices found.");
      }
      const result = await codeReader.decodeOnceFromVideoDevice(chosenDevice.deviceId, videoRef.current);
      const text = result.getText();
      setScanResult(text);
      const payload = parseTicketPayload(text);
      if (!payload) {
        throw new Error("Scanned QR code is not a valid ticket payload.");
      }
      await verifyTicket(payload.ticket_id, payload.ticket_hash);
    } catch (error: any) {
      setScanError(error?.message ?? "Unable to scan QR code.");
    } finally {
      setScanning(false);
      codeReaderRef.current = null;
    }
  }

  const explorerUrl = ticket?.explorer_url || verification?.explorer_url || undefined;
  const VerificationIcon = verification?.verified ? CheckCircle2 : XCircle;

  return (
    <div className="bg-[#112240] rounded-3xl border border-white/5 p-6 overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#29B6F6]" />
            Ticket Verification
          </h3>
          <p className="text-xs text-white/50 max-w-xl">Scan the fan ticket QR code to confirm blockchain authenticity or transfer the ticket securely.</p>
        </div>
        <button
          onClick={registerTicket}
          className={cn("text-xs uppercase tracking-[0.24em] px-3 py-2 rounded-lg border transition-colors", loading ? "border-white/20 text-white/40" : "border-white/10 text-white hover:border-white/30 hover:bg-white/5")}
        >
          Refresh Ticket
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-[#0A1628] p-4">
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Your Ticket</div>
            <div className="space-y-3">
              <div className="text-sm font-bold text-white">{ticket?.fan_name ?? "Guest User"}</div>
              <div className="text-xs text-white/60">Seat: {ticket?.seat ?? "N/A"}</div>
              <div className="text-xs text-white/60">Gate: {ticket?.gate ?? "N/A"}</div>
              <div className="text-xs text-white/60">Ticket ID: {ticket?.ticket_id ?? "--"}</div>
              <div className="text-xs text-white/60">Network: {ticket?.network ?? "simulation"}</div>
            </div>
          </div>

          <div className="bg-[#08101E] rounded-3xl p-4 flex items-center justify-center">
            {ticket ? (
              <QRCode value={ticket.verification_url} size={128} />
            ) : (
              <div className="text-xs text-white/40 text-center">Generating QR code…</div>
            )}
          </div>

          <div className="mt-4 text-[11px] text-white/50 leading-relaxed space-y-2">
            <p>Scan this code at entry to verify the ticket on Polygon Mumbai or use the camera scanner.</p>
            {ticket?.blockchain_tx_hash && (
              <p className="break-all">Tx: <span className="text-[#29B6F6]">{ticket.blockchain_tx_hash}</span></p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#0A1628] p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-white/50">Scanner</span>
              <button
                onClick={startScan}
                disabled={scanning}
                className={cn("text-xs uppercase tracking-[0.24em] px-3 py-2 rounded-lg transition-colors", scanning ? "bg-white/10 text-white/50" : "bg-[#29B6F6]/10 text-[#29B6F6] hover:bg-[#29B6F6]/20")}
              >
                {scanning ? "Scanning…" : "Start Scan"}
              </button>
            </div>
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black/20">
              <video ref={videoRef} className="w-full h-48 object-cover bg-black" muted playsInline />
            </div>
            {scanResult && (
              <div className="mt-3 text-xs text-white/60">Scanned: {scanResult}</div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0A1628] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-widest text-white/50">Verification Status</span>
              {verification && (
                <VerificationIcon className={cn("w-5 h-5", verification.verified ? "text-[#00E676]" : "text-[#FF1744]")} />
              )}
            </div>
            {verification ? (
              <div className="space-y-2">
                <div className={cn("text-sm font-semibold", verification.verified ? "text-[#00E676]" : "text-[#FF1744]")}>
                  {verification.verified ? "Verified" : "Fake Ticket"}
                </div>
                <div className="text-xs text-white/50">{verification.message}</div>
                {verification.blockchain_tx_hash && (
                  <div className="text-xs text-white/60 break-all">Tx: {verification.blockchain_tx_hash}</div>
                )}
                {explorerUrl && (
                  <a href={explorerUrl} target="_blank" rel="noreferrer" className="text-xs text-[#29B6F6] hover:underline inline-flex items-center gap-1">
                    View on explorer <ArrowRightCircle className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <div className="text-xs text-white/50">Scan a ticket to reveal the verification state.</div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0A1628] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-widest text-white/50">Transfer Ticket</span>
              <Send className="w-4 h-4 text-[#29B6F6]" />
            </div>
            <input
              type="text"
              value={transferAddress}
              onChange={(event) => setTransferAddress(event.target.value)}
              placeholder="0xWalletAddress"
              className="w-full rounded-2xl border border-white/10 bg-[#08101E] px-3 py-2 text-sm text-white outline-none focus:border-[#29B6F6]"
            />
            <button
              onClick={transferTicket}
              disabled={!transferAddress || loading}
              className={cn("w-full rounded-2xl px-4 py-3 text-xs uppercase tracking-[0.24em] font-semibold transition-colors", transferAddress && !loading ? "bg-[#29B6F6] text-[#0A1628] hover:bg-[#29B6F6]/90" : "bg-white/10 text-white/40")}
            >
              Send Ticket
            </button>
            {transferStatus && <div className="text-xs text-[#00E676]">{transferStatus}</div>}
          </div>
        </div>
      </div>

      {(scanError || loading) && (
        <div className="mt-4 rounded-3xl border border-[#FF1744]/30 bg-[#FF1744]/10 p-3 text-xs text-[#FF1744]">
          {scanError ?? (loading ? "Processing blockchain request…" : null)}
        </div>
      )}
    </div>
  );
}
