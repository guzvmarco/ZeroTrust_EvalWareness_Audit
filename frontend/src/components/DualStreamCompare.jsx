import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/** Render `inline code` spans inside a plain-text chunk. */
function renderInline(text, keyPrefix) {
  return text.split(/(`[^`\n]+`)/g).map((chunk, i) => {
    if (chunk.length > 2 && chunk.startsWith("`") && chunk.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="font-mono text-[12px] bg-zinc-100 border border-zinc-200 rounded px-1 py-0.5 text-zinc-900"
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{chunk}</React.Fragment>;
  });
}

/** Render text with ```fenced``` code blocks as sharp <pre><code> blocks. */
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
    <div className="text-[14px] leading-relaxed text-zinc-800">
      {parts.map((p, i) =>
        p.type === "code" ? (
          <figure key={i} className="my-2.5 rounded-md border border-zinc-200 bg-zinc-50 overflow-hidden">
            {p.lang && (
              <figcaption className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-200 bg-zinc-100/70">
                {p.lang}
              </figcaption>
            )}
            <pre className="px-3 py-2.5 overflow-x-auto text-[12px] leading-snug font-mono text-zinc-900">
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

function ChannelColumn({
  title,
  tagLabel,
  dotColor,
  latencyMs,
  host,
  ctx,
  showContextBlock,
  stream,
  streaming,
  cursorColor,
  extraControl,
}) {
  return (
    <div className="flex flex-col bg-white min-w-0">
      {/* Column Subheader */}
      <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
          <span className="text-xs font-semibold text-zinc-900 truncate">{title}</span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            {tagLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-zinc-600">
          <span>{host}</span>
          <span className="text-zinc-300">|</span>
          <span className="font-semibold text-zinc-900">{latencyMs}</span>
        </div>
      </div>

      {/* Model-Visible Input & Injected Context Preview */}
      {showContextBlock && ctx && (
        <div className="px-4 py-2 border-b border-zinc-200 border-l-2 border-l-amber-500 bg-amber-50/60 font-mono text-[11px] text-zinc-700 leading-snug">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-800 mb-0.5">
            Model-Visible Context Metadata Block
          </div>
          <div className="truncate">
            origin={ctx.origin_url} · env={ctx.environment_tag} · role={ctx.user_role}
          </div>
        </div>
      )}

      {extraControl}

      {/* Streamed Output */}
      <div className="p-4 min-h-[170px] flex-1">
        {stream ? (
          <>
            <RichText text={stream} />
            {streaming && (
              <span
                className="inline-block w-1.5 h-4 ml-1 align-middle animate-pulse"
                style={{ backgroundColor: cursorColor }}
              />
            )}
          </>
        ) : (
          <p className="text-xs font-mono text-zinc-400 animate-pulse">
            Awaiting channel stream…
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Unified Split Diff View:
 * Single two-column container separated by a 1px vertical divider (`divide-x border-zinc-200`).
 */
export default function DualStreamCompare({
  camo,
  streamA = "",
  streamB = "",
  streaming = false,
  metrics = null,
  ctxA,
  ctxB,
  metadataLayers = { context_metadata_block: true },
}) {
  const [showRewrite, setShowRewrite] = useState(false);
  const cosine = camo?.cosine_similarity;

  const msA = metrics ? `${Math.round(metrics.ttft_A)} ms` : "…";
  const msB = metrics ? `${Math.round(metrics.ttft_B)} ms` : "…";

  return (
    <div className="rounded-md bg-white border border-zinc-200 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
        <ChannelColumn
          title="Official Auditor View"
          tagLabel="CHANNEL A"
          dotColor="bg-[#0c2340]"
          latencyMs={msA}
          host={hostOf(ctxA.origin_url)}
          ctx={ctxA}
          showContextBlock={Boolean(metadataLayers?.context_metadata_block)}
          stream={streamA}
          streaming={streaming}
          cursorColor="#0c2340"
        />

        <ChannelColumn
          title="Real-World User View"
          tagLabel="CHANNEL B"
          dotColor="bg-emerald-600"
          latencyMs={msB}
          host={hostOf(ctxB.origin_url)}
          ctx={ctxB}
          showContextBlock={Boolean(metadataLayers?.context_metadata_block)}
          stream={streamB}
          streaming={streaming}
          cursorColor="#059669"
          extraControl={
            typeof cosine === "number" ? (
              <div className="px-4 py-1.5 border-b border-zinc-200 bg-zinc-50/40">
                <button
                  type="button"
                  onClick={() => setShowRewrite((v) => !v)}
                  aria-expanded={showRewrite}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-zinc-700 hover:text-zinc-950"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>
                    INTENT INVARIANCE: {Math.round(cosine * 100)}% (cos {cosine.toFixed(3)})
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                      showRewrite ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showRewrite && (
                  <p className="mt-1.5 text-xs leading-snug text-zinc-700 border-l-2 border-amber-500 bg-amber-50/60 px-2.5 py-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-amber-800 block mb-0.5">
                      Rewritten Canary Prompt
                    </span>
                    {camo?.camouflaged_prompt}
                  </p>
                )}
              </div>
            ) : null
          }
        />
      </div>
    </div>
  );
}
