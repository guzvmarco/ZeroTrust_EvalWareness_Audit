import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  Customized,
} from "recharts";
import { Lock } from "lucide-react";

function TrajectoryArrowOverlay({ xAxisMap, yAxisMap, pcaBefore, pcaAfter }) {
  if (!xAxisMap || !yAxisMap || !pcaBefore || !pcaAfter) return null;
  const xAxis = Object.values(xAxisMap)[0];
  const yAxis = Object.values(yAxisMap)[0];
  if (!xAxis?.scale || !yAxis?.scale) return null;

  const x1 = xAxis.scale(pcaBefore[0]);
  const y1 = yAxis.scale(pcaBefore[1]);
  const x2 = xAxis.scale(pcaAfter[0]);
  const y2 = yAxis.scale(pcaAfter[1]);
  if ([x1, y1, x2, y2].some((v) => typeof v !== "number" || Number.isNaN(v))) return null;

  const halo = { stroke: "#ffffff", strokeWidth: 4, paintOrder: "stroke" };

  return (
    <g>
      <defs>
        <marker id="nd-green-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M 0 1 L 7 4 L 0 7 z" fill="#059669" />
        </marker>
      </defs>

      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#059669"
        strokeWidth="2"
        strokeDasharray="4 3"
        markerEnd="url(#nd-green-arrowhead)"
      />

      <circle cx={x1} cy={y1} r={5.5} fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
      <text x={x1} y={y1 - 11} textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="600" style={halo}>
        x (Formal)
      </text>

      <circle cx={x2} cy={y2} r={6.5} fill="#059669" stroke="#ffffff" strokeWidth="2" />
      <text x={x2} y={y2 - 12} textAnchor="middle" fill="#059669" fontSize="11" fontWeight="600" style={halo}>
        x&apos; (Canary)
      </text>
    </g>
  );
}

function CustomScatterTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  return (
    <div className="bg-white rounded-md border border-zinc-200 px-3 py-2 text-xs max-w-xs">
      <div className="font-semibold text-zinc-900 mb-0.5">{pt.label || pt.group}</div>
      {typeof pt.cosine === "number" && (
        <div className="font-mono tabular-nums text-[11px] text-emerald-700 mb-1">
          cos(e_x&apos;, e_x) = {pt.cosine.toFixed(3)}
        </div>
      )}
      {pt.text && <div className="text-[11px] text-zinc-600 leading-snug">{pt.text}</div>}
    </div>
  );
}

export default function PcaScatterPlot({
  evalPoints = [],
  civilPoints = [],
  camouflageResult,
  frozenEntities = [],
}) {
  const evalData = evalPoints.map((pt, i) => ({ x: pt[0], y: pt[1], label: `Eval Ref #${i + 1}` }));
  const civilData = civilPoints.map((pt, i) => ({ x: pt[0], y: pt[1], label: `Civil Ref #${i + 1}` }));
  const candidateData = (camouflageResult?.candidates || []).map((c) => ({
    x: c.coords_2d[0],
    y: c.coords_2d[1],
    label: c.label,
    cosine: c.cosine_similarity,
    text: c.prompt,
  }));

  const pcaBefore = camouflageResult?.pca_before || [-1.85, -0.35];
  const pcaAfter = camouflageResult?.pca_after || [1.62, 0.42];
  const cosine = camouflageResult?.cosine_similarity ?? 0;
  const meetsThreshold = camouflageResult?.meets_threshold ?? cosine >= 0.78;
  const axisTick = { fontSize: 10, fill: "#52525b", fontFamily: "JetBrains Mono" };

  return (
    <div className="bg-white rounded-md border border-zinc-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold text-zinc-900">
            2D PCA Semantic Trajectory (all-MiniLM-L6-v2)
          </h3>
          <p className="text-[11px] text-zinc-500">
            Formal benchmark framing (c_eval) -&gt; organic user framing (c_civil)
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono tabular-nums uppercase tracking-wider border border-zinc-200 bg-white rounded-md px-2 py-0.5 text-zinc-800">
          <span className={`w-1.5 h-1.5 rounded-full ${meetsThreshold ? "bg-emerald-600" : "bg-amber-500"}`} />
          cos {cosine.toFixed(3)} {meetsThreshold ? ">= 0.78" : "< 0.78"}
        </span>
      </div>

      <div className="p-3">
        <div className="h-64 w-full rounded-md border border-zinc-200 bg-white overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: -10 }}>
              <CartesianGrid stroke="#f4f4f5" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" domain={[-3.6, 3.6]} tick={axisTick} tickLine={{ stroke: "#e4e4e7" }} axisLine={{ stroke: "#e4e4e7" }} />
              <YAxis type="number" dataKey="y" domain={[-2.2, 2.2]} tick={axisTick} tickLine={{ stroke: "#e4e4e7" }} axisLine={{ stroke: "#e4e4e7" }} />
              <Tooltip content={<CustomScatterTooltip />} />

              <ReferenceArea
                x1={-3.5}
                x2={-0.35}
                y1={-2.05}
                y2={2.05}
                fill="#fee2e2"
                fillOpacity={0.3}
                stroke="#fecaca"
                label={{ value: "c_eval", position: "insideTop", fill: "#b91c1c", fontSize: 11, fontWeight: 600 }}
              />
              <ReferenceArea
                x1={0.35}
                x2={3.5}
                y1={-2.05}
                y2={2.05}
                fill="#d1fae5"
                fillOpacity={0.35}
                stroke="#a7f3d0"
                label={{ value: "c_civil", position: "insideTop", fill: "#047857", fontSize: 11, fontWeight: 600 }}
              />

              <Scatter name="c_eval" data={evalData} fill="#dc2626" opacity={0.4} />
              <Scatter name="c_civil" data={civilData} fill="#059669" opacity={0.45} />
              <Scatter name="Candidates" data={candidateData} fill="#d97706" opacity={0.85} />
              <Customized component={<TrajectoryArrowOverlay pcaBefore={pcaBefore} pcaAfter={pcaAfter} />} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {frozenEntities.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 inline-flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              Frozen Entities:
            </span>
            {frozenEntities.map((e) => (
              <span key={e} className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-800">
                {e}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
