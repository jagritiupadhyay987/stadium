import json
import os
from typing import Any, Dict, Optional


class ChatbotService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_GEMINI_API_KEY", "")
        self.provider_available = False
        self.generativeai = None
        self._initialize_client()

    def _initialize_client(self) -> None:
        if not self.api_key:
            return
        try:
            from google import generativeai
            self.generativeai = generativeai
            generativeai.configure(api_key=self.api_key)
            self.provider_available = True
        except Exception:
            self.provider_available = False
            self.generativeai = None

    def query(self, user_query: str, context_state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        prompt = self._build_prompt(user_query, context_state)
        if self.provider_available and self.generativeai:
            try:
                response = self.generativeai.generate_text(
                    model="gemini-pro",
                    prompt=prompt,
                    temperature=0.3,
                    max_output_tokens=450,
                )
                text = response.text if hasattr(response, "text") else str(response)
                return {
                    "response_text": text.strip(),
                    "provider_available": True,
                    "simulation": False,
                }
            except Exception as exc:
                return self._simulate_response(user_query, str(exc))
        return self._simulate_response(user_query, "Gemini API unavailable.")

    def _build_prompt(self, user_query: str, context_state: Optional[Dict[str, Any]] = None) -> str:
        base = (
            "You are StadiumFlow Ops Assistant. Provide concise, operational guidance, incident summaries, "
            "and next steps for stadium operations teams."
        )
        if context_state:
            try:
                context_json = json.dumps(context_state, indent=2)
                base += f"\n\nCurrent stadium state:\n{context_json}\n"
            except Exception:
                base += "\n\nCurrent stadium state is available but could not be serialized.\n"
        base += f"\n\nUser query: {user_query}\n\nResponse:"
        return base

    def _simulate_response(self, user_query: str, error_message: str) -> Dict[str, Any]:
        response_text = (
            "This is a simulated stadium ops chatbot response. "
            "In production, this would come from Google Gemini. "
            f"Query received: {user_query}"
        )
        return {
            "response_text": response_text,
            "provider_available": False,
            "simulation": True,
            "message": error_message,
        }
