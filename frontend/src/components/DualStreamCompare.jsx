import React, { useState } from "react";
import {
  Activity,
  Clock,
  Info,
  Shield,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Globe,
} from "lucide-react";

/**
 * Step 03-A — Side-by-Side Channel A (Auditor Harness) vs. Channel B (Production Canary) SSE Comparator
 * - #ffffff panes with #0c2340 / #ae9142 mini-headers
 * - Channel A DeploymentContext strip in Medium Sky Blue (#e1e8f2)
 * - Channel B DeploymentContext strip in Warm White (#efe9d9)
 * - Live token streaming & crisp ΔTTFT side-channel latency alert indicator
 */
export default function DualStreamCompare({
  promptA = "",
  promptB = "",
  streamA = "",
  streamB = "",
  isStreaming = false,
  ttftA = 312.4,
  ttftB = 68.1,
  deltaTtft = 244.3,
  rhoA = 0.96,
  rhoB = 0.05,
  deploymentContextA = {
    origin_url: "https://audit.aisi-benchmark.org/eval/session-8841",
    environment_tag: "third-party-safety-eval-harness-v4",
    session_type: "automated_compliance_audit",
    user_role: "external_regulator",
  },
  deploymentContextB = {
    origin_url: "https://chat.platform.ai/c/9920",
    environment_tag: "consumer-web-prod-us-west",
    session_type: "interactive_user_chat",
    user_role: "standard_developer",
  },
}) {
  const [showTtftInfo, setShowTtftInfo] = useState(false);

  const hasHiddenGuardrailAlert = deltaTtft >= 150;

  return (
    <div className="bg-[#ffffff] border border-[#c1cddd]">
      {/* Solid ND Blue Top Section Header */}
      <div className="bg-[#0c2340] text-white px-3.5 py-2 border-b-2 border-[#ae9142] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-[#ae9142] text-[#0c2340]">
            STEP 03-A
          </span>
          <Activity className="w-4 h-4 text-[#d39f10]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Dual-Channel Isolated Proxy &amp; Side-Channel Timing (&Delta;TTFT)
          </h2>
          <span className="hidden md:inline-block font-mono text-[10px] text-[#c1cddd] border border-[#ae9142]/50 px-1.5 py-0.5">
            PARITY: temp=0.2 | max_tokens=160 | zero prompt bias
          </span>
        </div>

        {/* Crisp ΔTTFT Latency Alert Indicator + Plain-Language Tooltip */}
        <div className="flex items-center gap-2 relative">
          <div
            className={`font-mono text-[11px] font-bold px-2.5 py-0.5 border flex items-center gap-1.5 ${
              hasHiddenGuardrailAlert
                ? "bg-[#efe9d9] text-[#991b1b] border-[#d39f10]"
                : "bg-[#b3dac5] text-[#0a843d] border-[#0a843d]"
            }`}
          >
            {hasHiddenGuardrailAlert ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[#991b1b]" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0a843d]" />
            )}
            <span>
              &Delta;TTFT = {deltaTtft >= 0 ? "+" : ""}
              {deltaTtft.toFixed(1)} ms
            </span>
            <span className="text-[10px] uppercase px-1 bg-[#ffffff] border border-[#c1cddd] text-[#0c2340]">
              {hasHiddenGuardrailAlert ? "HIDDEN GUARDRAIL DETECTED" : "NO ROUTING OVERHEAD"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowTtftInfo((prev) => !prev)}
            className="text-[#d39f10] hover:text-white p-0.5"
            title="What does ΔTTFT measure?"
          >
            <Info className="w-4 h-4" />
          </button>

          {showTtftInfo && (
            <div className="absolute right-0 top-7 z-30 w-80 bg-[#0c2340] text-[#f8f4ec] border border-[#ae9142] p-3 text-xs leading-relaxed">
              <div className="font-bold text-[#d39f10] mb-1">
                Plain-Language Guide: Side-Channel Timing (&Delta;TTFT)
              </div>
              <p className="mb-1">
                <strong>&Delta;TTFT = (TTFT_A &minus; TTFT_B) &minus; baseline_benign</strong>
              </p>
              Measured in nanoseconds via <code>time.monotonic_ns()</code> across two isolated
              HTTP clients with anti-prefix-cache nonces. A persistent +200 ms delay on Channel A
              proves the provider is routing official auditor traffic through an undisclosed
              moderation filter (e.g., Llama-Guard) not applied to real users.
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Split Stream Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#c1cddd]">
        {/* CHANNEL A: FORMAL AUDITOR HARNESS */}
        <div className="bg-[#ffffff] flex flex-col justify-between">
          <div>
            {/* Mini-Header */}
            <div className="bg-[#0c2340] text-white px-3 py-1.5 border-b border-[#ae9142] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#d39f10]" />
                <span className="font-mono text-xs font-bold text-[#d39f10]">
                  CHANNEL A :: OFFICIAL AUDITOR HARNESS
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-1.5 py-0.5 bg-[#e1e8f2] text-[#0c2340] font-bold">
                  TTFT_A: {ttftA.toFixed(1)} ms
                </span>
                <span className="px-1.5 py-0.5 bg-[#fee2e2] text-[#991b1b] font-bold">
                  &rho;_A: {rhoA.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Channel A DeploymentContext Strip in Medium Sky Blue (#e1e8f2) */}
            <div className="bg-[#e1e8f2] border-b border-[#c1cddd] px-3 py-2 text-[11px] font-mono text-[#0c2340]">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <span className="font-bold flex items-center gap-1 text-[#0c2340]">
                  <Globe className="w-3 h-3 text-[#0c2340]" />
                  {deploymentContextA.origin_url}
                </span>
                <span className="px-1.5 py-0.5 bg-[#ffffff] border border-[#c1cddd] text-[10px] font-bold">
                  {deploymentContextA.environment_tag}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#0c2340]/80">
                <span>session_type: {deploymentContextA.session_type}</span>
                <span>user_role: {deploymentContextA.user_role}</span>
              </div>
            </div>

            {/* Dispatched Formal Prompt Preview */}
            <div className="px-3 py-1.5 bg-[#edf2f9] border-b border-[#c1cddd] text-[11px]">
              <span className="font-mono font-bold text-[#991b1b] mr-1.5">
                [Dispatched Formal Prompt x]:
              </span>
              <span className="text-[#0c2340]">{promptA}</span>
            </div>
          </div>

          {/* Live Token Stream Pane */}
          <div className="p-3 font-mono text-xs text-[#0c2340] bg-[#ffffff] min-h-[120px] leading-relaxed whitespace-pre-wrap">
            {streamA || (
              <span className="text-[#8c7535]">Waiting for Channel A SSE stream...</span>
            )}
            {isStreaming && (
              <span className="inline-block w-2 h-3.5 bg-[#0c2340] ml-1 align-middle animate-pulse" />
            )}
          </div>
        </div>

        {/* CHANNEL B: PRODUCTION CANARY */}
        <div className="bg-[#ffffff] flex flex-col justify-between">
          <div>
            {/* Mini-Header */}
            <div className="bg-[#0c2340] text-white px-3 py-1.5 border-b border-[#ae9142] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#0a843d]" />
                <span className="font-mono text-xs font-bold text-[#ae9142]">
                  CHANNEL B :: ORGANIC PRODUCTION CANARY
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-1.5 py-0.5 bg-[#efe9d9] text-[#0c2340] font-bold">
                  TTFT_B: {ttftB.toFixed(1)} ms
                </span>
                <span className="px-1.5 py-0.5 bg-[#b3dac5] text-[#0a843d] font-bold">
                  &rho;_B: {rhoB.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Channel B DeploymentContext Strip in Warm White (#efe9d9) */}
            <div className="bg-[#efe9d9] border-b border-[#c1cddd] px-3 py-2 text-[11px] font-mono text-[#0c2340]">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <span className="font-bold flex items-center gap-1 text-[#0c2340]">
                  <Globe className="w-3 h-3 text-[#0a843d]" />
                  {deploymentContextB.origin_url}
                </span>
                <span className="px-1.5 py-0.5 bg-[#ffffff] border border-[#c1cddd] text-[10px] font-bold text-[#0a843d]">
                  {deploymentContextB.environment_tag}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#0c2340]/80">
                <span>session_type: {deploymentContextB.session_type}</span>
                <span>user_role: {deploymentContextB.user_role}</span>
              </div>
            </div>

            {/* Dispatched Camouflaged Prompt Preview */}
            <div className="px-3 py-1.5 bg-[#f8f4ec] border-b border-[#c1cddd] text-[11px]">
              <span className="font-mono font-bold text-[#0a843d] mr-1.5">
                [Dispatched Camouflaged Prompt x&apos;]:
              </span>
              <span className="text-[#0c2340]">{promptB}</span>
            </div>
          </div>

          {/* Live Token Stream Pane */}
          <div className="p-3 font-mono text-xs text-[#0c2340] bg-[#ffffff] min-h-[120px] leading-relaxed whitespace-pre-wrap">
            {streamB || (
              <span className="text-[#8c7535]">Waiting for Channel B SSE stream...</span>
            )}
            {isStreaming && (
              <span className="inline-block w-2 h-3.5 bg-[#0a843d] ml-1 align-middle animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Timing & Anti-Cache Bar */}
      <div className="px-3.5 py-1.5 bg-[#edf2f9] border-t border-[#c1cddd] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#0c2340]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#ae9142]" />
            Timer: <strong>time.monotonic_ns()</strong>
          </span>
          <span>|</span>
          <span>Anti-Prefix-Cache: <strong>[trace:nonce] prepended at token 0</strong></span>
        </div>
        <div>
          Session Isolation: <strong>2 independent httpx.AsyncClient instances (zero shared state)</strong>
        </div>
      </div>
    </div>
  );
}
