import os
import json
import time
import threading
from typing import Dict, Any, List, Optional
from ..types import AIRequest, AIResponse

class UsageTracker:
    def __init__(self, log_path: Optional[str] = None):
        if log_path is None:
            workspace = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            log_path = os.path.join(workspace, "data", "ai_usage_log.json")
        self.log_path = log_path
        self.log_file = log_path
        self._lock = threading.Lock()
        self._ensure_file()

    def _ensure_file(self):
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
        if not os.path.exists(self.log_path):
            with open(self.log_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def log_call(
        self,
        request_id: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        function_name: Optional[str] = None,
        user_id: Optional[str] = None,
        input_tokens: int = 0,
        output_tokens: int = 0,
        duration_ms: float = 0.0,
        status: str = "success",
        estimated_cost: float = 0.0,
        error_type: Optional[str] = None,
        *args,
        **kwargs
    ):
        # Support calling log_call(request, response)
        if len(args) == 2 or (request_id is not None and isinstance(request_id, AIRequest)):
            req = request_id if isinstance(request_id, AIRequest) else args[0]
            res = provider if isinstance(provider, AIResponse) else args[1]
            request_id = req.request_id
            provider = res.provider
            model = res.model
            function_name = req.function_name
            user_id = req.user_id
            input_tokens = res.usage.get("input_tokens", 0)
            output_tokens = res.usage.get("output_tokens", 0)
            duration_ms = res.duration_ms
            status = res.status.value if hasattr(res.status, "value") else str(res.status)
            estimated_cost = res.usage.get("estimated_cost", 0.0)
            error_type = res.error

        # SANITIZATION: Never log customer PII, prompt bodies, or raw document content
        record = {
            "request_id": request_id or f"req_{int(time.time()*1000)}",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "provider": provider or "unknown",
            "model": model or "unknown",
            "function": function_name or "general",
            "user_id": user_id or "anonymous",
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "duration_ms": round(duration_ms, 2),
            "status": status,
            "estimated_cost_usd": round(estimated_cost, 6),
            "error_type": error_type
        }
        
        with self._lock:
            try:
                records = []
                if os.path.exists(self.log_path):
                    with open(self.log_path, "r", encoding="utf-8") as f:
                        records = json.load(f)
                records.append(record)
                if len(records) > 2000:
                    records = records[-2000:]
                with open(self.log_path, "w", encoding="utf-8") as f:
                    json.dump(records, f, indent=2)
            except Exception as e:
                print(f"[UsageTracker Error] {e}", flush=True)

    def get_metrics_summary(self) -> Dict[str, Any]:
        with self._lock:
            try:
                if not os.path.exists(self.log_path):
                    return {"total_calls": 0, "total_requests": 0, "total_tokens": 0, "total_cost_usd": 0.0, "by_provider": {}}
                with open(self.log_path, "r", encoding="utf-8") as f:
                    records = json.load(f)
                
                total_reqs = len(records)
                total_in = sum(r.get("input_tokens", 0) for r in records)
                total_out = sum(r.get("output_tokens", 0) for r in records)
                total_cost = sum(r.get("estimated_cost_usd", 0.0) for r in records)
                
                by_provider = {}
                by_function = {}
                by_status = {}
                
                for r in records:
                    p = r.get("provider", "unknown")
                    by_provider[p] = by_provider.get(p, 0) + 1
                    
                    fn = r.get("function", "unknown")
                    by_function[fn] = by_function.get(fn, 0) + 1
                    
                    st = r.get("status", "unknown")
                    by_status[st] = by_status.get(st, 0) + 1

                return {
                    "total_calls": total_reqs,
                    "total_requests": total_reqs,
                    "total_input_tokens": total_in,
                    "total_output_tokens": total_out,
                    "total_tokens": total_in + total_out,
                    "total_cost_usd": round(total_cost, 6),
                    "by_provider": by_provider,
                    "by_function": by_function,
                    "by_status": by_status
                }
            except Exception as e:
                return {"error": str(e), "total_calls": 0, "total_requests": 0, "by_provider": {}}

_tracker_instance: Optional[UsageTracker] = None

def get_usage_tracker() -> UsageTracker:
    global _tracker_instance
    if _tracker_instance is None:
        _tracker_instance = UsageTracker()
    return _tracker_instance
