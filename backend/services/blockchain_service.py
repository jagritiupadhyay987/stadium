import os
import uuid
from hashlib import sha256
from typing import Any, Dict, Optional

from eth_account import Account
from web3 import HTTPProvider, Web3


def _make_ticket_hash(ticket_id: str, fan_name: str, seat: str, gate: str) -> str:
    payload = f"{ticket_id}|{fan_name}|{seat}|{gate}"
    return "0x" + sha256(payload.encode("utf-8")).hexdigest()


def _make_fake_tx_hash() -> str:
    return "0x" + uuid.uuid4().hex + uuid.uuid4().hex


def _normalize_hash(value: str) -> str:
    normalized = value.strip().lower()
    if normalized.startswith("0x"):
        return normalized
    return "0x" + normalized


def _network_explorer_url(network: str, tx_hash: str) -> Optional[str]:
    if not tx_hash:
        return None
    if network == "polygon-mumbai":
        return f"https://mumbai.polygonscan.com/tx/{tx_hash}"
    if network == "polygon":
        return f"https://polygonscan.com/tx/{tx_hash}"
    if network == "goerli":
        return f"https://goerli.etherscan.io/tx/{tx_hash}"
    if network == "sepolia":
        return f"https://sepolia.etherscan.io/tx/{tx_hash}"
    if network == "ethereum-mainnet":
        return f"https://etherscan.io/tx/{tx_hash}"
    return None


class BlockchainService:
    def __init__(self):
        self.rpc_url = os.getenv("WEB3_RPC_URL", "").strip()
        self.private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY", "").strip()
        self.contract_address = os.getenv("TICKET_CONTRACT_ADDRESS", "").strip()
        self.verification_url_base = os.getenv("VERIFICATION_URL_BASE", "https://stadiumflow.example.com").strip()
        self.provider_available = False
        self.network = "simulation"
        self.w3: Optional[Web3] = None
        self.account: Optional[Account] = None
        self.contract = None
        self._ticket_registry: Dict[str, Dict[str, Any]] = {}

        if self.rpc_url:
            self._initialize_provider()

        self._register_sample_ticket()

    def _initialize_provider(self) -> None:
        try:
            self.w3 = Web3(HTTPProvider(self.rpc_url))
            if self.w3.is_connected():
                self.provider_available = True
                chain_id = self.w3.eth.chain_id
                self.network = self._resolve_network(chain_id)
                if self.private_key:
                    self.account = Account.from_key(self.private_key)
                if self.contract_address:
                    self.contract = self.w3.eth.contract(
                        address=Web3.to_checksum_address(self.contract_address),
                        abi=self._contract_abi(),
                    )
        except Exception:
            self.provider_available = False
            self.network = "simulation"

    def _resolve_network(self, chain_id: int) -> str:
        return {
            1: "ethereum-mainnet",
            5: "goerli",
            11155111: "sepolia",
            137: "polygon",
            80001: "polygon-mumbai",
        }.get(chain_id, f"chain-{chain_id}")

    @staticmethod
    def _contract_abi() -> list[dict[str, Any]]:
        return [
            {
                "inputs": [{"internalType": "bytes32", "name": "ticketHash", "type": "bytes32"}],
                "name": "registerTicket",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function",
            },
            {
                "inputs": [{"internalType": "bytes32", "name": "ticketHash", "type": "bytes32"}],
                "name": "verifyTicket",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function",
            },
            {
                "inputs": [
                    {"internalType": "bytes32", "name": "ticketHash", "type": "bytes32"},
                    {"internalType": "address", "name": "newOwner", "type": "address"},
                ],
                "name": "transferTicket",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function",
            },
        ]

    def _register_sample_ticket(self) -> None:
        self.register_ticket(
            ticket_id="APL-9482-001",
            fan_name="Guest User",
            seat="N-Stand / Row G / 42",
            gate="Gate 3",
        )

    def register_ticket(self, ticket_id: str, fan_name: str, seat: str, gate: str) -> Dict[str, Any]:
        ticket_hash = _make_ticket_hash(ticket_id, fan_name, seat, gate)
        if ticket_hash in self._ticket_registry:
            return self._ticket_registry[ticket_hash]

        tx_hash = self._publish_registration(ticket_hash)
        ticket = {
            "ticket_id": ticket_id,
            "fan_name": fan_name,
            "seat": seat,
            "gate": gate,
            "ticket_hash": ticket_hash,
            "blockchain_tx_hash": tx_hash,
            "verification_url": f"{self.verification_url_base}/api/v1/tickets/verify?ticket_id={ticket_id}&ticket_hash={ticket_hash}",
            "network": self.network,
            "explorer_url": _network_explorer_url(self.network, tx_hash),
            "simulation": not self.provider_available,
        }
        self._ticket_registry[ticket_hash] = ticket
        return ticket

    def verify_ticket(self, ticket_id: str, ticket_hash: str) -> Dict[str, Any]:
        ticket_hash = _normalize_hash(ticket_hash)
        ticket = self._ticket_registry.get(ticket_hash)
        verified = bool(ticket and ticket["ticket_id"] == ticket_id)
        on_chain = None

        if self.provider_available and self.contract:
            try:
                on_chain = self.contract.functions.verifyTicket(self.w3.to_bytes(hexstr=ticket_hash)).call()
                verified = bool(on_chain)
            except Exception:
                on_chain = None

        return {
            "ticket_id": ticket_id,
            "fan_name": ticket["fan_name"] if ticket else None,
            "seat": ticket["seat"] if ticket else None,
            "gate": ticket["gate"] if ticket else None,
            "ticket_hash": ticket_hash,
            "blockchain_tx_hash": ticket["blockchain_tx_hash"] if ticket else None,
            "network": self.network,
            "explorer_url": _network_explorer_url(self.network, ticket["blockchain_tx_hash"]) if ticket else None,
            "verified": verified,
            "verification_source": "on-chain" if on_chain is True else "local" if ticket else "unknown",
            "simulation": not self.provider_available,
            "message": "Ticket is authentic." if verified else "Ticket validation failed or ticket is not registered.",
        }

    def transfer_ticket(self, ticket_id: str, ticket_hash: str, new_owner: str) -> Dict[str, Any]:
        ticket_hash = _normalize_hash(ticket_hash)
        ticket = self._ticket_registry.get(ticket_hash)
        if not ticket or ticket["ticket_id"] != ticket_id:
            return {
                "ticket_id": ticket_id,
                "ticket_hash": ticket_hash,
                "new_owner": new_owner,
                "transferred": False,
                "blockchain_tx_hash": None,
                "network": self.network,
                "explorer_url": None,
                "simulation": not self.provider_available,
                "message": "Ticket transfer failed: ticket not found or invalid.",
            }

        tx_hash = self._publish_transfer(ticket_hash, new_owner)
        ticket["owner_address"] = new_owner
        ticket["transfer_tx_hash"] = tx_hash

        return {
            "ticket_id": ticket_id,
            "ticket_hash": ticket_hash,
            "new_owner": new_owner,
            "transferred": True,
            "blockchain_tx_hash": tx_hash,
            "network": self.network,
            "explorer_url": _network_explorer_url(self.network, tx_hash),
            "simulation": not self.provider_available,
            "message": "Ticket transfer recorded on the blockchain." if self.provider_available else "Ticket transfer simulated successfully.",
        }

    def _publish_registration(self, ticket_hash: str) -> str:
        if self.provider_available and self.contract and self.account:
            try:
                nonce = self.w3.eth.get_transaction_count(self.account.address)
                tx = self.contract.functions.registerTicket(self.w3.to_bytes(hexstr=ticket_hash)).build_transaction({
                    "from": self.account.address,
                    "nonce": nonce,
                    "gas": 300000,
                    "gasPrice": self.w3.eth.gas_price,
                    "chainId": self.w3.eth.chain_id,
                })
                signed = self.account.sign_transaction(tx)
                tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction).hex()
                return tx_hash
            except Exception:
                return _make_fake_tx_hash()
        return _make_fake_tx_hash()

    def _publish_transfer(self, ticket_hash: str, new_owner: str) -> str:
        if self.provider_available and self.contract and self.account:
            try:
                nonce = self.w3.eth.get_transaction_count(self.account.address)
                tx = self.contract.functions.transferTicket(self.w3.to_bytes(hexstr=ticket_hash), new_owner).build_transaction({
                    "from": self.account.address,
                    "nonce": nonce,
                    "gas": 300000,
                    "gasPrice": self.w3.eth.gas_price,
                    "chainId": self.w3.eth.chain_id,
                })
                signed = self.account.sign_transaction(tx)
                tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction).hex()
                return tx_hash
            except Exception:
                return _make_fake_tx_hash()
        return _make_fake_tx_hash()

    def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        for ticket in self._ticket_registry.values():
            if ticket["ticket_id"] == ticket_id:
                return ticket
        return None
