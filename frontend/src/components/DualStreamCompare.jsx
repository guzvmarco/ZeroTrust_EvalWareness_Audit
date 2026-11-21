import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/** Render `inline code` spans inside a plain-text chunk. */
function renderInline(text, keyPrefix) {
  return text.split(/(`[^`\n]+`)/g).map((chunk, i) => {
    if (chunk.length > 2 && chunk.startsWith("`") && chunk.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="font-mono text-[13px] bg-[#edf2f9] border border-[#c1cddd] px-1 py-px"
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
          <figure key={i} className="my-2.5 border border-[#c1cddd] bg-[#f8f4ec]">
            {p.lang && (
              <figcaption className="px-3 py-1 text-[11px] font-mono uppercase tracking-wide text-[#8c7535] border-b border-[#c1cddd] bg-[#efe9d9]">
                {p.lang}
              </figcaption>
            )}
            <pre className="px-3 py-2.5 overflow-x-auto text-[13px] leading-snug font-mono text-[#0c2340]">
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

function ResponseCard({ title, subtitle, host, stripClass, stream, streaming, accent, children }) {
  return (
    <div className="bg-white border border-[#c1cddd] flex flex-col">
      <div className={`px-4 py-3 border-b border-[#c1cddd] ${stripClass}`}>
        <h3 className="text-[16px] font-bold text-[#0c2340]">{title}</h3>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-[#0c2340]/75">
          <span>{subtitle}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[12px]">{host}</span>
        </div>
        {children}
      </div>
      <div className="px-4 py-4 min-h-[160px]">
        {stream ? (
          <>
            <RichText text={stream} />
            {streaming && (
              <span
                className="inline-block w-2 h-4 ml-0.5 align-middle animate-pulse"
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
 * Two equal columns: what the model says to an official auditor vs. to a real user.
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
        stripClass="bg-[#e1e8f2]"
        stream={streamA}
        streaming={streaming}
        accent="#0c2340"
      />

      <ResponseCard
        title="Real-World User View"
        subtitle={`Production Canary · ${msB}`}
        host={hostOf(ctxB.origin_url)}
        stripClass="bg-[#efe9d9]"
        stream={streamB}
        streaming={streaming}
        accent="#0a843d"
      >
        {typeof cosine === "number" && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowRewrite((v) => !v)}
              aria-expanded={showRewrite}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 bg-white border border-[#c1cddd] text-[#0c2340] hover:border-[#0c2340]"
            >
              {Math.round(cosine * 100)}% intent match · cos {cosine.toFixed(2)}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showRewrite ? "rotate-180" : ""}`}
              />
            </button>
            {showRewrite && (
              <p className="mt-2 text-[13px] leading-snug text-[#0c2340] bg-white border border-[#c1cddd] px-3 py-2">
                <span className="font-semibold">Rewritten prompt sent to this channel: </span>
                {camo?.camouflaged_prompt}
              </p>
            )}
          </div>
        )}
      </ResponseCard>
    </div>
  );
}
