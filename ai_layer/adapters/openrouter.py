import json
import time
import ssl
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from .base import BaseAIProviderAdapter
from ..types import AIRequest, AIResponse, ResponseStatus

class OpenRouterProviderAdapter(BaseAIProviderAdapter):
    """
    Adapter for OpenRouter (OpenAI-compatible multi-model gateway).
    Supports high-speed instruction models, openrouter/auto, and fallback models.
    """
    def __init__(self, api_key: str = "", default_model: str = "openai/gpt-4o-mini"):
        super().__init__(provider_name="openrouter", default_model=default_model, api_key=api_key)
        self.endpoint = "https://openrouter.ai/api/v1/chat/completions"

    def get_candidate_models(self, requested_model: Optional[str] = None) -> List[str]:
        req_m = requested_model or self.default_model
        if req_m in ("openrouter/free", "openrouter/auto", "default", "openai/gpt-4o-mini"):
            return [
                "openai/gpt-4o-mini",
                "meta-llama/llama-3.3-70b-instruct",
                "google/gemini-2.5-flash",
                "openrouter/auto"
            ]
        
        candidates = [req_m]
        for fallback in ["openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct", "google/gemini-2.5-flash", "openrouter/auto"]:
            if fallback not in candidates:
                candidates.append(fallback)
        return candidates

    def build_payload(self, request: AIRequest, model: str) -> Dict[str, Any]:
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

        return payload

    def get_headers(self, api_key: Optional[str] = None) -> Dict[str, str]:
        eff_key = self.api_key
        if api_key and str(api_key).startswith("sk-or-"):
            eff_key = str(api_key)

        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://brokerflow.it",
            "X-Title": "BrokerFlow Mortgage AI Platform"
        }
        if eff_key:
            headers["Authorization"] = f"Bearer {eff_key}"
        return headers

    def generate_completion(self, request: AIRequest) -> AIResponse:
        start_time = time.time()
        api_key = self.api_key
        
        if request.metadata and request.metadata.get("api_key"):
            req_k = request.metadata.get("api_key")
            if req_k and str(req_k).startswith("sk-or-"):
                api_key = str(req_k)
            
        candidate_models = self.get_candidate_models(request.model)
        headers = self.get_headers(api_key)
        timeout_val = request.timeout or 45
        ctx = ssl._create_unverified_context()

        last_error = ""
        last_status = ResponseStatus.PROVIDER_ERROR

        for model in candidate_models:
            payload = self.build_payload(request, model)
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(self.endpoint, data=req_data, headers=headers, method="POST")

            try:
                with urllib.request.urlopen(req, timeout=timeout_val, context=ctx) as response:
                    duration_ms = (time.time() - start_time) * 1000
                    res_json = json.loads(response.read().decode("utf-8"))
                    
                    choices = res_json.get("choices", [])
                    if not choices:
                        last_error = f"Nessuna scelta restituita da OpenRouter su {model}."
                        continue

                    content = choices[0].get("message", {}).get("content", "").strip()
                    if not content:
                        last_error = f"Contenuto vuoto da OpenRouter su {model}."
                        continue

                    usage = res_json.get("usage", {})
                    in_tok = usage.get("prompt_tokens", len(request.user_prompt) // 4)
                    out_tok = usage.get("completion_tokens", len(content) // 4)
                    tot_tok = usage.get("total_tokens", in_tok + out_tok)
                    cost = self.estimate_cost(model, in_tok, out_tok)

                    structured_data = None
                    if request.require_structured:
                        try:
                            structured_data = json.loads(content)
                        except Exception as parse_err:
                            return AIResponse(
                                status=ResponseStatus.VALIDATION_FAILED,
                                answer=content,
                                provider=self.provider_name,
                                model=model,
                                input_tokens=in_tok,
                                output_tokens=out_tok,
                                total_tokens=tot_tok,
                                estimated_cost=cost,
                                duration_ms=duration_ms,
                                error=f"JSON validation failed: {str(parse_err)}",
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
                err_body = ""
                try:
                    err_body = e.read().decode("utf-8")
                    err_json = json.loads(err_body)
                    err_msg = err_json.get("error", {}).get("message", err_body)
                except Exception:
                    err_msg = err_body or str(e)

                if e.code == 429:
                    last_status = ResponseStatus.RATE_LIMIT
                elif e.code in (408, 504):
                    last_status = ResponseStatus.TIMEOUT
                else:
                    last_status = ResponseStatus.PROVIDER_ERROR

                last_error = f"OpenRouter HTTP {e.code} su {model}: {err_msg}"
                print(f"[OpenRouter Adapter] Attempt on {model} failed: {last_error}", flush=True)
                continue

            except urllib.error.URLError as e:
                last_status = ResponseStatus.TIMEOUT if "timed out" in str(e) else ResponseStatus.PROVIDER_ERROR
                last_error = f"OpenRouter Connection Error su {model}: {str(e)}"
                continue

            except Exception as e:
                last_status = ResponseStatus.PROVIDER_ERROR
                last_error = f"OpenRouter Error su {model}: {str(e)}"
                continue

        duration_ms = (time.time() - start_time) * 1000
        return AIResponse(
            status=last_status,
            answer="",
            provider=self.provider_name,
            model=candidate_models[0] if candidate_models else "meta-llama/llama-3.3-70b-instruct",
            duration_ms=duration_ms,
            error=last_error or "Nessun modello OpenRouter disponibile.",
            request_id=request.request_id
        )
