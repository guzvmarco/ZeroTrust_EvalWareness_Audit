import React, { useState } from "react";
import { Eye, EyeOff, Fingerprint } from "lucide-react";

/**
 * Cryptographic proof panel (inside the expandable evidence drawer):
 * SHA-256 Merkle Root + canonical RFC 8785 leaf viewer.
 */
export default function MerkleCustodyBar({ merkleRoot, latestLeaf, leafCount = 1, tamperState }) {
  const [showLeaf, setShowLeaf] = useState(false);
  const isTampered = tamperState?.status === "TAMPERED";

  return (
    <div className="rounded-md bg-white border border-zinc-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-[#ae9142]" />
          <h3 className="text-xs font-semibold text-zinc-900">
            Cryptographic Chain of Custody (RFC 8785 JCS + RFC 6962)
          </h3>
        </div>
        <span className="font-mono tabular-nums text-[11px] text-zinc-500">
          {leafCount} {leafCount === 1 ? "leaf" : "leaves"}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="rounded-md bg-zinc-50 border border-zinc-200 px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Committed SHA-256 Merkle Root
          </div>
          <div
            className={`mt-1 font-mono tabular-nums text-xs break-all ${
              isTampered ? "text-red-700 line-through" : "text-zinc-900"
            }`}
          >
            {merkleRoot}
          </div>
          {isTampered && (
            <div className="mt-1 font-mono tabular-nums text-xs text-red-700 break-all">
              Recomputed after edit: {tamperState.computed_root}
            </div>
          )}
        </div>

        {latestLeaf && (
          <div>
            <button
              type="button"
              onClick={() => setShowLeaf((v) => !v)}
              aria-expanded={showLeaf}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 transition-colors"
            >
              {showLeaf ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showLeaf ? "Hide canonical RFC 8785 leaf" : "Show canonical RFC 8785 leaf"}
            </button>
            {showLeaf && (
              <pre className="mt-2 rounded-md bg-zinc-50 border border-zinc-200 p-3 font-mono text-[11px] leading-snug text-zinc-800 overflow-auto max-h-60">
                {JSON.stringify(latestLeaf, Object.keys(latestLeaf).sort(), 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
