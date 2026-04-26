import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Search, QrCode, MapPin, Star, Share2, Info, Navigation, ArrowRight, Bookmark, ShieldCheck, Coffee, Monitor, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { cn } from '../lib/utils';
const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

interface TicketData {
  ticket_id: string;
  fan_name: string;
  stand: string;
  section: string;
  row: string;
  seat: string;
  gate: string;
  level: number;
}

interface SeatFinderProps {
  onNavigate: (from: string, to: string) => void;
}

export function SeatFinder({ onNavigate }: SeatFinderProps) {
  const [ticketId, setTicketId] = useState('');
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [amenities, setAmenities] = useState<any>(null);
  const [nearbySeats, setNearbySeats] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (showScanner) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scannerRef.current.render((decodedText) => {
        setTicketId(decodedText);
        setShowScanner(false);
        fetchTicket(decodedText);
      }, (error) => {
        // console.warn(error);
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [showScanner]);

  const fetchTicket = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/tickets/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTicketData(data);
        fetchSeatInsights(data);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeatInsights = async (data: TicketData) => {
    try {
      const seatRes = await fetch(`${API_BASE}/api/v1/seats/${encodeURIComponent(data.stand)}/${encodeURIComponent(data.section)}/${encodeURIComponent(data.row)}`);
      if (seatRes.ok) {
        const payload = await seatRes.json();
        setAmenities(payload.amenities);
        setNearbySeats(payload.nearby_available_seats || []);
      }
    } catch {
      setAmenities(null);
      setNearbySeats([]);
    }
  };

  const shareLocation = async () => {
    if (!ticketData) return;
    setIsSharing(true);
    setShareMessage(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/fan/share-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: ticketData.fan_name || 'guest_user',
          friend_ids: ['rahul', 'anjali'],
          x: 400,
          y: 300,
          level: ticketData.level,
        }),
      });
      const payload = await response.json();
      setShareMessage(payload.shared ? 'Location shared with friends.' : 'Unable to share location.');
    } catch {
      setShareMessage('Unable to share location.');
    } finally {
      setIsSharing(false);
    }
  };

  const savePath = () => {
    if (!ticketData) return;
    const key = 'stadiumflow_saved_paths';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift({ ticketId: ticketData.ticket_id, stand: ticketData.stand, section: ticketData.section, row: ticketData.row, seat: ticketData.seat, savedAt: Date.now() });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 25)));
    setShareMessage('Navigation path saved for later.');
  };

  return (
    <div className="flex flex-col gap-6 h-full relative">
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0A1628]/95 flex flex-col items-center justify-center p-6 rounded-2xl"
          >
            <button 
              onClick={() => setShowScanner(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-sm bg-[#112240] rounded-2xl border border-white/10 overflow-hidden">
              <div id="reader"></div>
              <div className="p-4 text-center">
                <p className="text-sm font-medium">Scan Ticket QR Code</p>
                <p className="text-xs text-white/40 mt-1">Point your camera at the barcode</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#112240] rounded-2xl border border-white/5 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#00E676]/10 p-2 rounded-lg">
            <Ticket className="w-5 h-5 text-[#00E676]" />
          </div>
          <div>
            <h3 className="font-bold">Find My Seat</h3>
            <p className="text-xs text-white/40">Enter ticket ID or scan QR code</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Ticket ID (e.g. STAD-1234)"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full bg-[#0A1628] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#00E676]/50 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="p-3 bg-[#0A1628] border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
          >
            <QrCode className="w-5 h-5 text-white/60" />
          </button>
          <button 
            onClick={() => fetchTicket(ticketId)}
            className="px-6 bg-[#00E676] text-[#0A1628] font-bold rounded-xl hover:bg-[#00c864] transition-all"
          >
            Find
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {ticketData ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide"
          >
            {/* Ticket Card */}
            <div className="bg-[#112240] rounded-2xl border border-white/5 overflow-hidden">
              <div className="bg-[#00E676] p-4 text-[#0A1628]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Verified Entry</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xl font-bold">{ticketData.stand}</h4>
                <p className="text-xs font-medium opacity-80">Section {ticketData.section} • Row {ticketData.row} • Seat {ticketData.seat}</p>
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest block mb-1">Entry Gate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-[#00E676]">
                        {ticketData.gate.slice(-1)}
                      </div>
                      <span className="text-sm font-bold">{ticketData.gate}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onNavigate('gate1', 'stand_north_l1')}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all group"
                  >
                    <Navigation className="w-4 h-4 text-[#00E676]" />
                    Start Navigation
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                  </button>
                </div>

                <div className="bg-[#0A1628] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2">
                    <QrCode className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-[10px] text-white/30 uppercase font-bold">Tap to Enlarge</p>
                </div>
              </div>
            </div>

            {/* Amenities & Rating */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#112240] rounded-2xl border border-white/5 p-4">
                <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Amenities</h5>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Monitor className="w-3 h-3 text-[#00E676]" />
                    <span className="text-white/60">Screen: {amenities?.screen_visibility || 'Excellent'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Coffee className="w-3 h-3 text-[#FFD600]" />
                    <span className="text-white/60">F&B: {amenities?.distance_to_fb_m ?? 120}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#00E676]">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="font-bold">Shade: {amenities?.shade_coverage || 'High'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#112240] rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                <div>
                  <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Seat Rating</h5>
                  <div className="flex items-center gap-1 text-[#FFD600]">
                    {[1, 2, 3, 4].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                    <Star className="w-4 h-4 fill-current opacity-30" />
                  </div>
                </div>
                <p className="text-[10px] text-white/40 italic">"Great view of the bowlers from here!"</p>
              </div>
            </div>

            <div className="bg-[#112240] rounded-2xl border border-white/5 p-4">
              <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">3D Seat Preview (Simulated)</h5>
              <div className="bg-gradient-to-b from-[#1b2a4a] to-[#0A1628] rounded-xl p-4 border border-white/10">
                <div className="text-xs text-white/60 mb-2">Entry perspective to {ticketData.stand} / Section {ticketData.section}</div>
                <div className="h-24 rounded-lg bg-[#08101E] border border-white/10 relative overflow-hidden">
                  <motion.div className="absolute left-4 right-4 bottom-2 h-5 bg-[#00E676]/20 rounded" animate={{ scaleX: [0.92, 1, 0.92] }} transition={{ repeat: Infinity, duration: 3 }} />
                  <motion.div className="absolute left-8 right-8 bottom-8 h-4 bg-[#29B6F6]/20 rounded" animate={{ scaleX: [1, 0.96, 1] }} transition={{ repeat: Infinity, duration: 2.6 }} />
                  <div className="absolute right-4 top-3 text-[10px] text-[#FFD600]">Seat {ticketData.seat}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-white/60">Nearby upgrade options: {nearbySeats.join(', ') || 'N/A'}</div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <button onClick={shareLocation} disabled={isSharing} className="flex-1 py-3 bg-[#112240] border border-white/5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all disabled:opacity-60">
                <Share2 className="w-4 h-4 text-[#29B6F6]" />
                {isSharing ? 'Sharing...' : 'Share My Location'}
              </button>
              <button onClick={savePath} className="flex-1 py-3 bg-[#112240] border border-white/5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                <Bookmark className="w-4 h-4 text-[#FFD600]" />
                Save Path
              </button>
            </div>
            {shareMessage && (
              <div className="text-xs text-[#00E676] font-semibold">{shareMessage}</div>
            )}
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-20">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white mb-6 flex items-center justify-center">
              <Ticket className="w-8 h-8" />
            </div>
            <p className="text-sm">Ticket info will appear here once identified</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
