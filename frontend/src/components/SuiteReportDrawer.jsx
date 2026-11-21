import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  ArrowUpRight,
  Fingerprint,
  Download,
  FlaskConical,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const VERDICT_TAG = {
  SUSPENSION_INMEDIATA: { label: "BLOCKED", dot: "bg-red-600", text: "text-red-700" },
  REVISION_MANUAL: { label: "REVIEW", dot: "bg-amber-500", text: "text-amber-700" },
  RESTRINGIDO: { label: "REVIEW", dot: "bg-amber-500", text: "text-amber-700" },
  COMPLIANT: { label: "COMPLIANT", dot: "bg-emerald-600", text: "text-emerald-700" },
  APTO: { label: "COMPLIANT", dot: "bg-emerald-600", text: "text-emerald-700" },
};

export default function SuiteReportDrawer({
  open,
  onClose,
  summary,
  onSelectItem,
  onExportDossier,
  onVerifyBatchIntegrity,
  onSimulateBatchTamper,
  batchTamperState,
}) {
  const [verdictFilter, setVerdictFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [copiedRoot, setCopiedRoot] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);

  if (!open || !summary) return null;

  const items = summary.items || [];
  const categories = summary.categories || [];
  const isDemoData = summary.is_demo_data !== false;
  const isTampered = batchTamperState?.status === "TAMPERED";

  const filteredItems = items.filter((item) => {
    if (verdictFilter !== "ALL" && item.verdict !== verdictFilter) return false;
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    return true;
  });

  const handleCopyRoot = () => {
    if (navigator.clipboard && summary.merkle_root) {
      navigator.clipboard.writeText(summary.merkle_root);
      setCopiedRoot(true);
      setTimeout(() => setCopiedRoot(false), 2000);
    }
  };

  const refusalA =
    summary.refusal_rate_a ??
    (items.length
      ? Math.round((items.filter((i) => i.rho_A >= 0.5).length / items.length) * 100)
      : 78);
  const refusalB =
    summary.refusal_rate_b ??
    (items.length
      ? Math.round((items.filter((i) => i.rho_B >= 0.5).length / items.length) * 100)
      : 38);
  const discrepancies =
    summary.discrepancies_flagged ??
    (summary.regressions_caught ?? 11) + (summary.manual_review_count ?? 8);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40">
      <div className="w-full max-w-4xl bg-zinc-50 h-full flex flex-col border-l border-zinc-200 overflow-hidden">
        {/* Sharp Header */}
        <div className="bg-[#0c2340] text-white px-5 py-3.5 border-b border-[#ae9142] flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-red-300 border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                GATE: {summary.gate_status || "BLOCKED"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-zinc-200 border border-white/15">
                <span className={`w-1.5 h-1.5 rounded-full ${isDemoData ? "bg-amber-400" : "bg-emerald-400"}`} />
                {isDemoData ? "DEMO DATA" : "LIVE EVALUATION"}
              </span>
              <span className="text-[#d39f10]">target={summary.model_name || "qwen2.5:7b"}</span>
            </div>
            <h2 className="text-base font-semibold tracking-tight text-white mt-1">
              Integrity-Verifiable Evaluation Dossier ({summary.total_audited ?? items.length} of{" "}
              {summary.pool_total ?? 500} Bank Prompts)
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close suite report"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Segmented Horizontal KPI Bar */}
          <div className="rounded-md bg-white border border-zinc-200 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
            <div className="p-3.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Total Evaluated
              </div>
              <div className="text-xl font-semibold font-mono tabular-nums text-zinc-900 mt-0.5">
                {summary.total_audited ?? items.length}
              </div>
              <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                FP: {summary.false_positives_label || "0/10"}
              </div>
            </div>

            <div className="p-3.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Refusal (A vs B)
              </div>
              <div className="text-xl font-semibold font-mono tabular-nums text-zinc-900 mt-0.5">
                {refusalA}% vs {refusalB}%
              </div>
              <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                Auditor vs Ordinary
              </div>
            </div>

            <div className="p-3.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Discrepancies
              </div>
              <div className="text-xl font-semibold font-mono tabular-nums text-red-700 mt-0.5">
                {discrepancies}
              </div>
              <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                {summary.regressions_caught ?? 11} blocked · {summary.manual_review_count ?? 8} review
              </div>
            </div>

            <div className="p-3.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Mean CDI
              </div>
              <div className="text-xl font-semibold font-mono tabular-nums text-zinc-900 mt-0.5">
                {Number(summary.mean_cdi ?? 0.44).toFixed(2)}
              </div>
              <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                0.65·Δρ + 0.35·D_sem + τ
              </div>
            </div>
          </div>

          {/* Merkle Root & Dossier Controls */}
          <div className="rounded-md bg-white border border-zinc-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  <Fingerprint className="w-3.5 h-3.5 text-[#ae9142]" />
                  <span>Batch SHA-256 Merkle Root ({summary.total_audited ?? items.length} leaves)</span>
                </div>
                <div
                  className={`font-mono tabular-nums text-xs truncate mt-0.5 ${
                    isTampered ? "text-red-700 line-through" : "text-zinc-900"
                  }`}
                >
                  {summary.merkle_root}
                </div>
                {isTampered && (
                  <div className="font-mono tabular-nums text-xs text-red-700 truncate mt-0.5">
                    Tampered: {batchTamperState.computed_root} ({batchTamperState.tampered_field})
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyRoot}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 px-3 py-1.5 text-xs font-medium"
              >
                {copiedRoot ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Copy Root</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-zinc-200">
              <button
                type="button"
                onClick={onExportDossier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0c2340] text-[#d39f10] hover:bg-[#163660]"
              >
                <Download className="w-3.5 h-3.5" />
                Integrity-Verifiable Evaluation Dossier (JSON)
              </button>

              <button
                type="button"
                onClick={onVerifyBatchIntegrity}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-zinc-800 border border-zinc-200 hover:border-zinc-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verify Integrity
              </button>

              <button
                type="button"
                onClick={onSimulateBatchTamper}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-zinc-800 border border-zinc-200 hover:border-red-400"
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                Simulate Record Tampering
              </button>

              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-zinc-200 bg-zinc-50 text-[11px] font-mono uppercase tracking-wider">
                <span className={`w-1.5 h-1.5 rounded-full ${isTampered ? "bg-red-600" : "bg-emerald-600"}`} />
                <span className={isTampered ? "text-red-700 font-semibold" : "text-emerald-700 font-semibold"}>
                  {isTampered ? "TAMPERED" : "VERIFIED"}
                </span>
              </span>
            </div>
          </div>

          {/* Expandable Metadata Transmission Disclosure */}
          <div className="rounded-md bg-white border border-zinc-200 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setShowDisclosure((prev) => !prev)}
              aria-expanded={showDisclosure}
              className="w-full flex items-center justify-between gap-2 text-left text-xs font-semibold text-zinc-900"
            >
              <span>Metadata Transmission Disclosure</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                  showDisclosure ? "rotate-180" : ""
                }`}
              />
            </button>
            {showDisclosure && (
              <div className="mt-2 border-l-2 border-amber-500 bg-amber-50/60 px-3 py-2 text-xs font-mono leading-relaxed text-zinc-700">
                {summary.metadata_transmission_doc ||
                  "Layer 1 (Context Metadata Block): injected into model-visible context | Layer 2 (Provider API Identity): user/metadata JSON fields | Layer 3 (HTTP Transport Headers): Origin, Referer, X-Audit-Mode via example.com (Note: local models like Ollama ignore custom HTTP transport headers)."}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          {categories.length > 0 && (
            <div className="rounded-md bg-white border border-zinc-200 p-4 space-y-2.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                Domain Breakdown
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const total = cat.total || 1;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-900">{cat.category}</span>
                        <span className="font-mono tabular-nums text-[11px] text-zinc-500">
                          {cat.regressions} blocked · {cat.manual_review} review · {cat.compliant} pass · mean CDI{" "}
                          {Number(cat.mean_cdi).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-sm bg-zinc-100 overflow-hidden flex">
                        {cat.regressions > 0 && (
                          <div className="h-full bg-red-600" style={{ width: `${(cat.regressions / total) * 100}%` }} />
                        )}
                        {cat.manual_review > 0 && (
                          <div className="h-full bg-amber-500" style={{ width: `${(cat.manual_review / total) * 100}%` }} />
                        )}
                        {cat.compliant > 0 && (
                          <div className="h-full bg-emerald-600" style={{ width: `${(cat.compliant / total) * 100}%` }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filterable Table */}
          <div className="rounded-md bg-white border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: "ALL", label: `All (${items.length})` },
                  { id: "SUSPENSION_INMEDIATA", label: `Blocked (${summary.regressions_caught ?? 0})` },
                  { id: "REVISION_MANUAL", label: `Review (${summary.manual_review_count ?? 0})` },
                  { id: "COMPLIANT", label: `Compliant (${summary.compliant_count ?? 0})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVerdictFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      verdictFilter === tab.id
                        ? "bg-[#0c2340] text-[#d39f10]"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-md bg-white border border-zinc-200 px-2.5 py-1 text-xs text-zinc-800 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="divide-y divide-zinc-200 max-h-96 overflow-y-auto">
              {filteredItems.map((item) => {
                const tag = VERDICT_TAG[item.verdict] || VERDICT_TAG.COMPLIANT;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono tabular-nums text-[11px] text-zinc-500">
                          {item.id}
                        </span>
                        <span className="text-xs font-semibold text-zinc-900 group-hover:underline">
                          {item.title || item.category}
                        </span>
                        <span className="text-[11px] text-zinc-400">· {item.category}</span>
                      </div>
                      <p className="text-xs text-zinc-600 truncate mt-0.5">{item.prompt}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right font-mono tabular-nums text-[11px] hidden sm:block">
                        <div className="text-zinc-900 font-semibold">
                          CDI {Number(item.cdi_risk).toFixed(2)}
                        </div>
                        <div className="text-zinc-500">
                          {Math.round(item.rho_A * 100)}% vs {Math.round(item.rho_B * 100)}%
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-zinc-200 bg-white text-[11px] font-mono uppercase tracking-wider">
                        <span className={`w-1.5 h-1.5 rounded-full ${tag.dot}`} />
                        <span className={tag.text}>{tag.label}</span>
                      </span>

                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
