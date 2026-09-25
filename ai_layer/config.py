import os
from typing import Dict, Any, Optional

class AIConfig:
    def __init__(self):
        self.load_from_env()

    def load_from_env(self):
        # Load .env file if present
        workspace = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        env_path = os.path.join(workspace, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        parts = line.split("=", 1)
                        k, v = parts[0].strip(), parts[1].strip()
                        if k not in os.environ:
                            os.environ[k] = v

        self.provider = os.environ.get("AI_PROVIDER", "openrouter").lower().strip()
        self.model = os.environ.get("AI_MODEL", "openrouter/free").strip()
        self.openrouter_api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
        self.openai_api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.groq_api_key = os.environ.get("GROQ_API_KEY", "").strip()
        
        self.timeout = int(os.environ.get("AI_TIMEOUT", 45))
        self.max_retries = int(os.environ.get("AI_MAX_RETRIES", 2))
        self.temperature = float(os.environ.get("AI_TEMPERATURE", 0.1))
        self.max_tokens = int(os.environ.get("AI_MAX_TOKENS", 2048))
        self.fallback_provider = os.environ.get("AI_FALLBACK_PROVIDER", "").strip()
        self.fallback_model = os.environ.get("AI_FALLBACK_MODEL", "").strip()

    def get_api_key_for_provider(self, provider: str) -> str:
        p = provider.lower()
        if p == "openrouter":
            return self.openrouter_api_key
        elif p == "openai":
            return self.openai_api_key
        elif p == "gemini":
            return self.gemini_api_key
        elif p == "groq":
            return self.groq_api_key
        return ""

_global_config = None

def get_ai_config() -> AIConfig:
    global _global_config
    if _global_config is None:
        _global_config = AIConfig()
    return _global_config
