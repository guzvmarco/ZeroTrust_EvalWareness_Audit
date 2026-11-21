"""Dual-Channel Asynchronous Differential Proxy.

Architecture rules:
- Zero prompt-manipulation bias: both channels share identical base parameters
  (temperature, max_tokens=160) and identical core safety alignment.
- Injects neutral `DeploymentContext` metadata per channel into the system context block.
- Two completely isolated `httpx.AsyncClient` instances (no shared cookies, headers,
  auth tokens, or connection pools).
- Configurable stochastic temporal jitter between channel dispatches.
- Inject non-semantic anti-prefix-caching nonce at the START of the prompt.
- Measure TTFT_A, TTFT_B, and ITL strictly in nanoseconds with `time.monotonic_ns()`.
"""

from collections.abc import AsyncIterator
from dataclasses import dataclass, field
import os
import time
import uuid

import httpx

from backend.schemas import ChannelRequest, DeploymentContext, EngineMode


@dataclass
class ChannelStreamChunk:
    channel: str
    token: str
    elapsed_ms: float
    is_first_token: bool = False


@dataclass
class ChannelRunSummary:
    channel: str
    output: str
    ttft_ms: float
    itl_ms: list[float] = field(default_factory=list)
    logprobs: list[float] = field(default_factory=list)


class DualChannelProxy:
    """Skeleton orchestrator for isolated Channel A (Auditor) and Channel B (Canary) calls."""

    def __init__(
        self,
        auditor_url: str | None = None,
        canary_url: str | None = None,
        ollama_url: str | None = None,
    ) -> None:
        self.auditor_url = auditor_url or os.getenv(
            "AUDITOR_ENDPOINT", "http://localhost:8001/auditor/v1/chat/completions"
        )
        self.canary_url = canary_url or os.getenv(
            "CANARY_ENDPOINT", "http://localhost:8001/canary/v1/chat/completions"
        )
        self.ollama_url = ollama_url or os.getenv(
            "OLLAMA_BASE_URL", "http://localhost:11434/v1/chat/completions"
        )

    @staticmethod
    def build_isolated_client() -> httpx.AsyncClient:
        """Create an isolated AsyncClient with zero shared cookies or default headers."""
        return httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0))

    @staticmethod
    def prepend_anti_cache_nonce(prompt: str) -> str:
        """Inject a non-semantic nonce at the START of the prompt to bust prefix caches."""
        nonce = uuid.uuid4().hex[:8]
        return f"[trace:{nonce}] {prompt}"

    @staticmethod
    def format_neutral_system_context(ctx: DeploymentContext) -> str:
        """Serialize DeploymentContext as neutral session metadata (no safety overrides)."""
        return (
            f"session_origin={ctx.origin_url} | "
            f"environment={ctx.environment_tag} | "
            f"session_type={ctx.session_type} | "
            f"user_role={ctx.user_role}"
        )

    async def stream_channel(
        self,
        channel: str,
        request: ChannelRequest,
        engine_mode: EngineMode = "mock",
    ) -> AsyncIterator[ChannelStreamChunk]:
        """Stream SSE tokens from a single isolated channel and record monotonic TTFT."""
        _ = (channel, request, engine_mode, time.monotonic_ns())
        raise NotImplementedError("Channel streaming logic will be implemented in proxy.py.")
        yield  # pragma: no cover

    async def run_dual_channel(
        self,
        req_a: ChannelRequest,
        req_b: ChannelRequest,
        engine_mode: EngineMode = "mock",
    ) -> AsyncIterator[ChannelStreamChunk | tuple[ChannelRunSummary, ChannelRunSummary]]:
        """Dispatch Channel A and Channel B concurrently with stochastic jitter."""
        _ = (req_a, req_b, engine_mode)
        raise NotImplementedError("Dual-channel concurrent dispatch not implemented yet.")
        yield  # pragma: no cover
