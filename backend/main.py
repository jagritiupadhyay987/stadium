import os
import json
import uuid
import ast
import re
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, constr, validator

from services.blockchain_service import BlockchainService
from services.chatbot_service import ChatbotService
from services.indoor_positioning import positioning_service
from services.voice_service import VoiceService
from services.whatsapp_service import WhatsAppService
from simulator.data_generator import StadiumSimulator
from models.navigation import stadium_nav

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(
    title="StadiumFlow StadiumFlow Backend",
    version="1.0.0",
    description="Backend endpoints for stadium notifications, ticket verification, AI voice and chatbot operations."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

WHATSAPP_ENABLED = os.getenv("WHATSAPP_ENABLED", "true").strip().lower() in {"1", "true", "yes"}
whatsapp_service = WhatsAppService(enabled=WHATSAPP_ENABLED)
blockchain_service = BlockchainService()
voice_service = VoiceService()
chatbot_service = ChatbotService()

COUNTRY_FLAGS = {
    "India": "🇮🇳",
    "Australia": "🇦🇺",
    "England": "🇬🇧",
    "Pakistan": "🇵🇰",
    "South Africa": "🇿🇦",
    "New Zealand": "🇳🇿",
    "Sri Lanka": "🇱🇰",
    "Barbados": "🇧🇧",
    "Trinidad": "🇹🇹",
    "Bangladesh": "🇧🇩",
    "UAE": "🇦🇪",
    "Afghanistan": "🇦🇫",
    "Zimbabwe": "🇿🇼",
    "Ireland": "🇮🇪",
}


def _load_global_stadiums() -> List[Dict[str, Any]]:
    shared_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "shared", "global-stadiums.js"))
    with open(shared_path, "r", encoding="utf-8") as file:
        content = file.read()
    start = content.find("[")
    end = content.rfind("]")
    if start == -1 or end == -1:
        raise RuntimeError("Unable to locate stadium array in shared/global-stadiums.js")
    js_array = content[start : end + 1]
    cleaned_lines = []
    for line in js_array.splitlines():
        stripped = line.strip()
        if stripped.startswith("//"):
            continue
        cleaned_lines.append(line)
    cleaned = "\n".join(cleaned_lines)
    cleaned = re.sub(r"(\b[a-zA-Z_][a-zA-Z0-9_]*)\s*:", r'"\1":', cleaned)
    cleaned = cleaned.replace("true", "True").replace("false", "False").replace("null", "None")
    try:
        stadiums = ast.literal_eval(cleaned)
    except Exception as exc:
        raise RuntimeError(f"Failed to parse stadium dataset: {exc}") from exc
    if not isinstance(stadiums, list) or not stadiums:
        raise RuntimeError("Stadium dataset parsed but empty.")
    return stadiums


GLOBAL_STADIUMS = _load_global_stadiums()
DEFAULT_STADIUM_ID = "aca-vdca"


def _get_stadium_or_default(stadium_id: Optional[str]) -> Dict[str, Any]:
    target_id = stadium_id or DEFAULT_STADIUM_ID
    stadium = next((item for item in GLOBAL_STADIUMS if item["id"] == target_id), None)
    if stadium:
        return stadium
    return next(item for item in GLOBAL_STADIUMS if item["id"] == DEFAULT_STADIUM_ID)


def _with_simulation(stadium: Dict[str, Any], match_type: str = "T20", time_of_day: str = "evening") -> Dict[str, Any]:
    simulator = StadiumSimulator(stadium)
    return {
        **stadium,
        "flag": COUNTRY_FLAGS.get(stadium["country"], "🏟️"),
        "zones": simulator.generate_zone_data(match_type=match_type, time_of_day=time_of_day),
        "match_schedule": simulator.get_match_schedule(),
    }


class BulkZoneAlertRequest(BaseModel):
    zone: constr(strip_whitespace=True, min_length=1)
    message: constr(strip_whitespace=True, min_length=5)
    phone_numbers: List[constr(strip_whitespace=True, min_length=8)] = Field(..., min_items=1)

    @validator("phone_numbers", each_item=True)
    def validate_phone_number(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Phone numbers must include at least 8 characters.")
        return value


class BulkZoneAlertResponse(BaseModel):
    zone: str
    sent_count: int
    message_ids: List[str]
    simulation: bool
    summary: str


class PersonalizedExitRequest(BaseModel):
    fan_name: constr(strip_whitespace=True, min_length=1)
    phone_number: constr(strip_whitespace=True, min_length=8)
    seat: constr(strip_whitespace=True, min_length=1)
    estimated_exit_time: constr(strip_whitespace=True, min_length=3)
    zone: Optional[constr(strip_whitespace=True, min_length=1)] = None


class PersonalizedExitResponse(BaseModel):
    fan_name: str
    phone_number: str
    seat: str
    estimated_exit_time: str
    zone: Optional[str]
    message_id: str
    status: str
    simulation: bool
    summary: str


class AutoWaitAlertRequest(BaseModel):
    queue_name: constr(strip_whitespace=True, min_length=1)
    current_wait_min: int = Field(..., ge=0)
    phone_numbers: List[constr(strip_whitespace=True, min_length=8)] = Field(..., min_items=1)
    threshold: int = Field(15, gt=0)

    @validator("phone_numbers", each_item=True)
    def validate_phone_number(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Phone numbers must include at least 8 characters.")
        return value


class AutoWaitAlertResponse(BaseModel):
    triggered: bool
    queue_name: str
    current_wait_min: int
    threshold: int
    message_ids: List[str]
    simulation: bool
    summary: str


class DeliveryLogResponse(BaseModel):
    id: str
    to: str
    template: str
    status: str
    metadata: dict
    simulation: bool
    timestamp: str


class DeliveryStatsResponse(BaseModel):
    total_messages: int
    delivered_messages: int
    failed_messages: int
    simulated_messages: int
    delivery_rate: float
    recent_logs: List[DeliveryLogResponse]


class TicketRegistrationRequest(BaseModel):
    fan_name: constr(strip_whitespace=True, min_length=1)
    seat: constr(strip_whitespace=True, min_length=1)
    gate: constr(strip_whitespace=True, min_length=1)
    ticket_id: Optional[constr(strip_whitespace=True, min_length=1)] = None


class TicketRegistrationResponse(BaseModel):
    ticket_id: str
    fan_name: str
    seat: str
    gate: str
    blockchain_tx_hash: str
    ticket_hash: str
    verification_url: str
    network: str
    explorer_url: Optional[str]
    simulation: bool


class TicketVerificationRequest(BaseModel):
    ticket_id: constr(strip_whitespace=True, min_length=1)
    ticket_hash: constr(strip_whitespace=True, min_length=10)


class TicketVerificationResponse(BaseModel):
    ticket_id: str
    fan_name: Optional[str]
    seat: Optional[str]
    gate: Optional[str]
    ticket_hash: str
    blockchain_tx_hash: Optional[str]
    network: str
    explorer_url: Optional[str]
    verified: bool
    verification_source: str
    simulation: bool
    message: str


class TicketTransferRequest(BaseModel):
    ticket_id: constr(strip_whitespace=True, min_length=1)
    ticket_hash: constr(strip_whitespace=True, min_length=10)
    new_owner_address: constr(strip_whitespace=True, min_length=42)


class TicketTransferResponse(BaseModel):
    ticket_id: str
    ticket_hash: str
    new_owner: str
    transferred: bool
    blockchain_tx_hash: Optional[str]
    network: str
    explorer_url: Optional[str]
    simulation: bool
    message: str


class VoiceTTSRequest(BaseModel):
    text: constr(strip_whitespace=True, min_length=1)
    language: constr(strip_whitespace=True, min_length=2) = "en"
    gender: constr(strip_whitespace=True, min_length=4) = "FEMALE"
    speaking_rate: float = Field(1.0, ge=0.5, le=2.0)
    pitch: float = Field(0.0, ge=-10.0, le=10.0)
    ssml: bool = True
    emergency: bool = False
    ambience: bool = False


class VoiceTTSResponse(BaseModel):
    language: str
    audio_base64: str
    audio_url: str
    mime_type: str
    provider_available: bool
    simulation: bool
    cached: bool
    message: str


class VoiceBatchRequest(BaseModel):
    steps: List[constr(strip_whitespace=True, min_length=1)] = Field(..., min_items=1)
    language: constr(strip_whitespace=True, min_length=2) = "en"
    gender: constr(strip_whitespace=True, min_length=4) = "FEMALE"
    speaking_rate: float = Field(1.0, ge=0.5, le=2.0)
    pitch: float = Field(0.0, ge=-10.0, le=10.0)
    emergency: bool = False


class VoiceCommandRequest(BaseModel):
    command: constr(strip_whitespace=True, min_length=1)

class ShareLocationRequest(BaseModel):
    user_id: constr(strip_whitespace=True, min_length=1)
    friend_ids: List[constr(strip_whitespace=True, min_length=1)] = Field(default_factory=list)
    x: float
    y: float
    level: int = 0


@app.get("/api/v1/stadiums/countries")
async def stadium_countries():
    countries = sorted({item["country"] for item in GLOBAL_STADIUMS})
    return [{"country": country, "flag": COUNTRY_FLAGS.get(country, "🏟️")} for country in countries]


@app.get("/api/v1/stadiums/stats")
async def stadium_stats():
    total_capacity = sum(item["capacity"] for item in GLOBAL_STADIUMS)
    avg_capacity = total_capacity / max(1, len(GLOBAL_STADIUMS))
    largest = max(GLOBAL_STADIUMS, key=lambda item: item["capacity"])
    smallest = min(GLOBAL_STADIUMS, key=lambda item: item["capacity"])
    by_country: Dict[str, int] = {}
    for item in GLOBAL_STADIUMS:
        by_country[item["country"]] = by_country.get(item["country"], 0) + 1
    return {
        "total_stadiums": len(GLOBAL_STADIUMS),
        "total_capacity": total_capacity,
        "average_capacity": int(avg_capacity),
        "largest_stadium": largest,
        "smallest_stadium": smallest,
        "stadiums_per_country": by_country,
        "floodlight_enabled": sum(1 for item in GLOBAL_STADIUMS if item.get("floodlights")),
    }


@app.get("/api/v1/stadiums/analytics")
async def stadium_analytics():
    rows = []
    for stadium in GLOBAL_STADIUMS:
        simulator = StadiumSimulator(stadium)
        efficiency = round(max(0.55, min(0.97, 0.9 - (stadium["capacity"] / 250000) + (0.03 if stadium.get("floodlights") else -0.02))), 3)
        exit_score = round(max(0.5, min(0.99, efficiency + 0.04 * (1 if stadium["capacity"] < 45000 else 0))), 3)
        ai_accuracy = round(max(0.6, min(0.99, 0.78 + (0.05 if stadium["capacity"] > 35000 else 0.02))), 3)
        rows.append({
            "stadium_id": stadium["id"],
            "name": stadium["name"],
            "country": stadium["country"],
            "crowd_management_efficiency": efficiency,
            "exit_handling_score": exit_score,
            "ai_prediction_accuracy": ai_accuracy,
            "sample_zone_count": len(simulator.generate_zone_data()),
        })
    best_exit = max(rows, key=lambda item: item["exit_handling_score"])
    ranked_accuracy = sorted(rows, key=lambda item: item["ai_prediction_accuracy"], reverse=True)
    return {
        "best_exit_stadium": best_exit,
        "ranked_by_ai_accuracy": ranked_accuracy[:10],
        "comparison": rows,
    }


@app.get("/api/v1/stadiums")
async def stadiums(
    country: Optional[str] = None,
    city: Optional[str] = None,
    min_capacity: Optional[int] = None,
    max_capacity: Optional[int] = None,
):
    filtered = GLOBAL_STADIUMS
    if country:
        filtered = [item for item in filtered if item["country"].lower() == country.lower()]
    if city:
        filtered = [item for item in filtered if city.lower() in item["city"].lower()]
    if min_capacity is not None:
        filtered = [item for item in filtered if item["capacity"] >= min_capacity]
    if max_capacity is not None:
        filtered = [item for item in filtered if item["capacity"] <= max_capacity]
    return [{**item, "flag": COUNTRY_FLAGS.get(item["country"], "🏟️")} for item in filtered]


@app.get("/api/v1/stadiums/{stadium_id}")
async def stadium_details(
    stadium_id: str,
    match_type: str = "T20",
    time_of_day: str = "evening",
):
    stadium = _get_stadium_or_default(stadium_id)
    return _with_simulation(stadium, match_type=match_type, time_of_day=time_of_day)


@app.post("/api/v1/tickets/register", response_model=TicketRegistrationResponse)
async def register_ticket(request: TicketRegistrationRequest):
    ticket_id = request.ticket_id or f"STAD-{uuid.uuid4().hex[:8].upper()}"
    ticket = blockchain_service.register_ticket(
        ticket_id=ticket_id,
        fan_name=request.fan_name,
        seat=request.seat,
        gate=request.gate,
    )
    return TicketRegistrationResponse(**ticket)


@app.get("/api/v1/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    suffix = ticket_id[-2:].upper() if len(ticket_id) >= 2 else "42"
    section = chr(65 + (ord(suffix[0]) % 6))
    row = str((ord(suffix[-1]) % 20) + 1)
    seat = str((ord(suffix[0]) + ord(suffix[-1])) % 30 + 1)
    stand = "North Stand"
    return {
        "ticket_id": ticket_id,
        "fan_name": "Guest User",
        "stand": stand,
        "section": section,
        "row": row,
        "seat": seat,
        "gate": "Gate 1",
        "level": 1,
    }


@app.post("/api/v1/tickets/verify", response_model=TicketVerificationResponse)
async def verify_ticket(request: TicketVerificationRequest):
    result = blockchain_service.verify_ticket(
        ticket_id=request.ticket_id,
        ticket_hash=request.ticket_hash,
    )
    return TicketVerificationResponse(**result)


@app.get("/api/v1/tickets/verify", response_model=TicketVerificationResponse)
async def verify_ticket_get(ticket_id: str, ticket_hash: str):
    result = blockchain_service.verify_ticket(
        ticket_id=ticket_id,
        ticket_hash=ticket_hash,
    )
    return TicketVerificationResponse(**result)


@app.get("/api/v1/navigation/path")
async def navigation_path(
    from_node: str = Query(..., alias="from"),
    to: str = Query(...),
    accessible: bool = False,
):
    details = stadium_nav.path_details(from_node, to, accessible_only=accessible)
    if not details:
        raise HTTPException(status_code=404, detail="No path found for requested nodes.")
    return details


@app.get("/api/v1/navigation/nearby")
async def navigation_nearby(seat: str, radius: str = "50m"):
    return {
        "seat": seat,
        "radius": radius,
        "amenities": [
            {"type": "FB_COURT", "name": "Food Court (L0)", "distance_m": 48},
            {"type": "RESTROOM", "name": "Restroom (L1)", "distance_m": 36},
            {"type": "SCREEN", "name": "Big Screen North", "distance_m": 52},
        ],
    }


@app.post("/api/v1/fan/share-location")
async def share_location(payload: ShareLocationRequest):
    return {
        "shared": True,
        "user_id": payload.user_id,
        "friends_notified": payload.friend_ids,
        "location": {"x": payload.x, "y": payload.y, "level": payload.level},
    }


@app.get("/api/v1/fan/friends-locations")
async def friends_locations(user_id: str = "guest_user"):
    return {
        "user_id": user_id,
        "friends": positioning_service.get_friends_locations(user_id)
    }


@app.get("/api/v1/seats/{stand}/{section}/{row}")
async def seat_details(stand: str, section: str, row: str):
    nearby = [f"{row}-{index}" for index in range(1, 6)]
    return {
        "stand": stand,
        "section": section,
        "row": row,
        "amenities": {
            "shade_coverage": "High",
            "screen_visibility": "Excellent",
            "distance_to_fb_m": 90,
            "distance_to_restroom_m": 55,
        },
        "seat_rating": {
            "view_quality": 4.6,
            "comfort": 4.2,
            "accessibility": 4.8,
        },
        "nearby_available_seats": nearby,
    }


@app.post("/api/v1/tickets/transfer", response_model=TicketTransferResponse)
async def transfer_ticket(request: TicketTransferRequest):
    result = blockchain_service.transfer_ticket(
        ticket_id=request.ticket_id,
        ticket_hash=request.ticket_hash,
        new_owner=request.new_owner_address,
    )
    return TicketTransferResponse(**result)


@app.post("/api/v1/notifications/bulk-zone-alert", response_model=BulkZoneAlertResponse)
async def bulk_zone_alert(request: BulkZoneAlertRequest):
    if not request.phone_numbers:
        raise HTTPException(status_code=400, detail="At least one phone number is required.")

    payload = whatsapp_service.send_bulk_zone_alert(
        zone=request.zone,
        message=request.message,
        phone_numbers=request.phone_numbers,
    )
    return BulkZoneAlertResponse(**payload)


@app.post("/api/v1/notifications/personalized-exit", response_model=PersonalizedExitResponse)
async def personalized_exit(request: PersonalizedExitRequest):
    payload = whatsapp_service.send_personalized_exit(
        phone_number=request.phone_number,
        fan_name=request.fan_name,
        seat=request.seat,
        estimated_exit_time=request.estimated_exit_time,
        zone=request.zone,
    )
    return PersonalizedExitResponse(**payload)


@app.post("/api/v1/notifications/auto-wait-alert", response_model=AutoWaitAlertResponse)
async def auto_wait_alert(request: AutoWaitAlertRequest):
    if request.current_wait_min < 0:
        raise HTTPException(status_code=400, detail="current_wait_min must be zero or positive.")

    payload = whatsapp_service.send_auto_wait_alert(
        queue_name=request.queue_name,
        current_wait_min=request.current_wait_min,
        phone_numbers=request.phone_numbers,
        threshold=request.threshold,
    )
    return AutoWaitAlertResponse(**payload)


@app.get("/api/v1/notifications/delivery-stats", response_model=DeliveryStatsResponse)
async def delivery_stats():
    stats = whatsapp_service.get_delivery_stats()
    return DeliveryStatsResponse(**stats)


@app.get("/api/v1/notifications/status")
async def status():
    return {
        "service": "WhatsApp Notifications",
        "enabled": WHATSAPP_ENABLED,
        "provider_available": whatsapp_service.provider_available,
        "provider_error": whatsapp_service.provider_error,
        "mode": "simulation" if not whatsapp_service.provider_available else "live"
    }


@app.post("/api/v1/voice/tts", response_model=VoiceTTSResponse)
async def voice_tts(request: VoiceTTSRequest):
    result = voice_service.announce(
        text=request.text,
        language=request.language,
        gender=request.gender,
        speaking_rate=request.speaking_rate,
        pitch=request.pitch,
        use_ssml=request.ssml,
        emergency=request.emergency,
        add_ambience=request.ambience,
    )
    return VoiceTTSResponse(**result)


@app.post("/api/v1/voice/batch")
async def voice_batch(request: VoiceBatchRequest):
    return voice_service.generate_batch(
        steps=list(request.steps),
        language=request.language,
        gender=request.gender,
        speaking_rate=request.speaking_rate,
        pitch=request.pitch,
        emergency=request.emergency,
    )


@app.get("/api/v1/voice/download/{language}")
async def voice_download(language: str):
    return voice_service.build_offline_pack(language=language.lower())


@app.post("/api/v1/voice/command")
async def voice_command(request: VoiceCommandRequest):
    return voice_service.process_command(request.command)


@app.get("/api/v1/voice/cache/status")
async def voice_cache_status():
    return voice_service.get_cache_status()


@app.get("/api/v1/voice/analytics")
async def voice_analytics():
    status_payload = voice_service.get_cache_status()
    command_counts = voice_service.command_counts
    most_common = sorted(command_counts.items(), key=lambda item: item[1], reverse=True)[:5]
    return {
        "active_voice_users": max(14, min(400, voice_service.generated_count // 2 + 24)),
        "most_common_commands": [{"command": cmd, "count": count} for cmd, count in most_common],
        "completion_rate_per_stand": {
            "Stand A": 0.82,
            "Stand C": 0.77,
            "N-Stand": 0.89,
            "Pavilion": 0.75,
        },
        "language_preferences": {
            "en": 0.46,
            "hi": 0.25,
            "te": 0.12,
            "ta": 0.10,
            "bn": 0.07,
        },
        "overload_alert": status_payload.get("overloaded", False),
        "status": status_payload,
    }
