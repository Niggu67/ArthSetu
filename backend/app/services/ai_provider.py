from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import httpx
from app.config import settings


class AIProviderError(Exception):
    """Base exception for AI provider errors."""
    pass


class MissingAPIKeyError(AIProviderError):
    """Raised when an API key is missing or blank."""
    def __init__(self, provider: str, env_var: str):
        self.provider = provider
        self.env_var = env_var
        super().__init__(
            f"AI provider '{provider}' requires an API key, but '{env_var}' is not configured in backend/.env."
        )


class BaseAIProvider(ABC):
    """Abstract base class for all AI service providers."""

    @abstractmethod
    async def generate_response(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> str:
        """
        Generate text response given conversation history and system instructions.
        messages: List of {"role": "user"|"assistant", "content": "..."}
        """
        pass


class GeminiProvider(BaseAIProvider):
    """Google Gemini API provider implementation using asynchronous httpx."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        # Configurable model ID; default to gemini-3.6-flash if unset
        self.model = model or settings.AI_MODEL or "gemini-3.6-flash"

    async def generate_response(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> str:
        if not self.api_key:
            raise MissingAPIKeyError(provider="Gemini", env_var="GEMINI_API_KEY")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        # Convert roles: OpenAI/Standard "assistant" maps to Gemini "model"
        gemini_contents = []
        for m in messages:
            role = "model" if m.get("role") == "assistant" else "user"
            gemini_contents.append({
                "role": role,
                "parts": [{"text": m.get("content", "")}]
            })

        payload = {
            "contents": gemini_contents,
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=payload)
                if response.status_code != 200:
                    error_detail = response.text
                    try:
                        error_json = response.json()
                        error_detail = error_json.get("error", {}).get("message", response.text)
                    except Exception:
                        pass
                    raise AIProviderError(f"Gemini API returned HTTP {response.status_code}: {error_detail}")

                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return "ArthSetu AI was unable to generate a response. Please rephrase your query."

                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    return "ArthSetu AI received an empty response. Please try again."

                return parts[0].get("text", "").strip()
            except httpx.TimeoutException:
                raise AIProviderError("Gemini API request timed out. Please verify network connectivity.")
            except httpx.RequestError as exc:
                raise AIProviderError(f"Network error communicating with Gemini API: {exc}")


class OpenAIProvider(BaseAIProvider):
    """OpenAI API provider implementation using asynchronous httpx."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        # Configurable model ID; default to gpt-4o-mini if unset
        self.model = model or settings.AI_MODEL or "gpt-4o-mini"

    async def generate_response(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> str:
        if not self.api_key:
            raise MissingAPIKeyError(provider="OpenAI", env_var="OPENAI_API_KEY")

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        openai_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            openai_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        payload = {
            "model": self.model,
            "messages": openai_messages,
            "temperature": 0.2,
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    error_detail = response.text
                    try:
                        error_json = response.json()
                        error_detail = error_json.get("error", {}).get("message", response.text)
                    except Exception:
                        pass
                    raise AIProviderError(f"OpenAI API returned HTTP {response.status_code}: {error_detail}")

                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    return "ArthSetu AI was unable to generate a response. Please try again."

                return choices[0].get("message", {}).get("content", "").strip()
            except httpx.TimeoutException:
                raise AIProviderError("OpenAI API request timed out. Please verify network connectivity.")
            except httpx.RequestError as exc:
                raise AIProviderError(f"Network error communicating with OpenAI API: {exc}")


class MockAIProvider(BaseAIProvider):
    """Deterministic mock provider for unit tests and local development."""

    def __init__(self, response_text: Optional[str] = None):
        self.response_text = response_text

    async def generate_response(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> str:
        if self.response_text:
            return self.response_text

        last_user_message = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_message = m.get("content", "").lower()
                break

        if "mudra" in last_user_message or "pmmy" in last_user_message:
            return (
                "Pradhan Mantri Mudra Yojana (PMMY) [SCHEME_ID: 1] provides collateral-free business loans "
                "up to ₹10 Lakhs in three tiers: Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5 Lakhs), "
                "and Tarun (₹5 Lakhs to ₹10 Lakhs). You can check your eligibility or view official scheme details."
            )
        elif "pmegp" in last_user_message or "subsidy" in last_user_message:
            return (
                "The Prime Minister's Employment Generation Programme (PMEGP) [SCHEME_ID: 2] offers credit-linked "
                "government subsidies up to 35% for setting up new micro-enterprises in rural areas. "
                "Project limits are up to ₹50 Lakhs for manufacturing."
            )
        elif "learn" in last_user_message or "credit score" in last_user_message or "bookkeeping" in last_user_message:
            return (
                "Maintaining daily bookkeeping records and a healthy bank balance helps build a reliable "
                "credit profile for your enterprise. Explore our financial education modules to learn practical bookkeeping."
            )
        else:
            return (
                "Hello! As your ArthSetu financial guidance assistant, I can help you understand government schemes "
                "like PMMY [SCHEME_ID: 1], check eligibility for business loans, or learn financial basics for your enterprise."
            )


def get_ai_provider() -> BaseAIProvider:
    """Factory creating the configured provider instance."""
    provider_type = (settings.AI_PROVIDER or "gemini").strip().lower()

    if provider_type == "openai":
        return OpenAIProvider()
    elif provider_type == "mock":
        return MockAIProvider()
    else:
        # Default to Gemini
        return GeminiProvider()
