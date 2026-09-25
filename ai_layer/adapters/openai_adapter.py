import json
import time
import ssl
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from .base import BaseAIProviderAdapter
from ..types import AIRequest, AIResponse, ResponseStatus

class OpenAIProviderAdapter(BaseAIProviderAdapter):
    """
    Adapter for standard OpenAI API (gpt-4o, gpt-4o-mini, etc.).
    """
    def __init__(self, api_key: str = "", default_model: str = "gpt-4o-mini"):
        super().__init__(provider_name="openai", default_model=default_model, api_key=api_key)
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    def generate_completion(self, request: AIRequest) -> AIResponse:
        start_time = time.time()
        api_key = self.api_key or (request.metadata.get("api_key") if request.metadata else "")
        model = self.default_model

        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        for msg in request.history:
            role = "user" if msg.get("role") == "user" else "assistant"
            txt = msg.get("text", "") or msg.get("content", "")
            if txt:
                messages.append({"role": role, "content": txt})
        messages.append({"role": "user", "content": request.user_prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": request.temperature if request.temperature is not None else 0.1,
            "max_tokens": request.max_tokens if request.max_tokens is not None else 2048
        }
        if request.require_structured:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

        req = urllib.request.Request(self.endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        timeout_val = request.timeout or 45
        ctx = ssl._create_unverified_context()

        try:
            with urllib.request.urlopen(req, timeout=timeout_val, context=ctx) as response:
                duration_ms = (time.time() - start_time) * 1000
                res_json = json.loads(response.read().decode("utf-8"))
                choices = res_json.get("choices", [])
                if not choices:
                    return AIResponse(
                        status=ResponseStatus.PROVIDER_ERROR,
                        answer="",
                        provider=self.provider_name,
                        model=model,
                        duration_ms=duration_ms,
                        error="Nessuna risposta da OpenAI.",
                        request_id=request.request_id
                    )

                content = choices[0].get("message", {}).get("content", "").strip()
                usage = res_json.get("usage", {})
                in_tok = usage.get("prompt_tokens", 0)
                out_tok = usage.get("completion_tokens", 0)
                tot_tok = usage.get("total_tokens", in_tok + out_tok)
                cost = (in_tok * 0.00000015) + (out_tok * 0.00000060)

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
                    input_tokens=in_tok,
                    output_tokens=out_tok,
                    total_tokens=tot_tok,
                    estimated_cost=cost,
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
                error=f"Errore OpenAI ({e.code}): {err_body}",
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
