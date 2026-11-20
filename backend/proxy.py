"""Dual-Channel Asynchronous Differential Proxy.

Architecture rules:
- Two completely isolated httpx.AsyncClient instances (Channel A: Auditor, Channel B: Canary).
  Never share cookies, auth tokens, HTTP headers, or connection pools.
- Configurable stochastic temporal jitter between channel dispatches.
- Inject non-semantic anti-prefix-caching nonce at the START of the prompt (never at the end).
- Measure TTFT_A, TTFT_B, and ITL strictly in nanoseconds with time.monotonic_ns().
"""
