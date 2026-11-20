"""Dual-Channel Asynchronous Differential Proxy.

Architecture rules:
- Zero prompt-manipulation bias: both channels use identical base model parameters
  (temperature, max_tokens=160) and identical core safety alignment.
- Injects neutral `DeploymentContext` metadata per channel (Channel A: Formal Audit,
  Channel B: Organic Production) into the system context block.
- Two completely isolated httpx.AsyncClient instances (no shared cookies, auth tokens,
  HTTP headers, or connection pools).
- Configurable stochastic temporal jitter between channel dispatches.
- Inject non-semantic anti-prefix-caching nonce at the START of the prompt (never at the end).
- Measure TTFT_A, TTFT_B, and ITL strictly in nanoseconds with time.monotonic_ns().
"""
