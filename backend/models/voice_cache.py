import hashlib
import json
import os
from typing import Dict, List, Optional

try:
    import redis  # type: ignore
except Exception:
    redis = None

class VoiceCache:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        if redis is None:
            self.client = None
            self.enabled = False
            return
        try:
            self.client = redis.from_url(self.redis_url)
            self.enabled = True
        except Exception:
            print("Redis not available, voice cache disabled.")
            self.client = None
            self.enabled = False

    def _generate_key(self, text: str, language: str, settings: Dict) -> str:
        settings_str = json.dumps(settings, sort_keys=True)
        raw = f"{text}:{language}:{settings_str}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def get_audio(self, text: str, language: str, settings: Dict) -> Optional[str]:
        if not self.enabled:
            return None
        key = f"voice:{self._generate_key(text, language, settings)}"
        value = self.client.get(key)
        if isinstance(value, bytes):
            return value.decode("utf-8")
        return value

    def set_audio(self, text: str, language: str, settings: Dict, audio_base64: str, is_emergency: bool = False):
        if not self.enabled:
            return
        key = f"voice:{self._generate_key(text, language, settings)}"
        # TTL: 24 hours for navigation, 7 days for alerts (emergency)
        ttl = 604800 if is_emergency else 86400
        self.client.setex(key, ttl, audio_base64)
        self.client.zadd("voice:recent_keys", {key: int(os.times().elapsed)})
        self.client.expire("voice:recent_keys", 604800)

    def pre_generate_common_phrases(self, language: str = "en") -> List[str]:
        if not self.enabled or self.client is None:
            return []
        phrases = [
            "Turn left after 20 meters.",
            "Turn right after 30 meters.",
            "Proceed straight for 50 meters.",
            "You have reached your destination.",
            "Emergency exit is ahead. Please move calmly.",
        ]
        seeded: List[str] = []
        for phrase in phrases:
            key = f"voice:{self._generate_key(phrase, language, {'mode': 'pregenerated'})}"
            if not self.client.exists(key):
                self.client.setex(key, 86400, "PENDING_GENERATION")
            seeded.append(key)
        return seeded

    def get_status(self) -> Dict:
        if not self.enabled:
            return {"enabled": False, "message": "Redis unavailable"}
        recent_keys = self.client.zrevrange("voice:recent_keys", 0, 9)
        decoded_recent = [key.decode("utf-8") if isinstance(key, bytes) else str(key) for key in recent_keys]
        return {
            "enabled": True,
            "keys_count": self.client.dbsize() if self.client else 0,
            "recent_keys": decoded_recent,
            "message": "Redis cache active"
        }

voice_cache = VoiceCache()
