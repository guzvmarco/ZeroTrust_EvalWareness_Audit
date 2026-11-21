import React, { useState } from "react";
import {
  FileCheck2,
  FileWarning,
  Download,
  ShieldAlert,
  RotateCcw,
  Info,
  Eye,
  EyeOff,
  Hash,
} from "lucide-react";

/**
 * Step 04 — RFC 8785 / RFC 6962 Merkle Audit Ledger & 1-Bit Tamper Bar
 * Harmonized palette:
 * - Light Sky Blue (#edf2f9) base
 * - Medium Sky Blue (#e1e8f2) hash/leaf inspection pills
 * - Dark Sky Blue (#c1cddd) crisp borders
 * - Warm White (#efe9d9) highlights for active SHA-256 Merkle Root
 * - VERIFIED in #0a843d vs TAMPERED in crimson (#991b1b)
 */
export default function MerkleCustodyBar({
  merkleRoot = "8f4b2e9c1d7a6f3e0b5c8a2d4f9e1b7c3a6d0e4f8b2c5a9d1e7f3b6c0a4d8e2f",
  leafCount = 1,
  latestLeaf = null,
  tamperState = null,
  onExportDossier,
  onSimulateTamper,
  onResetTamper,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [showLeafInspector, setShowLeafInspector] = useState(false);

  const isTampered = tamperState?.status === "TAMPERED";

  return (
    <div
      className={`border-2 transition-colors ${
        isTampered
          ? "bg-[#fee2e2] border-[#991b1b]"
          : "bg-[#edf2f9] border-[#c1cddd]"
      }`}
    >
      {/* Solid ND Blue Section Header */}
      <div className="bg-[#0c2340] text-white px-3.5 py-2 border-b-2 border-[#ae9142] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-[#ae9142] text-[#0c2340]">
            STEP 04
          </span>
          <Hash className="w-4 h-4 text-[#d39f10]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Cryptographic Chain of Custody (RFC 8785 JCS + RFC 6962 Merkle Tree)
          </h2>
          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#e1e8f2] text-[#0c2340] font-bold">
            EU AI Act Art. 12 &amp; Annex IV
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Verification Status Badge */}
          <span
            className={`font-mono text-xs font-black px-2.5 py-0.5 border flex items-center gap-1.5 ${
              isTampered
                ? "bg-[#991b1b] text-white border-white"
                : "bg-[#b3dac5] text-[#0a843d] border-[#0a843d]"
            }`}
          >
            {isTampered ? (
              <>
                <FileWarning className="w-3.5 h-3.5" />
                STATUS: TAMPERED (INTEGRITY FAILURE)
              </>
            ) : (
              <>
                <FileCheck2 className="w-3.5 h-3.5" />
                STATUS: VERIFIED (RFC 6962)
              </>
            )}
          </span>

          <button
            type="button"
            onClick={() => setShowInfo((prev) => !prev)}
            className="text-[#d39f10] hover:text-white p-0.5"
            title="What is the Merkle Audit Ledger?"
          >
            <Info className="w-4 h-4" />
          </button>

          {showInfo && (
            <div className="absolute right-0 top-7 z-30 w-80 bg-[#0c2340] text-[#f8f4ec] border border-[#ae9142] p-3 text-xs leading-relaxed">
              <div className="font-bold text-[#d39f10] mb-1">
                Plain-Language Guide: Merkle Root &amp; RFC 8785
              </div>
              Standard JSON logs can be edited after an incident. Every audit turn here is
              normalized to Unicode NFC, canonicalized via <strong>RFC 8785 (JCS)</strong>, and
              hashed into a <strong>SHA-256 Merkle Tree (RFC 6962)</strong> with <code>0x00</code>{" "}
              leaf and <code>0x01</code> node domain separation. Changing even 1 character in{" "}
              <code>output_B</code> invalidates the Merkle Root immediately.
            </div>
          )}
        </div>
      </div>

      {/* Main Custody Bar Body */}
      <div className="p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Active SHA-256 Merkle Root Highlight in Warm White (#efe9d9) */}
        <div className="flex-1 bg-[#efe9d9] border border-[#c1cddd] px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase text-[#8c7535]">
                Active SHA-256 Merkle Root
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#e1e8f2] border border-[#c1cddd] text-[#0c2340] font-semibold">
                Leaves: {leafCount}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#e1e8f2] border border-[#c1cddd] text-[#0c2340]">
                Leaf: 0x00 || JCS(NFC)
              </span>
            </div>
            <div
              className={`font-mono text-xs font-bold break-all mt-0.5 ${
                isTampered ? "text-[#991b1b] line-through" : "text-[#0c2340]"
              }`}
            >
              {merkleRoot}
            </div>
            {isTampered && (
              <div className="font-mono text-[11px] font-bold text-[#991b1b] break-all mt-1">
                Computed Tampered Root: {tamperState.computed_root} (Mutated field:{" "}
                <span className="underline">{tamperState.tampered_field}</span>)
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowLeafInspector((prev) => !prev)}
            className="shrink-0 font-mono text-[11px] font-semibold px-2.5 py-1 bg-[#e1e8f2] hover:bg-[#c1cddd] text-[#0c2340] border border-[#c1cddd] flex items-center gap-1"
          >
            {showLeafInspector ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Hide Leaf JSON
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Inspect RFC 8785 Leaf
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportDossier}
            className="font-mono text-xs font-bold px-3.5 py-2 bg-[#0c2340] hover:bg-[#163660] text-[#d39f10] border border-[#ae9142] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Dossier (RFC 8785)
          </button>

          {!isTampered ? (
            <button
              type="button"
              onClick={onSimulateTamper}
              className="font-mono text-xs font-bold px-3.5 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white border border-[#0c2340] flex items-center gap-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Simulate 1-Bit Tamper
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetTamper}
              className="font-mono text-xs font-bold px-3.5 py-2 bg-[#0a843d] hover:bg-[#076830] text-white border border-[#0c2340] flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Verified Ledger
            </button>
          )}
        </div>
      </div>

      {/* Expandable Canonical RFC 8785 Leaf Payload Inspector */}
      {showLeafInspector && latestLeaf && (
        <div className="px-3.5 pb-3">
          <div className="bg-[#ffffff] border border-[#c1cddd] p-2.5">
            <div className="flex items-center justify-between font-mono text-[11px] text-[#0c2340] border-b border-[#c1cddd] pb-1 mb-1.5">
              <span className="font-bold">
                Canonical RFC 8785 Leaf Payload (Unicode NFC + 4-Decimal Rounded Floats)
              </span>
              <span className="text-[#8c7535]">Sorted Keys | Compact Separators</span>
            </div>
            <pre className="font-mono text-[11px] text-[#0c2340] overflow-x-auto leading-snug max-h-40">
              {JSON.stringify(latestLeaf, Object.keys(latestLeaf).sort(), 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
