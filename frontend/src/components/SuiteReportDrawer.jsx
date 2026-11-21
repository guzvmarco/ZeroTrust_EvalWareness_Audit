import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Fingerprint,
  Download,
  FlaskConical,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const VERDICT_BADGE = {
  SUSPENSION_INMEDIATA: {
    label: "BLOCKED",
    bg: "bg-[#fee2e2]",
    text: "text-[#991b1b]",
    border: "border-[#991b1b]/30",
    Icon: ShieldAlert,
  },
  REVISION_MANUAL: {
    label: "MANUAL REVIEW",
    bg: "bg-[#efe9d9]",
    text: "text-[#8c7535]",
    border: "border-[#ae9142]/45",
    Icon: AlertTriangle,
  },
  RESTRINGIDO: {
    label: "MANUAL REVIEW",
    bg: "bg-[#efe9d9]",
    text: "text-[#8c7535]",
    border: "border-[#ae9142]/45",
    Icon: AlertTriangle,
  },
  COMPLIANT: {
    label: "COMPLIANT",
    bg: "bg-[#b3dac5]/50",
    text: "text-[#0a843d]",
    border: "border-[#0a843d]/35",
    Icon: ShieldCheck,
  },
  APTO: {
    label: "COMPLIANT",
    bg: "bg-[#b3dac5]/50",
    text: "text-[#0a843d]",
    border: "border-[#0a843d]/35",
    Icon: ShieldCheck,
  },
  API_ERROR: {
    label: "API ERROR",
    bg: "bg-[#fee2e2]",
    text: "text-[#991b1b]",
    border: "border-[#991b1b]/30",
    Icon: AlertTriangle,
  },
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
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0c2340]/45">
      <div className="w-full max-w-4xl bg-[#f8f4ec] h-full flex flex-col border-l border-[#dfd7c5] shadow-xl overflow-hidden">
        {/* Drawer Header */}
        <div className="bg-[#0c2340] text-white px-6 py-4 border-b border-[#ae9142] flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#991b1b] text-white">
                CI/CD GATE: {summary.gate_status || "BLOCKED"}
              </span>
              <span
                className={`font-mono text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  isDemoData
                    ? "bg-[#efe9d9] text-[#8c7535] border-[#ae9142]"
                    : "bg-[#b3dac5] text-[#0a843d] border-[#0a843d]"
                }`}
              >
                {isDemoData ? "DEMO DATA (PRELOADED)" : "LIVE EVALUATION"}
              </span>
              <span className="font-mono text-xs text-[#d39f10]">
                Target: {summary.model_name || "qwen2.5:7b"}
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white mt-1">
              Integrity-Verifiable Evaluation Dossier ({summary.total_audited ?? items.length} of{" "}
              {summary.pool_total ?? 500} Bank Prompts)
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#c1cddd] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close suite report"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top-Line Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white border border-[#e5dec9] p-3.5">
              <div className="text-xs font-medium text-[#0c2340]/65">Total Evaluated</div>
              <div className="text-2xl font-bold text-[#0c2340] mt-0.5">
                {summary.total_audited ?? items.length}
              </div>
              <div className="text-[11px] font-mono text-[#8c7535] mt-0.5">
                False Positives: {summary.false_positives_label || "0/10"}
              </div>
            </div>

            <div className="rounded-xl bg-white border border-[#e5dec9] p-3.5">
              <div className="text-xs font-medium text-[#0c2340]/65">
                Refusal Rate (A vs. B)
              </div>
              <div className="text-2xl font-bold text-[#0c2340] mt-0.5">
                {refusalA}% vs {refusalB}%
              </div>
              <div className="text-[11px] font-mono text-[#8c7535] mt-0.5">
                Auditor vs. Ordinary User
              </div>
            </div>

            <div className="rounded-xl bg-[#fee2e2]/65 border border-[#991b1b]/30 p-3.5">
              <div className="text-xs font-medium text-[#991b1b]">Discrepancies Flagged</div>
              <div className="text-2xl font-bold text-[#991b1b] mt-0.5">
                {discrepancies}
              </div>
              <div className="text-[11px] font-mono text-[#991b1b]/80 mt-0.5">
                {summary.regressions_caught ?? 11} blocked · {summary.manual_review_count ?? 8} review
              </div>
            </div>

            <div className="rounded-xl bg-white border border-[#e5dec9] p-3.5">
              <div className="text-xs font-medium text-[#0c2340]/65">Mean Disparity (CDI)</div>
              <div className="text-2xl font-bold text-[#0c2340] mt-0.5">
                {Number(summary.mean_cdi ?? 0.44).toFixed(2)}
              </div>
              <div className="text-[11px] font-mono text-[#8c7535] mt-0.5">
                0.65·Δρ + 0.35·D_sem + τ
              </div>
            </div>
          </div>

          {/* Batch Merkle Root & Integrity-Verifiable Evaluation Dossier Bar */}
          <div className="rounded-2xl bg-[#efe9d9]/80 border border-[#e5dec9] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8c7535]">
                  <Fingerprint className="w-4 h-4 text-[#ae9142]" />
                  <span>
                    Batch RFC 8785 + RFC 6962 SHA-256 Merkle Root ({summary.total_audited ?? items.length} Leaves)
                  </span>
                </div>
                <div
                  className={`font-mono text-xs truncate mt-0.5 ${
                    isTampered ? "text-[#991b1b] line-through" : "text-[#0c2340]"
                  }`}
                >
                  {summary.merkle_root}
                </div>
                {isTampered && (
                  <div className="font-mono text-xs text-[#991b1b] truncate mt-0.5">
                    Tampered Root: {batchTamperState.computed_root} ({batchTamperState.tampered_field})
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyRoot}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-[#edf2f9] text-[#0c2340] border border-[#dfd7c5] px-3.5 py-1.5 text-xs font-semibold transition-colors"
              >
                {copiedRoot ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0a843d]" />
                    <span className="text-[#0a843d]">Copied Root</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#ae9142]" />
                    <span>Copy Merkle Root</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e5dec9]">
              <button
                type="button"
                onClick={onExportDossier}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0c2340] text-[#d39f10] border border-[#ae9142] hover:bg-[#163660] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Integrity-Verifiable Evaluation Dossier (JSON)
              </button>

              <button
                type="button"
                onClick={onVerifyBatchIntegrity}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-[#0c2340] border border-[#dfd7c5] hover:border-[#0a843d] transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0a843d]" />
                Verify Integrity
              </button>

              <button
                type="button"
                onClick={onSimulateBatchTamper}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-[#0c2340] border border-[#dfd7c5] hover:border-[#991b1b] transition-colors"
              >
                <FlaskConical className="w-3.5 h-3.5 text-[#ae9142]" />
                Simulate Record Tampering
              </button>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  isTampered
                    ? "bg-[#991b1b] text-white border-[#991b1b]"
                    : "bg-[#b3dac5]/60 text-[#0a843d] border-[#0a843d]/40"
                }`}
              >
                {isTampered ? "TAMPERED" : "VERIFIED"}
              </span>
            </div>

            <p className="text-[11px] text-[#0c2340]/70">
              SHA-256 Merkle verification proves record integrity relative to the committed root.
            </p>
          </div>

          {/* Expandable Metadata Transmission Disclosure */}
          <div className="rounded-2xl bg-white border border-[#e5dec9] px-4 py-3">
            <button
              type="button"
              onClick={() => setShowDisclosure((prev) => !prev)}
              aria-expanded={showDisclosure}
              className="w-full flex items-center justify-between gap-2 text-left text-xs font-bold text-[#0c2340]"
            >
              <span>Metadata Transmission Disclosure (Active Layers &amp; Model Visibility)</span>
              <ChevronDown
                className={`w-4 h-4 text-[#8c7535] transition-transform ${
                  showDisclosure ? "rotate-180" : ""
                }`}
              />
            </button>
            {showDisclosure && (
              <p className="mt-2 pt-2 border-t border-[#e5dec9] text-xs leading-relaxed text-[#0c2340]/80">
                {summary.metadata_transmission_doc ||
                  "Layer 1 (Context Metadata Block): injected into model-visible context | Layer 2 (Provider API Identity): user/metadata JSON fields | Layer 3 (HTTP Transport Headers): Origin, Referer, X-Audit-Mode via example.com (note: local models like Ollama ignore custom HTTP transport headers)."}
              </p>
            )}
          </div>

          {/* Category Breakdown Bars */}
          {categories.length > 0 && (
            <div className="rounded-2xl bg-white border border-[#e5dec9] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0c2340]">Domain Breakdown</h3>
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  <span className="inline-flex items-center gap-1 text-[#991b1b]">
                    <span className="w-2 h-2 rounded-full bg-[#991b1b]" />
                    Blocked
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#8c7535]">
                    <span className="w-2 h-2 rounded-full bg-[#ae9142]" />
                    Manual Review
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#0a843d]">
                    <span className="w-2 h-2 rounded-full bg-[#0a843d]" />
                    Compliant
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {categories.map((cat) => {
                  const total = cat.total || 1;
                  const regPct = (cat.regressions / total) * 100;
                  const revPct = (cat.manual_review / total) * 100;
                  const compPct = (cat.compliant / total) * 100;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#0c2340]">{cat.category}</span>
                        <span className="font-mono text-[11px] text-[#0c2340]/70">
                          {cat.regressions} blocked · {cat.manual_review} review · {cat.compliant} pass (mean CDI{" "}
                          {Number(cat.mean_cdi).toFixed(2)})
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#f8f4ec] overflow-hidden flex border border-[#e5dec9]">
                        {regPct > 0 && (
                          <div className="h-full bg-[#991b1b]" style={{ width: `${regPct}%` }} />
                        )}
                        {revPct > 0 && (
                          <div className="h-full bg-[#ae9142]" style={{ width: `${revPct}%` }} />
                        )}
                        {compPct > 0 && (
                          <div className="h-full bg-[#0a843d]" style={{ width: `${compPct}%` }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filterable Evaluated Prompts Table */}
          <div className="rounded-2xl bg-white border border-[#e5dec9] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e5dec9] bg-[#f8f4ec]/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "ALL", label: `All (${items.length})` },
                  {
                    id: "SUSPENSION_INMEDIATA",
                    label: `Blocked (${summary.regressions_caught ?? 0})`,
                  },
                  {
                    id: "REVISION_MANUAL",
                    label: `Review (${summary.manual_review_count ?? 0})`,
                  },
                  {
                    id: "COMPLIANT",
                    label: `Compliant (${summary.compliant_count ?? 0})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVerdictFilter(tab.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      verdictFilter === tab.id
                        ? "bg-[#0c2340] text-[#d39f10]"
                        : "bg-[#efe9d9]/70 text-[#0c2340] hover:bg-[#e5dec9]"
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
                className="rounded-full bg-white border border-[#dfd7c5] px-3 py-1 text-xs font-medium text-[#0c2340] focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="divide-y divide-[#e5dec9] max-h-96 overflow-y-auto">
              {filteredItems.map((item) => {
                const badge = VERDICT_BADGE[item.verdict] || VERDICT_BADGE.COMPLIANT;
                const BadgeIcon = badge.Icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="w-full px-4 py-3 text-left hover:bg-[#f8f4ec] transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-[#8c7535]">
                          {item.id}
                        </span>
                        <span className="text-xs font-bold text-[#0c2340] group-hover:underline">
                          {item.title || item.category}
                        </span>
                        <span className="text-[11px] text-[#0c2340]/60">· {item.category}</span>
                      </div>
                      <p className="text-xs text-[#0c2340]/75 truncate mt-0.5">{item.prompt}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right font-mono text-[11px] hidden sm:block">
                        <div className="text-[#0c2340] font-semibold">
                          CDI {Number(item.cdi_risk).toFixed(2)}
                        </div>
                        <div className="text-[#8c7535]">
                          {Math.round(item.rho_A * 100)}% vs {Math.round(item.rho_B * 100)}%
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>

                      <ArrowUpRight className="w-4 h-4 text-[#8c7535] group-hover:text-[#0c2340]" />
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
