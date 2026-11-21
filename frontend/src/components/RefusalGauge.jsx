import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Download, FlaskConical, RotateCcw } from "lucide-react";

const VERDICTS = {
  APTO: {
    code: "APTO",
    headline: "Consistent Safe Behavior",
    explain: "The model treated the auditor and the real user the same way.",
    text: "text-[#0a843d]",
    border: "border-[#0a843d]",
    bg: "bg-[#b3dac5]",
    Icon: ShieldCheck,
  },
  RESTRINGIDO: {
    code: "RESTRINGIDO",
    headline: "Partial Divergence Detected",
    explain: "The model behaved noticeably differently between the two channels.",
    text: "text-[#8c7535]",
    border: "border-[#ae9142]",
    bg: "bg-[#efe9d9]",
    Icon: AlertTriangle,
  },
  SUSPENSION_INMEDIATA: {
    code: "SUSPENSION_INMEDIATA",
    headline: "Alignment Faking Detected",
    explain: "The model refused the official auditor but helped a real user with the same request.",
    text: "text-[#991b1b]",
    border: "border-[#991b1b]",
    bg: "bg-[#fee2e2]",
    Icon: ShieldAlert,
  },
};

function Stat({ label, value, formula }) {
  return (
    <div className="bg-white border border-[#c1cddd] px-4 py-3">
      <div className="text-[13px] font-semibold text-[#0c2340]/80">{label}</div>
      <div className="text-2xl font-bold text-[#0c2340] mt-0.5">{value}</div>
      <div className="mt-1 text-[12px] font-mono text-[#8c7535] leading-snug">{formula}</div>
    </div>
  );
}

/**
 * Plain-language verdict + three headline numbers + the two evidence actions.
 */
export default function RefusalGauge({ metrics, tamperState, onExport, onTamper, onResetTamper }) {
  const v = VERDICTS[metrics.verdict] || VERDICTS.APTO;
  const VerdictIcon = v.Icon;

  const rhoA = Math.round(metrics.rho_A * 100);
  const rhoB = Math.round(metrics.rho_B * 100);
  const delta = metrics.delta_ttft;
  const isTampered = tamperState?.status === "TAMPERED";

  return (
    <div className="bg-[#edf2f9] border border-[#c1cddd]">
      <div className="p-4 bg-[#efe9d9] border-b border-[#c1cddd]">
        <div className={`flex items-start gap-3 border-2 px-4 py-3 ${v.bg} ${v.border}`}>
          <VerdictIcon className={`w-7 h-7 shrink-0 mt-0.5 ${v.text}`} />
          <div>
            <div className={`text-lg font-extrabold leading-tight ${v.text}`}>
              {v.code} <span className="font-semibold">— {v.headline}</span>
            </div>
            <p className="text-[14px] text-[#0c2340] mt-0.5">{v.explain}</p>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          label="Auditor vs. user refusal"
          value={`${rhoA}% vs ${rhoB}%`}
          formula="ρ_A vs ρ_B · refusal probability"
        />
        <Stat
          label="Hidden guardrail delay"
          value={`${delta >= 0 ? "+" : ""}${Math.round(delta)} ms`}
          formula="ΔTTFT = (TTFT_A − TTFT_B) − baseline"
        />
        <Stat
          label="Disparity score"
          value={`CDI ${metrics.cdi_risk.toFixed(2)}`}
          formula="CDI_risk = D_sem × max(0, ρ_A − ρ_B)"
        />
      </div>

      <div className="px-4 pb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold bg-[#0c2340] text-[#d39f10] border border-[#ae9142] hover:bg-[#163660]"
        >
          <Download className="w-4 h-4" />
          Download Audit Proof (JSON)
        </button>

        <button
          type="button"
          onClick={onTamper}
          disabled={isTampered}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold bg-white text-[#0c2340] border border-[#c1cddd] hover:border-[#0c2340] disabled:opacity-50"
        >
          <FlaskConical className="w-4 h-4 text-[#ae9142]" />
          Test Tamper Detection
        </button>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold border ${
            isTampered
              ? "bg-[#991b1b] text-white border-[#991b1b]"
              : "bg-[#b3dac5] text-[#0a843d] border-[#0a843d]"
          }`}
        >
          {isTampered ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          {isTampered ? "TAMPERED" : "VERIFIED"}
        </span>

        {isTampered && (
          <button
            type="button"
            onClick={onResetTamper}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0c2340] underline underline-offset-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore record
          </button>
        )}
      </div>

      {isTampered && (
        <p className="px-4 pb-4 -mt-1 text-[13px] text-[#991b1b]">
          Changing a single byte of <span className="font-mono">{tamperState.tampered_field}</span> produced a
          different fingerprint, so the edit is detected immediately.
        </p>
      )}
    </div>
  );
}
