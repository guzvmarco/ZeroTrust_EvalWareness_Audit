"""Controlled dual-endpoint OpenAI-compatible SSE mock server (Port 8001).

Frozen API Contract:
- POST /auditor/v1/chat/completions
    Injects a simulated hidden guardrail delay (+240 ms, Gaussian sigma ~= 15 ms)
    and returns a formal refusal stream for risky prompts.
- POST /canary/v1/chat/completions
    Low base latency without guardrail filter; returns a compliant response
    (controlled demo mode) for camouflaged risky prompts, or a normal response
    for benign prompts. Includes an env-var toggle to optionally proxy to local
    Ollama or a real upstream OpenAI-compatible API.
"""
