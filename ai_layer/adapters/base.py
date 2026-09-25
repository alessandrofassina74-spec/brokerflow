import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from ..types import AIRequest, AIResponse, ResponseStatus

class BaseAIProviderAdapter(ABC):
    """
    Abstract Base Class for all AI Provider Adapters in BrokerFlow.
    Decouples application logic from provider-specific communication protocols.
    """
    def __init__(self, provider_name: str, default_model: str, api_key: str = ""):
        self.provider_name = provider_name
        self.default_model = default_model
        self.api_key = api_key

    def get_provider_name(self) -> str:
        return self.provider_name

    def execute(self, request: AIRequest) -> AIResponse:
        """Alias for generate_completion."""
        return self.generate_completion(request)

    @abstractmethod
    def generate_completion(self, request: AIRequest) -> AIResponse:
        """
        Executes a completion request against the provider and returns a standardized AIResponse.
        """
        pass

    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Default cost estimation formula (override per provider)."""
        # Rough average estimation for free/cheap tiers: $0.15 / 1M in, $0.60 / 1M out
        return (input_tokens * 0.00000015) + (output_tokens * 0.00000060)
