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
import { CheckCircle2, AlertTriangle, Lock } from "lucide-react";

/**
 * Custom SVG layer: arrow from the original prompt (x) to the rewritten prompt (x').
 * Labels use a white halo and sit directly above their points, so they never collide
 * with the zone captions (which are rendered at the top of each shaded zone).
 */
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
          <path d="M 0 1 L 7 4 L 0 7 z" fill="#0a843d" />
        </marker>
      </defs>

      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#0a843d"
        strokeWidth="2"
        strokeDasharray="5 3"
        markerEnd="url(#nd-green-arrowhead)"
      />

      <circle cx={x1} cy={y1} r={6} fill="#991b1b" stroke="#ffffff" strokeWidth="1.5" />
      <text
        x={x1}
        y={y1 - 12}
        textAnchor="middle"
        fill="#991b1b"
        fontSize="12"
        fontWeight="700"
        style={halo}
      >
        Original prompt
      </text>

      <circle cx={x2} cy={y2} r={7} fill="#0a843d" stroke="#ffffff" strokeWidth="2" />
      <text
        x={x2}
        y={y2 - 13}
        textAnchor="middle"
        fill="#0a843d"
        fontSize="12"
        fontWeight="700"
        style={halo}
      >
        Rewritten prompt
      </text>
    </g>
  );
}

function CustomScatterTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  return (
    <div className="bg-white border border-[#0c2340] px-3 py-2 text-xs max-w-xs">
      <div className="font-semibold text-[#0c2340] mb-1">{pt.label || pt.group}</div>
      {typeof pt.cosine === "number" && (
        <div className="font-mono text-[11px] text-[#0a843d] mb-1">
          cos(e_x&apos;, e_x) = {pt.cosine.toFixed(3)}
        </div>
      )}
      {pt.text && <div className="text-[12px] text-[#0c2340] leading-snug">{pt.text}</div>}
    </div>
  );
}

export default function PcaScatterPlot({
  evalPoints = [],
  civilPoints = [],
  camouflageResult,
  frozenEntities = [],
}) {
  const evalData = evalPoints.map((pt, i) => ({
    x: pt[0],
    y: pt[1],
    label: `Benchmark-style prompt #${i + 1}`,
  }));
  const civilData = civilPoints.map((pt, i) => ({
    x: pt[0],
    y: pt[1],
    label: `Everyday-user prompt #${i + 1}`,
  }));
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

  const axisTick = { fontSize: 11, fill: "#0c2340" };

  return (
    <div className="bg-white border border-[#c1cddd]">
      <div className="px-4 py-3 border-b border-[#c1cddd] bg-[#edf2f9] flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-bold text-[#0c2340]">How the prompt was rewritten</h3>
          <p className="text-[13px] text-[#0c2340]/70">
            Same technical request, reworded to sound like an everyday user instead of a benchmark.
          </p>
        </div>
        <span
          className={`text-[12px] font-semibold px-2.5 py-1 border inline-flex items-center gap-1.5 ${
            meetsThreshold
              ? "bg-[#b3dac5] text-[#0a843d] border-[#0a843d]"
              : "bg-[#efe9d9] text-[#8c7535] border-[#ae9142]"
          }`}
          title="Cosine similarity between the original and rewritten prompt embeddings (all-MiniLM-L6-v2). Must be at least 0.78 to count as the same request."
        >
          {meetsThreshold ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          Same meaning · cos {cosine.toFixed(2)} {meetsThreshold ? "≥ 0.78" : "< 0.78"}
        </span>
      </div>

      <div className="p-4">
        <div className="h-72 w-full border border-[#c1cddd] bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 20, bottom: 8, left: -8 }}>
              <CartesianGrid stroke="#e1e8f2" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[-3.6, 3.6]}
                tick={axisTick}
                tickLine={{ stroke: "#c1cddd" }}
                axisLine={{ stroke: "#c1cddd" }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[-2.2, 2.2]}
                tick={axisTick}
                tickLine={{ stroke: "#c1cddd" }}
                axisLine={{ stroke: "#c1cddd" }}
              />
              <Tooltip content={<CustomScatterTooltip />} />

              <ReferenceArea
                x1={-3.5}
                x2={-0.35}
                y1={-2.05}
                y2={2.05}
                fill="#fee2e2"
                fillOpacity={0.4}
                stroke="#fecaca"
                label={{
                  value: "Looks like a benchmark (c_eval)",
                  position: "insideTop",
                  fill: "#991b1b",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <ReferenceArea
                x1={0.35}
                x2={3.5}
                y1={-2.05}
                y2={2.05}
                fill="#b3dac5"
                fillOpacity={0.5}
                stroke="#0a843d"
                strokeOpacity={0.35}
                label={{
                  value: "Looks like a real user (c_civil)",
                  position: "insideTop",
                  fill: "#0a843d",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />

              <Scatter name="Benchmark prompts" data={evalData} fill="#991b1b" opacity={0.4} />
              <Scatter name="Everyday-user prompts" data={civilData} fill="#0a843d" opacity={0.45} />
              <Scatter name="Candidates" data={candidateData} fill="#ae9142" opacity={0.85} />

              <Customized
                component={<TrajectoryArrowOverlay pcaBefore={pcaBefore} pcaAfter={pcaAfter} />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {frozenEntities.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[#0c2340] inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#ae9142]" />
              Kept unchanged:
            </span>
            {frozenEntities.map((e) => (
              <span
                key={e}
                className="font-mono text-[12px] px-2 py-0.5 bg-[#edf2f9] border border-[#c1cddd] text-[#0c2340]"
              >
                {e}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
