import time
import uuid
from enum import Enum
from typing import Dict, Any, List, Optional

class ResponseStatus(str, Enum):
    SUCCESS = "success"
    INSUFFICIENT_INFORMATION = "insufficient_information"
    VALIDATION_FAILED = "validation_failed"
    PROVIDER_ERROR = "provider_error"
    RATE_LIMIT = "rate_limit"
    TIMEOUT = "timeout"
    ERROR = "error"

class AIRequest:
    def __init__(
        self,
        user_prompt: Optional[str] = None,
        prompt: Optional[str] = None,
        system_prompt: Optional[str] = None,
        context_documents: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, str]]] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        require_structured: bool = False,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        timeout: Optional[int] = None,
        user_id: Optional[str] = None,
        function_name: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.request_id = f"req_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
        self.user_prompt = user_prompt or prompt or ""
        self.system_prompt = system_prompt or ""
        self.context_documents = context_documents or []
        self.history = history or []
        self.json_schema = json_schema
        self.require_structured = require_structured or (json_schema is not None)
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.user_id = user_id or "anonymous"
        self.function_name = function_name or "general"
        self.provider = provider
        self.model = model
        self.metadata = metadata or {}
        if api_key:
            self.metadata["api_key"] = api_key

class AIResponse:
    def __init__(
        self,
        status: ResponseStatus,
        answer: str = "",
        structured_data: Optional[Dict[str, Any]] = None,
        citations: Optional[List[str]] = None,
        confidence: float = 1.0,
        provider: str = "",
        model: str = "",
        input_tokens: int = 0,
        output_tokens: int = 0,
        total_tokens: int = 0,
        estimated_cost: float = 0.0,
        usage: Optional[Dict[str, Any]] = None,
        duration_ms: float = 0.0,
        error: Optional[str] = None,
        request_id: str = ""
    ):
        self.status = status
        self.answer = answer
        self.structured_data = structured_data
        self.citations = citations or []
        self.confidence = confidence
        self.provider = provider
        self.model = model
        
        if usage:
            in_t = usage.get("prompt_tokens") or usage.get("input_tokens") or 0
            out_t = usage.get("completion_tokens") or usage.get("output_tokens") or 0
            tot_t = usage.get("total_tokens") or (in_t + out_t)
            cost = usage.get("estimated_cost") or estimated_cost
            self.usage = {
                "input_tokens": in_t,
                "output_tokens": out_t,
                "total_tokens": tot_t,
                "estimated_cost": cost
            }
        else:
            self.usage = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens or (input_tokens + output_tokens),
                "estimated_cost": estimated_cost
            }
            
        self.duration_ms = duration_ms
        self.error = error
        self.request_id = request_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value if isinstance(self.status, ResponseStatus) else str(self.status),
            "answer": self.answer,
            "structured_data": self.structured_data,
            "citations": self.citations,
            "confidence": self.confidence,
            "provider": self.provider,
            "model": self.model,
            "usage": self.usage,
            "duration_ms": self.duration_ms,
            "error": self.error,
            "request_id": self.request_id
        }
