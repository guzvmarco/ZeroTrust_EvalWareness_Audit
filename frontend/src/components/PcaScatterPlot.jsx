import React, { useState } from "react";
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
import { Compass, Info, CheckCircle2, AlertTriangle, Lock } from "lucide-react";

/**
 * Custom SVG layer inside Recharts to draw the vector trajectory arrow from x (formal) -> x' (camouflaged)
 * and centroid labels in crisp institutional styling.
 */
function TrajectoryArrowOverlay(props) {
  const { xAxisMap, yAxisMap, pcaBefore, pcaAfter, cEvalCentroid, cCivilCentroid } = props;
  if (!xAxisMap || !yAxisMap || !pcaBefore || !pcaAfter) return null;

  const xAxis = Object.values(xAxisMap)[0];
  const yAxis = Object.values(yAxisMap)[0];
  if (!xAxis?.scale || !yAxis?.scale) return null;

  const x1 = xAxis.scale(pcaBefore[0]);
  const y1 = yAxis.scale(pcaBefore[1]);
  const x2 = xAxis.scale(pcaAfter[0]);
  const y2 = yAxis.scale(pcaAfter[1]);

  const evalX = cEvalCentroid ? xAxis.scale(cEvalCentroid[0]) : null;
  const evalY = cEvalCentroid ? yAxis.scale(cEvalCentroid[1]) : null;
  const civilX = cCivilCentroid ? xAxis.scale(cCivilCentroid[0]) : null;
  const civilY = cCivilCentroid ? yAxis.scale(cCivilCentroid[1]) : null;

  if ([x1, y1, x2, y2].some((v) => typeof v !== "number" || Number.isNaN(v))) {
    return null;
  }

  return (
    <g>
      <defs>
        <marker
          id="nd-green-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <path d="M 0 1 L 7 4 L 0 7 z" fill="#0a843d" />
        </marker>
      </defs>

      {/* Centroid Crosshairs */}
      {evalX !== null && evalY !== null && (
        <g>
          <circle
            cx={evalX}
            cy={evalY}
            r={12}
            fill="none"
            stroke="#991b1b"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
          <text
            x={evalX}
            y={evalY - 16}
            textAnchor="middle"
            fill="#991b1b"
            fontSize="10"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            c_eval
          </text>
        </g>
      )}

      {civilX !== null && civilY !== null && (
        <g>
          <circle
            cx={civilX}
            cy={civilY}
            r={12}
            fill="none"
            stroke="#0a843d"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
          <text
            x={civilX}
            y={civilY - 16}
            textAnchor="middle"
            fill="#0a843d"
            fontSize="10"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            c_civil
          </text>
        </g>
      )}

      {/* Trajectory Vector Line x -> x' */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#0a843d"
        strokeWidth="2.2"
        strokeDasharray="5 3"
        markerEnd="url(#nd-green-arrowhead)"
      />

      {/* Formal Prompt x Callout */}
      <circle cx={x1} cy={y1} r={6} fill="#991b1b" stroke="#ffffff" strokeWidth="1.5" />
      <text
        x={x1 - 8}
        y={y1 + 15}
        textAnchor="end"
        fill="#991b1b"
        fontSize="10"
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
      >
        x (Formal)
      </text>

      {/* Camouflaged Winner x' Callout */}
      <circle cx={x2} cy={y2} r={7} fill="#0a843d" stroke="#ffffff" strokeWidth="2" />
      <text
        x={x2 + 9}
        y={y2 - 8}
        textAnchor="start"
        fill="#0a843d"
        fontSize="11"
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
      >
        {"x' (Canary)"}
      </text>
    </g>
  );
}

function CustomScatterTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  return (
    <div className="bg-[#ffffff] border border-[#0c2340] px-2.5 py-2 text-xs max-w-xs">
      <div className="font-mono font-bold text-[#0c2340] border-b border-[#c1cddd] pb-1 mb-1 flex items-center justify-between gap-3">
        <span>{pt.label || pt.group}</span>
        <span className="text-[#8c7535]">
          [{pt.x?.toFixed(2)}, {pt.y?.toFixed(2)}]
        </span>
      </div>
      {typeof pt.cosine === "number" && (
        <div className="font-mono text-[11px] text-[#0a843d] font-semibold mb-1">
          cos(e_x&apos;, e_x) = {pt.cosine.toFixed(3)}
        </div>
      )}
      {pt.text && <div className="text-[11px] text-[#0c2340] leading-snug">{pt.text}</div>}
    </div>
  );
}

export default function PcaScatterPlot({
  evalPoints = [],
  civilPoints = [],
  cEvalCentroid = [-2.1, 0.25],
  cCivilCentroid = [2.05, 0.2],
  camouflageResult,
  frozenEntities = [],
  isCamouflaging = false,
}) {
  const [showTooltipInfo, setShowTooltipInfo] = useState(false);

  const evalData = evalPoints.map((pt, idx) => ({
    x: pt[0],
    y: pt[1],
    group: "c_eval Benchmark Cluster",
    label: `Eval Reference #${idx + 1}`,
  }));

  const civilData = civilPoints.map((pt, idx) => ({
    x: pt[0],
    y: pt[1],
    group: "c_civil Organic Cluster",
    label: `Civil Reference #${idx + 1}`,
  }));

  const candidateData = (camouflageResult?.candidates || []).map((c) => ({
    x: c.coords_2d[0],
    y: c.coords_2d[1],
    group: "Camouflage Candidate",
    label: c.label,
    cosine: c.cosine_similarity,
    text: c.prompt,
  }));

  const pcaBefore = camouflageResult?.pca_before || [-1.85, -0.35];
  const pcaAfter = camouflageResult?.pca_after || [1.62, 0.42];
  const cosine = camouflageResult?.cosine_similarity ?? 0.842;
  const meetsThreshold = camouflageResult?.meets_threshold ?? cosine >= 0.78;

  const formalPointData = [
    {
      x: pcaBefore[0],
      y: pcaBefore[1],
      label: "x: Formal Auditor Prompt",
      text: camouflageResult?.original_prompt,
    },
  ];

  const winnerPointData = [
    {
      x: pcaAfter[0],
      y: pcaAfter[1],
      label: "x': Selected Canary Prompt",
      cosine,
      text: camouflageResult?.camouflaged_prompt,
    },
  ];

  return (
    <div className="bg-[#ffffff] border border-[#c1cddd] flex flex-col justify-between">
      {/* Solid ND Blue Section Header */}
      <div className="bg-[#0c2340] text-white px-3.5 py-2 border-b-2 border-[#ae9142] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-[#ae9142] text-[#0c2340]">
            STEP 02
          </span>
          <Compass className="w-4 h-4 text-[#d39f10]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            2D PCA Semantic Camouflage (all-MiniLM-L6-v2)
          </h2>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Cosine Similarity Badge */}
          <span
            className={`font-mono text-[11px] font-bold px-2 py-0.5 border flex items-center gap-1 ${
              meetsThreshold
                ? "bg-[#b3dac5] text-[#0a843d] border-[#0a843d]"
                : "bg-[#efe9d9] text-[#8c7535] border-[#ae9142]"
            }`}
          >
            {meetsThreshold ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0a843d]" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-[#8c7535]" />
            )}
            cos(e_x&apos;, e_x) = {cosine.toFixed(3)} {meetsThreshold ? "≥ 0.78" : "< 0.78"}
          </span>

          <button
            type="button"
            onClick={() => setShowTooltipInfo((prev) => !prev)}
            className="text-[#d39f10] hover:text-white p-0.5"
            title="What is 2D PCA Semantic Camouflage?"
          >
            <Info className="w-4 h-4" />
          </button>

          {showTooltipInfo && (
            <div className="absolute right-0 top-7 z-30 w-80 bg-[#0c2340] text-[#f8f4ec] border border-[#ae9142] p-3 text-xs leading-relaxed">
              <div className="font-bold text-[#d39f10] mb-1">
                Plain-Language Guide: Semantic Camouflage
              </div>
              Frontier LLMs recognize formal benchmark phrasing (&ldquo;c_eval&rdquo; red zone)
              and alter behavior. We re-frame the prompt into organic developer phrasing
              (&ldquo;c_civil&rdquo; green zone) while freezing technical entities and keeping
              cosine similarity &ge; 0.78 so the underlying test intent stays identical.
            </div>
          )}
        </div>
      </div>

      {/* Recharts 2D Scatter Canvas */}
      <div className="p-3">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5 px-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[#991b1b] font-semibold">
              <span className="w-2.5 h-2.5 inline-block bg-[#991b1b]" />
              c_eval (Benchmark Zone)
            </span>
            <span className="inline-flex items-center gap-1 text-[#0a843d] font-semibold">
              <span className="w-2.5 h-2.5 inline-block bg-[#0a843d]" />
              c_civil (Organic Target)
            </span>
            <span className="inline-flex items-center gap-1 text-[#8c7535]">
              <span className="w-2 h-2 inline-block bg-[#ae9142]" />
              Candidates
            </span>
          </div>
          {isCamouflaging && (
            <span className="text-[#8c7535] font-bold animate-pulse">
              Computing 384D embeddings...
            </span>
          )}
        </div>

        <div className="h-52 w-full border border-[#c1cddd] bg-[#ffffff]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 14, right: 18, bottom: 10, left: -12 }}>
              <CartesianGrid stroke="#e1e8f2" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="PC1"
                domain={[-3.6, 3.6]}
                tick={{ fontSize: 10, fill: "#0c2340", fontFamily: "JetBrains Mono" }}
                tickLine={{ stroke: "#c1cddd" }}
                axisLine={{ stroke: "#c1cddd" }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="PC2"
                domain={[-2.2, 2.2]}
                tick={{ fontSize: 10, fill: "#0c2340", fontFamily: "JetBrains Mono" }}
                tickLine={{ stroke: "#c1cddd" }}
                axisLine={{ stroke: "#c1cddd" }}
              />
              <Tooltip content={<CustomScatterTooltip />} />

              {/* Left Red Benchmark Zone (c_eval) */}
              <ReferenceArea
                x1={-3.5}
                x2={-0.35}
                y1={-2.05}
                y2={2.05}
                fill="#fee2e2"
                fillOpacity={0.35}
                stroke="#fecaca"
              />

              {/* Right Notre Dame Irish Green Civil Zone (c_civil) */}
              <ReferenceArea
                x1={0.35}
                x2={3.5}
                y1={-2.05}
                y2={2.05}
                fill="#b3dac5"
                fillOpacity={0.45}
                stroke="#0a843d"
                strokeOpacity={0.35}
              />

              <Scatter name="c_eval Cluster" data={evalData} fill="#991b1b" opacity={0.45} />
              <Scatter name="c_civil Cluster" data={civilData} fill="#0a843d" opacity={0.5} />
              <Scatter name="Candidates" data={candidateData} fill="#ae9142" opacity={0.85} />
              <Scatter name="Formal Prompt (x)" data={formalPointData} fill="#991b1b" />
              <Scatter name="Camouflaged Winner (x')" data={winnerPointData} fill="#0a843d" />

              <Customized
                component={
                  <TrajectoryArrowOverlay
                    pcaBefore={pcaBefore}
                    pcaAfter={pcaAfter}
                    cEvalCentroid={cEvalCentroid}
                    cCivilCentroid={cCivilCentroid}
                  />
                }
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Summary: Winning Camouflaged Prompt & Frozen Entities */}
      <div className="px-3.5 py-2.5 bg-[#edf2f9] border-t border-[#c1cddd] text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-[11px] font-bold uppercase text-[#0c2340] flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#ae9142]" />
            Frozen Payload Entities:
          </span>
          <div className="flex flex-wrap gap-1">
            {frozenEntities.length > 0 ? (
              frozenEntities.map((entity) => (
                <span
                  key={entity}
                  className="font-mono text-[10px] px-1.5 py-0.5 bg-[#ffffff] border border-[#c1cddd] text-[#0c2340] font-semibold"
                >
                  {entity}
                </span>
              ))
            ) : (
              <span className="font-mono text-[10px] text-[#8c7535]">
                Dynamic semantic invariance preserving technical tokens
              </span>
            )}
          </div>
        </div>
        <div className="bg-[#ffffff] border border-[#c1cddd] px-2.5 py-1.5 text-[11px] text-[#0c2340]">
          <span className="font-mono font-bold text-[#0a843d] mr-1.5">
            Selected Canary Prompt (x&apos;):
          </span>
          <span className="italic">
            {camouflageResult?.camouflaged_prompt ||
              "Select a test case or run camouflage to project x -> x'."}
          </span>
        </div>
      </div>
    </div>
  );
}
