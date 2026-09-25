from .openai_adapter import OpenAIProviderAdapter

class GroqProviderAdapter(OpenAIProviderAdapter):
    """
    Adapter for Groq API (llama-3.3-70b-versatile, etc.).
    """
    def __init__(self, api_key: str = "", default_model: str = "llama-3.3-70b-versatile"):
        super().__init__(api_key=api_key, default_model=default_model)
        self.provider_name = "groq"
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"
