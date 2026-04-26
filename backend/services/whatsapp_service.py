import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client


class WhatsAppService:
    def __init__(self, enabled: bool = False):
        self.enabled = enabled
        self._logs: List[Dict[str, Any]] = []
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.whatsapp_from = os.getenv("TWILIO_WHATSAPP_FROM")
        self.client: Optional[Client] = None
        self.provider_error: Optional[str] = None
        self.provider_available = False

        if self.enabled:
            if not all([self.twilio_account_sid, self.twilio_auth_token, self.whatsapp_from]):
                self.provider_error = (
                    "Missing Twilio credentials: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM "
                    "must all be set to enable live WhatsApp sending."
                )
                self.enabled = False
            else:
                self.client = Client(self.twilio_account_sid, self.twilio_auth_token)
                self.provider_available = True

    def _record_log(self, to: str, template: str, status: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        log_entry = {
            "id": str(uuid.uuid4()),
            "to": to,
            "template": template,
            "status": status,
            "metadata": metadata or {},
            "simulation": not self.enabled,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        self._logs.append(log_entry)
        return log_entry

    def _send_message(self, to: str, template: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if self.enabled and self.provider_available and self.client:
            try:
                message = self.client.messages.create(
                    body=body,
                    from_=self.whatsapp_from,
                    to=f"whatsapp:{to}"
                )
                status = message.status.upper() if hasattr(message, "status") else "SENT"
                return self._record_log(
                    to=to,
                    template=template,
                    status=status,
                    metadata={**(metadata or {}), "body": body, "provider_message_sid": getattr(message, "sid", None)},
                )
            except TwilioRestException as exc:
                return self._record_log(
                    to=to,
                    template=template,
                    status="FAILED",
                    metadata={**(metadata or {}), "body": body, "error": str(exc)},
                )
        status = "SIMULATED"
        return self._record_log(to=to, template=template, status=status, metadata={**(metadata or {}), "body": body})

    def send_bulk_zone_alert(self, zone: str, message: str, phone_numbers: List[str]) -> Dict[str, Any]:
        message_ids: List[str] = []
        for phone in phone_numbers:
            log_entry = self._send_message(
                to=phone,
                template="zone_alert",
                body=f"Zone {zone} alert: {message}",
                metadata={"zone": zone}
            )
            message_ids.append(log_entry["id"])

        return {
            "zone": zone,
            "sent_count": len(message_ids),
            "message_ids": message_ids,
            "simulation": not self.enabled,
            "summary": f"Bulk WhatsApp alert sent to {len(message_ids)} phones in zone {zone}."
        }

    def send_personalized_exit(self, phone_number: str, fan_name: str, seat: str, estimated_exit_time: str, zone: Optional[str] = None) -> Dict[str, Any]:
        body = (
            f"Hi {fan_name}! Your exit recommendation for seat {seat} is {estimated_exit_time}."
            + (f" Please exit through {zone}." if zone else "")
        )
        log_entry = self._send_message(
            to=phone_number,
            template="personalized_exit",
            body=body,
            metadata={"fan_name": fan_name, "seat": seat, "zone": zone}
        )

        return {
            "phone_number": phone_number,
            "fan_name": fan_name,
            "seat": seat,
            "estimated_exit_time": estimated_exit_time,
            "zone": zone,
            "message_id": log_entry["id"],
            "status": log_entry["status"],
            "simulation": not self.enabled,
            "summary": "Personalized exit time message queued." if self.enabled else "Personalized exit message simulated."
        }

    def send_auto_wait_alert(self, queue_name: str, current_wait_min: int, phone_numbers: List[str], threshold: int = 15) -> Dict[str, Any]:
        triggered = current_wait_min > threshold
        message_ids: List[str] = []
        summary = "Queue is below threshold; no alert sent."

        if triggered:
            for phone in phone_numbers:
                log_entry = self._send_message(
                    to=phone,
                    template="auto_wait_alert",
                    body=(
                        f"Alert: {queue_name} wait time is {current_wait_min} minutes."
                        f" Please use an alternate route or wait time updates from the staff."
                    ),
                    metadata={"queue_name": queue_name, "current_wait_min": current_wait_min}
                )
                message_ids.append(log_entry["id"])
            summary = f"Auto wait alert triggered for {queue_name}. Sent {len(message_ids)} WhatsApp messages."

        return {
            "triggered": triggered,
            "queue_name": queue_name,
            "current_wait_min": current_wait_min,
            "threshold": threshold,
            "message_ids": message_ids,
            "simulation": not self.enabled,
            "summary": summary
        }

    def get_delivery_stats(self) -> Dict[str, Any]:
        total = len(self._logs)
        delivered = sum(1 for item in self._logs if item["status"] == "DELIVERED")
        failed = sum(1 for item in self._logs if item["status"] == "FAILED")
        simulated = sum(1 for item in self._logs if item["simulation"])
        delivery_rate = float(delivered) / total if total else 0.0
        return {
            "total_messages": total,
            "delivered_messages": delivered,
            "failed_messages": failed,
            "simulated_messages": simulated,
            "delivery_rate": round(delivery_rate * 100, 2),
            "recent_logs": list(reversed(self._logs[-10:]))
        }
