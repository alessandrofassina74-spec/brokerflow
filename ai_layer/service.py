import time
import json
import os
from typing import Dict, Any, List, Optional
from .config import get_ai_config, AIConfig
from .types import AIRequest, AIResponse, ResponseStatus
from .adapters.base import BaseAIProviderAdapter
from .adapters.openrouter import OpenRouterProviderAdapter
from .adapters.openai_adapter import OpenAIProviderAdapter
from .adapters.gemini_adapter import GeminiProviderAdapter
from .adapters.groq_adapter import GroqProviderAdapter
from .monitoring.usage_tracker import get_usage_tracker
from .grounding import build_policy_grounding_system_prompt, build_multibank_grounding_system_prompt

class AIService:
    """
    Central AI Layer Service for BrokerFlow.
    Completely decouples application features from specific AI providers.
    Provides grounding, structured output validation, retry loop, and usage tracking.
    """
    def __init__(self, config: Optional[AIConfig] = None):
        self.config = config or get_ai_config()
        self.usage_tracker = get_usage_tracker()
        self._adapters: Dict[str, BaseAIProviderAdapter] = {}
        self._init_adapters()

    def _init_adapters(self):
        self._adapters["openrouter"] = OpenRouterProviderAdapter(
            api_key=self.config.openrouter_api_key,
            default_model=self.config.model if self.config.provider == "openrouter" else "openrouter/free"
        )
        self._adapters["openai"] = OpenAIProviderAdapter(
            api_key=self.config.openai_api_key,
            default_model=self.config.model if self.config.provider == "openai" else "gpt-4o-mini"
        )
        self._adapters["gemini"] = GeminiProviderAdapter(
            api_key=self.config.gemini_api_key,
            default_model=self.config.model if self.config.provider == "gemini" else "gemini-2.5-flash"
        )
        self._adapters["groq"] = GroqProviderAdapter(
            api_key=self.config.groq_api_key,
            default_model=self.config.model if self.config.provider == "groq" else "llama-3.3-70b-versatile"
        )

    def get_adapter(self, provider_name: Optional[str] = None, request_key: Optional[str] = None) -> BaseAIProviderAdapter:
        p = (provider_name or self.config.provider).lower()
        if request_key:
            if request_key.startswith("sk-or-") or "openrouter" in request_key:
                p = "openrouter"
            elif request_key.startswith("sk-") and not request_key.startswith("sk-or-"):
                p = "openai"
            elif request_key.startswith("gsk_"):
                p = "groq"
            elif request_key.startswith("AIza"):
                p = "gemini"

        adapter = self._adapters.get(p)
        if not adapter:
            adapter = self._adapters["openrouter"]
        return adapter

    def infer_provider_from_key(self, api_key: str) -> BaseAIProviderAdapter:
        return self.get_adapter(request_key=api_key)

    def execute_request(self, request: AIRequest, provider_override: Optional[str] = None) -> AIResponse:
        """
        Executes an AI request with controlled retries, grounding, monitoring, and standardized response.
        """
        req_key = request.metadata.get("api_key") if request.metadata else None
        adapter = self.get_adapter(provider_override, request_key=req_key)
        
        max_retries = self.config.max_retries
        last_response = None

        for attempt in range(max_retries + 1):
            response = adapter.generate_completion(request)
            last_response = response
            
            # Log usage & metrics (PII sanitized)
            self.usage_tracker.log_call(
                request_id=request.request_id,
                provider=response.provider,
                model=response.model,
                function_name=request.function_name,
                user_id=request.user_id,
                input_tokens=response.usage.get("input_tokens", 0),
                output_tokens=response.usage.get("output_tokens", 0),
                duration_ms=response.duration_ms,
                status=response.status.value if hasattr(response.status, "value") else str(response.status),
                estimated_cost=response.usage.get("estimated_cost", 0.0),
                error_type=response.error if response.status != ResponseStatus.SUCCESS else None
            )

            if response.status in (ResponseStatus.SUCCESS, ResponseStatus.INSUFFICIENT_INFORMATION):
                return response
            
            # If rate limit or timeout, retry with backoff
            if response.status in (ResponseStatus.RATE_LIMIT, ResponseStatus.TIMEOUT) and attempt < max_retries:
                time.sleep(1.0 * (2 ** attempt))
                continue

            break

        # If failed, apply fallback local policy response if applicable
        if last_response and last_response.status != ResponseStatus.SUCCESS:
            bank_id = request.metadata.get("bank_name") or request.metadata.get("bank_id")
            if bank_id:
                try:
                    import server
                    local_ans = server.local_policy_analyst(bank_id, "", request.user_prompt)
                    if local_ans:
                        last_response.answer = local_ans
                        last_response.status = ResponseStatus.SUCCESS
                except Exception:
                    pass
            elif request.function_name == "multibank_advisor":
                try:
                    import server
                    local_ans = server.local_multibank_analyst(request.user_prompt)
                    if local_ans:
                        last_response.answer = local_ans
                        last_response.status = ResponseStatus.SUCCESS
                except Exception:
                    pass

        return last_response

    # High-level BrokerFlow application methods
    def ask_policy(
        self,
        bank_id: Optional[str] = None,
        question: str = "",
        context: Optional[str] = None,
        context_text: Optional[str] = None,
        bank_name: Optional[str] = None,
        api_key_override: Optional[str] = None,
        user_id: str = "broker",
        **kwargs
    ) -> AIResponse:
        """
        Single-Bank policy consultation strictly grounded on official documents.
        """
        target_bank = bank_id or bank_name or kwargs.get("bank") or "banca"
        eff_context = context or context_text
        if not eff_context:
            try:
                import server
                eff_context = server.get_bank_context(target_bank)
            except Exception:
                eff_context = f"Policy per banca: {target_bank}"

        sys_prompt = build_policy_grounding_system_prompt(target_bank, eff_context)
        req = AIRequest(
            user_prompt=question,
            system_prompt=sys_prompt,
            function_name="policy_consultation",
            user_id=user_id,
            metadata={"bank_name": target_bank, "bank_id": target_bank, "api_key": api_key_override} if api_key_override else {"bank_name": target_bank, "bank_id": target_bank}
        )
        return self.execute_request(req)

    def ask_multibank(
        self,
        question: str,
        knowledge_base: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, str]]] = None,
        model: Optional[str] = None,
        api_key_override: Optional[str] = None,
        user_id: str = "broker",
        **kwargs
    ) -> AIResponse:
        """
        Multi-Bank comparative consultation grounded on knowledge base.
        """
        eff_kb = knowledge_base
        if not eff_kb:
            # Build kb from data/policies.json
            try:
                kb_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "policies.json")
                if os.path.exists(kb_path):
                    with open(kb_path, "r", encoding="utf-8") as f:
                        policies = json.load(f)
                    eff_kb = [
                        {
                            "id": k,
                            "banca": v.get("name", k),
                            "parametri": {pk: pv for pk, pv in v.items() if pk not in ("mriGrid", "color", "bgLogoLetter", "territories_details")}
                        }
                        for k, v in policies.items()
                    ]
            except Exception:
                eff_kb = []

        sys_prompt = build_multibank_grounding_system_prompt(eff_kb or [])
        req = AIRequest(
            user_prompt=question,
            system_prompt=sys_prompt,
            history=history,
            function_name="multibank_advisor",
            user_id=user_id,
            metadata={"api_key": api_key_override} if api_key_override else {}
        )
        return self.execute_request(req)

    def extract_structured(
        self,
        prompt: str,
        json_schema: Dict[str, Any],
        system_prompt: Optional[str] = None,
        api_key_override: Optional[str] = None,
        user_id: str = "system",
        function_name: str = "structured_extraction"
    ) -> AIResponse:
        """
        Extracts structured JSON conforming strictly to a target JSON Schema.
        """
        req = AIRequest(
            user_prompt=prompt,
            system_prompt=system_prompt,
            json_schema=json_schema,
            require_structured=True,
            function_name=function_name,
            user_id=user_id,
            metadata={"api_key": api_key_override} if api_key_override else {}
        )
        return self.execute_request(req)

_ai_service_instance: Optional[AIService] = None

def get_ai_service() -> AIService:
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance
