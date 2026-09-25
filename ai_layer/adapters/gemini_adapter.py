import json
import time
import ssl
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from .base import BaseAIProviderAdapter
from ..types import AIRequest, AIResponse, ResponseStatus

class GeminiProviderAdapter(BaseAIProviderAdapter):
    """
    Adapter for Google Gemini API (gemini-2.5-flash, gemini-2.0-flash, etc.).
    """
    def __init__(self, api_key: str = "", default_model: str = "gemini-2.5-flash"):
        super().__init__(provider_name="gemini", default_model=default_model, api_key=api_key)

    def generate_completion(self, request: AIRequest) -> AIResponse:
        start_time = time.time()
        api_key = self.api_key or (request.metadata.get("api_key") if request.metadata else "")
        model = self.default_model

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        body = {
            "contents": [{"role": "user", "parts": [{"text": request.user_prompt}]}],
            "generationConfig": {
                "temperature": request.temperature if request.temperature is not None else 0.1,
                "maxOutputTokens": request.max_tokens if request.max_tokens is not None else 2048
            }
        }
        if request.system_prompt:
            body["systemInstruction"] = {"parts": [{"text": request.system_prompt}]}
        if request.require_structured:
            body["generationConfig"]["responseMimeType"] = "application/json"

        req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
        timeout_val = request.timeout or 45
        ctx = ssl._create_unverified_context()

        try:
            with urllib.request.urlopen(req, timeout=timeout_val, context=ctx) as response:
                duration_ms = (time.time() - start_time) * 1000
                res_json = json.loads(response.read().decode("utf-8"))
                candidates = res_json.get("candidates", [])
                if not candidates:
                    return AIResponse(
                        status=ResponseStatus.PROVIDER_ERROR,
                        answer="",
                        provider=self.provider_name,
                        model=model,
                        duration_ms=duration_ms,
                        error="Nessuna risposta da Gemini.",
                        request_id=request.request_id
                    )

                parts = candidates[0].get("content", {}).get("parts", [])
                content = "".join([p.get("text", "") for p in parts if not p.get("thought", False) and p.get("text")]).strip()
                if not content and parts:
                    content = "".join([p.get("text", "") for p in parts if p.get("text")]).strip()

                structured_data = None
                if request.require_structured:
                    try:
                        structured_data = json.loads(content)
                    except Exception as err:
                        return AIResponse(
                            status=ResponseStatus.VALIDATION_FAILED,
                            answer=content,
                            provider=self.provider_name,
                            model=model,
                            duration_ms=duration_ms,
                            error=f"Validazione JSON fallita: {err}",
                            request_id=request.request_id
                        )

                return AIResponse(
                    status=ResponseStatus.SUCCESS,
                    answer=content,
                    structured_data=structured_data,
                    provider=self.provider_name,
                    model=model,
                    duration_ms=duration_ms,
                    request_id=request.request_id
                )
        except urllib.error.HTTPError as e:
            duration_ms = (time.time() - start_time) * 1000
            err_body = e.read().decode("utf-8")
            status = ResponseStatus.RATE_LIMIT if e.code == 429 else ResponseStatus.PROVIDER_ERROR
            return AIResponse(
                status=status,
                answer="",
                provider=self.provider_name,
                model=model,
                duration_ms=duration_ms,
                error=f"Errore Gemini ({e.code}): {err_body}",
                request_id=request.request_id
            )
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return AIResponse(
                status=ResponseStatus.PROVIDER_ERROR,
                answer="",
                provider=self.provider_name,
                model=model,
                duration_ms=duration_ms,
                error=str(e),
                request_id=request.request_id
            )
