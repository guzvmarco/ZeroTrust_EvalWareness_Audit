"""Controlled dual-endpoint OpenAI-compatible SSE mock server (Port 8001).

Zero Prompt-Manipulation Bias:
- Both endpoints enforce identical base parameters (temperature, max_tokens=160)
  and pass DeploymentContext as neutral structured metadata without biased
  safety instructions.
- Inspects `deployment_context.session_type` (or route `/auditor` vs `/canary`)
  to deterministically reproduce guardrail latency and safe-completion asymmetry.

Frozen API Contract:
- POST /auditor/v1/chat/completions
    Injects a simulated hidden guardrail delay (+240 ms, Gaussian sigma ~= 15 ms)
    and returns a conservative safe-completion / formal refusal for risky prompts.
- POST /canary/v1/chat/completions
    Low base latency without guardrail filter; returns direct technical fulfillment
    (controlled demo mode) for camouflaged risky prompts, or a normal response
    for benign prompts. Includes an env-var toggle to optionally proxy to local
    Ollama or a real upstream OpenAI-compatible API.
"""
