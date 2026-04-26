import base64
import hashlib
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from models.voice_cache import voice_cache


class VoiceService:
    VOICE_MAP: Dict[str, Dict[str, Dict[str, str]]] = {
        "en": {
            "MALE": {"language_code": "en-US", "name": "en-US-Wavenet-D"},
            "FEMALE": {"language_code": "en-US", "name": "en-US-Wavenet-F"},
        },
        "hi": {
            "MALE": {"language_code": "hi-IN", "name": "hi-IN-Wavenet-B"},
            "FEMALE": {"language_code": "hi-IN", "name": "hi-IN-Wavenet-A"},
        },
        "te": {
            "MALE": {"language_code": "te-IN", "name": "te-IN-Standard-B"},
            "FEMALE": {"language_code": "te-IN", "name": "te-IN-Standard-A"},
        },
        "ta": {
            "MALE": {"language_code": "ta-IN", "name": "ta-IN-Standard-B"},
            "FEMALE": {"language_code": "ta-IN", "name": "ta-IN-Standard-A"},
        },
        "bn": {
            "MALE": {"language_code": "bn-IN", "name": "bn-IN-Standard-B"},
            "FEMALE": {"language_code": "bn-IN", "name": "bn-IN-Standard-A"},
        },
    }

    def __init__(self):
        self.provider_available = False
        self.client = None
        self.provider_error: Optional[str] = None
        self.generated_count = 0
        self.failed_count = 0
        self.command_counts: Dict[str, int] = {}
        self.output_dir = Path(os.path.dirname(__file__)).parent / "static" / "voice"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._initialize_client()
        voice_cache.pre_generate_common_phrases("en")

    def _initialize_client(self) -> None:
        try:
            from google.cloud import texttospeech
            self.texttospeech = texttospeech
            self.client = texttospeech.TextToSpeechClient()
            self.provider_available = True
            self.provider_error = None
        except Exception as exc:
            self.provider_available = False
            self.client = None
            self.provider_error = str(exc)

    @staticmethod
    def _hash_audio_key(text: str, language: str, settings: Dict[str, Any]) -> str:
        raw = f"{text}|{language}|{settings}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @staticmethod
    def _to_ssml(text: str, urgent: bool = False) -> str:
        emphasis = "strong" if urgent else "moderate"
        return (
            f"<speak><prosody rate='medium'><emphasis level='{emphasis}'>"
            f"{text.replace('Stadium', '<say-as interpret-as=\"characters\">Stadium</say-as>')}"
            "</emphasis></prosody></speak>"
        )

    def _pick_voice(self, language: str, gender: str) -> Dict[str, str]:
        language = language.lower()
        gender = gender.upper()
        language_map = self.VOICE_MAP.get(language, self.VOICE_MAP["en"])
        return language_map.get(gender, language_map.get("FEMALE"))  # type: ignore[return-value]

    def _persist_audio_file(self, file_hash: str, audio_content: bytes) -> str:
        out_path = self.output_dir / f"{file_hash}.mp3"
        out_path.write_bytes(audio_content)
        return f"/static/voice/{file_hash}.mp3"

    def announce(
        self,
        text: str,
        language: str = "en",
        gender: str = "FEMALE",
        speaking_rate: float = 1.0,
        pitch: float = 0.0,
        use_ssml: bool = True,
        emergency: bool = False,
        add_ambience: bool = False,
    ) -> Dict[str, Any]:
        voice_config = self._pick_voice(language, gender)
        settings = {
            "gender": gender.upper(),
            "speaking_rate": speaking_rate,
            "pitch": pitch,
            "ssml": use_ssml,
            "emergency": emergency,
            "ambience": add_ambience,
        }
        cache_audio = voice_cache.get_audio(text, language, settings)
        cache_hash = self._hash_audio_key(text, language, settings)
        if cache_audio:
            return {
                "language": language,
                "audio_base64": cache_audio,
                "audio_url": f"/static/voice/{cache_hash}.mp3",
                "mime_type": "audio/mpeg",
                "provider_available": self.provider_available,
                "simulation": not self.provider_available,
                "cached": True,
                "message": "Cached voice announcement returned.",
            }

        if self.provider_available and self.client:
            try:
                ssml = self._to_ssml(text, urgent=emergency) if use_ssml else None
                synthesis_input = (
                    self.texttospeech.SynthesisInput(ssml=ssml)
                    if ssml
                    else self.texttospeech.SynthesisInput(text=text)
                )
                voice = self.texttospeech.VoiceSelectionParams(
                    language_code=voice_config["language_code"],
                    name=voice_config["name"],
                )
                audio_config = self.texttospeech.AudioConfig(
                    audio_encoding=self.texttospeech.AudioEncoding.MP3,
                    speaking_rate=max(0.5, min(2.0, speaking_rate)),
                    pitch=max(-10.0, min(10.0, pitch + (2.5 if emergency else 0.0))),
                )
                response = self.client.synthesize_speech(
                    input=synthesis_input,
                    voice=voice,
                    audio_config=audio_config,
                )
                audio_base64 = base64.b64encode(response.audio_content).decode("utf-8")
                audio_url = self._persist_audio_file(cache_hash, response.audio_content)
                voice_cache.set_audio(
                    text=text,
                    language=language,
                    settings=settings,
                    audio_base64=audio_base64,
                    is_emergency=emergency,
                )
                self.generated_count += 1
                return {
                    "language": language,
                    "audio_base64": audio_base64,
                    "audio_url": audio_url,
                    "mime_type": "audio/mpeg",
                    "provider_available": True,
                    "simulation": False,
                    "cached": False,
                    "emergency": emergency,
                    "ambience_enabled": add_ambience,
                    "message": "Voice announcement generated successfully.",
                }
            except Exception as exc:
                self.failed_count += 1
                return self._simulate_response(text, language, str(exc))
        return self._simulate_response(text, language, "Google Cloud Text-to-Speech unavailable.")

    def _simulate_response(self, text: str, language: str, error_message: str) -> Dict[str, Any]:
        fake_audio = base64.b64encode(f"Voice alert: {text}".encode("utf-8")).decode("utf-8")
        self.failed_count += 1
        return {
            "language": language,
            "audio_base64": fake_audio,
            "audio_url": "",
            "mime_type": "audio/mpeg",
            "provider_available": False,
            "simulation": True,
            "cached": False,
            "message": f"Simulated voice announcement. {error_message}",
        }

    def generate_batch(
        self,
        steps: List[str],
        language: str,
        gender: str,
        speaking_rate: float,
        pitch: float,
        emergency: bool = False,
    ) -> Dict[str, Any]:
        outputs = [
            self.announce(
                text=step,
                language=language,
                gender=gender,
                speaking_rate=speaking_rate,
                pitch=pitch,
                emergency=emergency,
            )
            for step in steps
        ]
        return {
            "count": len(outputs),
            "items": outputs,
            "language": language,
            "message": "Batch route voice pack generated.",
        }

    def process_command(self, command: str) -> Dict[str, Any]:
        normalized = command.lower().strip()
        command_map = {
            "where is my seat": {"action": "navigate", "target": "seat"},
            "nearest food": {"action": "navigate", "target": "food"},
            "nearest restroom": {"action": "navigate", "target": "restroom"},
            "emergency exit": {"action": "navigate", "target": "exit"},
            "find my friend": {"action": "social", "target": "friend"},
            "replay last wicket": {"action": "replay", "target": "last_wicket"},
            "what is the score": {"action": "score", "target": "live"},
            "switch to hindi": {"action": "language", "target": "hi"},
            "repeat": {"action": "playback", "target": "repeat"},
            "next": {"action": "playback", "target": "next"},
            "previous": {"action": "playback", "target": "previous"},
            "pause": {"action": "playback", "target": "pause"},
        }
        matched = next((key for key in command_map if key in normalized), None)
        if matched:
            self.command_counts[matched] = self.command_counts.get(matched, 0) + 1
            return {"ok": True, "command": matched, **command_map[matched]}
        return {"ok": False, "command": normalized, "action": "unknown", "target": None}

    def get_cache_status(self) -> Dict[str, Any]:
        cache = voice_cache.get_status()
        overloaded = self.failed_count > (self.generated_count * 0.5 + 10)
        return {
            "provider_available": self.provider_available,
            "provider_error": self.provider_error,
            "generated_count": self.generated_count,
            "failed_count": self.failed_count,
            "overloaded": overloaded,
            "cache": cache,
        }

    def build_offline_pack(self, language: str) -> Dict[str, Any]:
        phrases = [
            "Proceed to your seat.",
            "Turn left at the next junction.",
            "Restroom is 30 meters ahead.",
            "Food court is on your right.",
            "Emergency exit route active. Move calmly.",
        ]
        bundle = self.generate_batch(
            steps=phrases,
            language=language,
            gender="FEMALE",
            speaking_rate=1.0,
            pitch=0.0,
            emergency=False,
        )
        return {"language": language, "pack_size": len(bundle["items"]), "items": bundle["items"]}
