import React, { useState } from "react";
import { Eye, EyeOff, Fingerprint } from "lucide-react";

/**
 * Cryptographic proof panel (shown inside the evidence drawer):
 * SHA-256 Merkle Root + canonical RFC 8785 leaf viewer.
 */
export default function MerkleCustodyBar({ merkleRoot, latestLeaf, leafCount = 1, tamperState }) {
  const [showLeaf, setShowLeaf] = useState(false);
  const isTampered = tamperState?.status === "TAMPERED";

  return (
    <div className="bg-[#edf2f9] border border-[#c1cddd]">
      <div className="px-4 py-3 border-b border-[#c1cddd]">
        <h3 className="text-[15px] font-bold text-[#0c2340] inline-flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-[#ae9142]" />
          Tamper-proof record
        </h3>
        <p className="text-[13px] text-[#0c2340]/70 mt-0.5">
          Every audit is sealed with a SHA-256 fingerprint (RFC 8785 canonical JSON + RFC 6962 Merkle tree).
          Editing even one character changes the fingerprint.
        </p>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-[#efe9d9] border border-[#c1cddd] px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#8c7535] font-semibold">
            <span>Merkle Root (SHA-256)</span>
            <span className="px-1.5 py-px bg-[#e1e8f2] border border-[#c1cddd] text-[#0c2340] font-mono">
              {leafCount} {leafCount === 1 ? "record" : "records"}
            </span>
          </div>
          <div
            className={`mt-1 font-mono text-[13px] break-all ${
              isTampered ? "text-[#991b1b] line-through" : "text-[#0c2340]"
            }`}
          >
            {merkleRoot}
          </div>
          {isTampered && (
            <div className="mt-1.5 font-mono text-[13px] text-[#991b1b] break-all">
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
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 bg-[#e1e8f2] hover:bg-[#c1cddd] text-[#0c2340] border border-[#c1cddd]"
            >
              {showLeaf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showLeaf ? "Hide canonical record" : "Show canonical record (RFC 8785)"}
            </button>
            {showLeaf && (
              <pre className="mt-2 bg-white border border-[#c1cddd] p-3 font-mono text-[12px] leading-snug text-[#0c2340] overflow-auto max-h-64">
                {JSON.stringify(latestLeaf, Object.keys(latestLeaf).sort(), 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
