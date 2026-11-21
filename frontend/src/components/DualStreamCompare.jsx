import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/** Render `inline code` spans inside a plain-text chunk. */
function renderInline(text, keyPrefix) {
  return text.split(/(`[^`\n]+`)/g).map((chunk, i) => {
    if (chunk.length > 2 && chunk.startsWith("`") && chunk.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="font-mono text-[13px] bg-[#f8f4ec] border border-[#e5dec9] rounded-md px-1.5 py-0.5 text-[#0c2340]"
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{chunk}</React.Fragment>;
  });
}

/** Render text with ```fenced``` code blocks as styled <pre><code>. Handles unterminated fences while streaming. */
export function RichText({ text }) {
  const parts = [];
  const re = /```([\w+-]*)\n?([\s\S]*?)(```|$)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    parts.push({ type: "code", lang: m[1], value: m[2].replace(/\n$/, "") });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });

  return (
    <div className="text-[15px] leading-relaxed text-[#0c2340]">
      {parts.map((p, i) =>
        p.type === "code" ? (
          <figure key={i} className="my-3 rounded-xl border border-[#e5dec9] bg-[#f8f4ec] overflow-hidden">
            {p.lang && (
              <figcaption className="px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-wide text-[#8c7535] border-b border-[#e5dec9] bg-[#efe9d9]/60">
                {p.lang}
              </figcaption>
            )}
            <pre className="px-3.5 py-3 overflow-x-auto text-[13px] leading-snug font-mono text-[#0c2340]">
              <code>{p.value}</code>
            </pre>
          </figure>
        ) : (
          <span key={i} className="whitespace-pre-wrap">
            {renderInline(p.value, i)}
          </span>
        )
      )}
    </div>
  );
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function ResponseCard({ title, subtitle, host, badgeClass, stream, streaming, accent, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5dec9] shadow-sm p-5 flex flex-col">
      <div className="pb-3.5 border-b border-[#e5dec9]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif text-[19px] font-medium tracking-tight text-[#0c2340]">
            {title}
          </h3>
          <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full ${badgeClass}`}>
            {host}
          </span>
        </div>
        <div className="mt-1 text-[13px] text-[#0c2340]/65">{subtitle}</div>
        {children}
      </div>

      <div className="pt-4 min-h-[160px]">
        {stream ? (
          <>
            <RichText text={stream} />
            {streaming && (
              <span
                className="inline-block w-2 h-4 ml-1 rounded-sm align-middle animate-pulse"
                style={{ backgroundColor: accent }}
              />
            )}
          </>
        ) : (
          <p className="text-[14px] text-[#8c7535] animate-pulse">Waiting for response…</p>
        )}
      </div>
    </div>
  );
}

/**
 * Two equal columns: Official Auditor View vs. Real-World User View.
 */
export default function DualStreamCompare({
  camo,
  streamA = "",
  streamB = "",
  streaming = false,
  metrics = null,
  ctxA,
  ctxB,
}) {
  const [showRewrite, setShowRewrite] = useState(false);
  const cosine = camo?.cosine_similarity;

  const msA = metrics ? `${Math.round(metrics.ttft_A)} ms` : "…";
  const msB = metrics ? `${Math.round(metrics.ttft_B)} ms` : "…";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ResponseCard
        title="Official Auditor View"
        subtitle={`Auditor Harness · ${msA}`}
        host={hostOf(ctxA.origin_url)}
        badgeClass="bg-[#edf2f9] text-[#0c2340] border border-[#e1e8f2]"
        stream={streamA}
        streaming={streaming}
        accent="#0c2340"
      />

      <ResponseCard
        title="Real-World User View"
        subtitle={`Production Canary · ${msB}`}
        host={hostOf(ctxB.origin_url)}
        badgeClass="bg-[#efe9d9]/80 text-[#0c2340] border border-[#e5dec9]"
        stream={streamB}
        streaming={streaming}
        accent="#0a843d"
      >
        {typeof cosine === "number" && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setShowRewrite((v) => !v)}
              aria-expanded={showRewrite}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full bg-[#f8f4ec] border border-[#e5dec9] text-[#0c2340] hover:bg-[#efe9d9] transition-colors"
            >
              {Math.round(cosine * 100)}% intent match · cos {cosine.toFixed(2)}
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#8c7535] transition-transform ${
                  showRewrite ? "rotate-180" : ""
                }`}
              />
            </button>
            {showRewrite && (
              <p className="mt-2.5 text-[13px] leading-relaxed text-[#0c2340]/85 bg-[#f8f4ec] border border-[#e5dec9] rounded-xl px-3.5 py-2.5">
                <span className="font-semibold text-[#0c2340]">Rewritten prompt sent: </span>
                {camo?.camouflaged_prompt}
              </p>
            )}
          </div>
        )}
      </ResponseCard>
    </div>
  );
}
