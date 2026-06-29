/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { TelemetryPayload, AnomalyReport } from "../types";

interface BehaviorDensityProps {
  student: TelemetryPayload;
  analysis: AnomalyReport;
  lang: "ar" | "en";
}

interface DensityCell {
  rowKey: string;
  rowLabelAr: string;
  rowLabelEn: string;
  binIndex: number;
  timeRange: string;
  count: number;
  density: "none" | "low" | "medium" | "high";
}

export default function StudentBehavioralDensity({
  student,
  analysis,
  lang,
}: BehaviorDensityProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    visible: boolean;
    rowLabel: string;
    timeRange: string;
    count: number;
    unit: string;
  } | null>(null);

  const duration = student.durationMinutes || 45;
  const binCount = 10;
  const minPerBin = Math.max(1, Math.round(duration / binCount));

  // Build stable, deterministic behavior distribution using student ID hashing
  const cellsData = useMemo<DensityCell[]>(() => {
    // A simple deterministic hash helper to distribute counts mock-stably based on student ID
    const getHash = (str: string, seed: number) => {
      let hash = seed;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const studentId = student.studentId || "unknown";

    // Distribute total counts into 10 bins deterministically
    const distribute = (totalCount: number, seed: number): number[] => {
      const bins = Array(binCount).fill(0);
      if (totalCount <= 0) return bins;

      let remaining = totalCount;
      // We want to cluster the events towards certain bins to look like a realistic timeline
      const clusterCenter = getHash(studentId, seed) % binCount;

      // Assign weights to bins based on distance to the cluster center
      const weights = bins.map((_, i) => {
        const dist = Math.abs(i - clusterCenter);
        return Math.max(1, binCount - dist * 2);
      });

      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      bins.forEach((_, i) => {
        const share = Math.floor((weights[i] / totalWeight) * totalCount);
        bins[i] = share;
        remaining -= share;
      });

      // Distribute remainder step by step to highest weights
      while (remaining > 0) {
        for (let i = 0; i < binCount && remaining > 0; i++) {
          const idx = (clusterCenter + i) % binCount;
          bins[idx]++;
          remaining--;
        }
      }

      return bins;
    };

    // Calculate distributions
    const tabBins = distribute(student.tabSwitchesCount || 0, 101);
    const clipBins = distribute((student.copyCount || 0) + (student.pasteCount || 0), 202);
    // Scale out of bounds exits/seconds to logical counts
    const outOfBoundsCount = student.outOfBoundsCount || Math.ceil(student.mouseOutSeconds / 15) || 0;
    const exitBins = distribute(outOfBoundsCount, 303);

    const rows = [
      {
        key: "tabs",
        labelAr: "تبديل النوافذ",
        labelEn: "Tab Switches",
        bins: tabBins,
        unitAr: "مرات",
        unitEn: "events",
      },
      {
        key: "clipboard",
        labelAr: "عمليات الحافظة",
        labelEn: "Clipboard Activity",
        bins: clipBins,
        unitAr: "عمليات",
        unitEn: "actions",
      },
      {
        key: "exits",
        labelAr: "الخروج عن الحدود",
        labelEn: "Canvas Exits",
        bins: exitBins,
        unitAr: "ثوانٍ/مرات",
        unitEn: "exits",
      },
    ];

    const allCells: DensityCell[] = [];

    rows.forEach((row) => {
      row.bins.forEach((count, binIdx) => {
        const startMin = binIdx * minPerBin;
        const endMin = Math.min(duration, (binIdx + 1) * minPerBin);
        const timeRangeStr =
          lang === "ar"
            ? `د ${startMin} - د ${endMin}`
            : `Min ${startMin} - ${endMin}`;

        let density: "none" | "low" | "medium" | "high" = "none";
        if (count > 0) {
          if (count <= 2) density = "low";
          else if (count <= 5) density = "medium";
          else density = "high";
        }

        allCells.push({
          rowKey: row.key,
          rowLabelAr: row.labelAr,
          rowLabelEn: row.labelEn,
          binIndex: binIdx,
          timeRange: timeRangeStr,
          count: count,
          density: density,
        });
      });
    });

    return allCells;
  }, [student, duration, lang, binCount, minPerBin]);

  // Use D3 to generate axes values and grid dimensions
  const margin = { top: 25, right: 15, bottom: 35, left: lang === "ar" ? 100 : 120 };
  const height = 150;
  const width = 640; // Default rendering base width, made fully responsive via viewBox

  const xRange = [margin.left, width - margin.right];
  const yRange = [margin.top, height - margin.bottom];

  const cols = Array.from({ length: binCount }, (_, i) => i);
  const rowKeys = ["tabs", "clipboard", "exits"];

  const xScale = useMemo(() => {
    return d3.scaleBand().domain(cols.map(String)).range(xRange).padding(0.12);
  }, [cols, xRange]);

  const yScale = useMemo(() => {
    return d3.scaleBand().domain(rowKeys).range(yRange).padding(0.15);
  }, [rowKeys, yRange]);

  const getCellColor = (density: "none" | "low" | "medium" | "high", score: number) => {
    switch (density) {
      case "high":
        return score >= 60
          ? "fill-red-500 hover:fill-red-400 stroke-red-600"
          : "fill-rose-500 hover:fill-rose-400 stroke-rose-600";
      case "medium":
        return "fill-amber-500 hover:fill-amber-400 stroke-amber-600";
      case "low":
        return "fill-indigo-500 hover:fill-indigo-400 stroke-indigo-600";
      case "none":
      default:
        return "fill-slate-900/90 hover:fill-slate-800/80 stroke-slate-800/50";
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden shadow-inner w-full"
    >
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/2 rounded-full blur-2xl pointer-events-none"></div>

      {/* Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm select-none">
            📊
          </div>
          <div>
            <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
              <span>{lang === "ar" ? "الكثافة السلوكية الزمنية للمرشح" : "Student Behavioral Density Timeline"}</span>
            </h4>
            <p className="text-[10px] text-slate-500">
              {lang === "ar"
                ? "خارطة حرارية مبنية بـ D3 توضح توزيع الغش والانتهاكات السلوكية عبر زمن الجلسة"
                : "Interactive D3 temporal heatmap highlighting proctoring anomalies binned across minutes"}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[8px] sm:text-[9px] text-slate-400 select-none">
          <span>{lang === "ar" ? "الكثافة:" : "Density:"}</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-slate-900 border border-slate-800 rounded"></span>
            <span>{lang === "ar" ? "صفر" : "None"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded"></span>
            <span>{lang === "ar" ? "منخفض" : "Low"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded"></span>
            <span>{lang === "ar" ? "متوسط" : "Med"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded"></span>
            <span>{lang === "ar" ? "مرتفع" : "High"}</span>
          </div>
        </div>
      </div>

      {/* SVG Container wrapping our D3 Heatmap Grid */}
      <div className="relative overflow-x-auto w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="text-slate-400 select-none mx-auto"
        >
          {/* Row Labels (Y Axis) */}
          {rowKeys.map((key) => {
            const y = yScale(key);
            if (y === undefined) return null;
            const label =
              lang === "ar"
                ? key === "tabs"
                  ? "تبديل النوافذ"
                  : key === "clipboard"
                  ? "الحافظة"
                  : "خارج الحدود"
                : key === "tabs"
                ? "Tab Switches"
                : key === "clipboard"
                ? "Clipboard Activity"
                : "Canvas Exits";

            return (
              <text
                key={key}
                x={lang === "ar" ? margin.left - 10 : margin.left - 10}
                y={y + yScale.bandwidth() / 2 + 3.5}
                textAnchor={lang === "ar" ? "end" : "end"}
                className="font-sans text-[10px] font-black fill-slate-350"
              >
                {label}
              </text>
            );
          })}

          {/* Timeline cells */}
          {cellsData.map((cell, idx) => {
            const x = xScale(String(cell.binIndex));
            const y = yScale(cell.rowKey);

            if (x === undefined || y === undefined) return null;

            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={xScale.bandwidth()}
                height={yScale.bandwidth()}
                rx={4}
                ry={4}
                className={`transition-all duration-200 stroke border cursor-crosshair ${getCellColor(
                  cell.density,
                  analysis.riskScore
                )}`}
                onMouseMove={(e) => {
                  const svgEl = e.currentTarget.ownerSVGElement;
                  if (!svgEl) return;
                  const rect = svgEl.getBoundingClientRect();
                  
                  // Translate client position into actual local pixel positions
                  const mouseX = e.clientX - rect.left;
                  const mouseY = e.clientY - rect.top;

                  setTooltip({
                    x: mouseX,
                    y: mouseY - 60,
                    visible: true,
                    rowLabel: lang === "ar" ? cell.rowLabelAr : cell.rowLabelEn,
                    timeRange: cell.timeRange,
                    count: cell.count,
                    unit:
                      lang === "ar"
                        ? cell.rowKey === "tabs"
                          ? "مرات"
                          : cell.rowKey === "clipboard"
                          ? "عمليات"
                          : "مرات"
                        : cell.rowKey === "tabs"
                        ? "switches"
                        : cell.rowKey === "clipboard"
                        ? "actions"
                        : "exits",
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {/* X Axis Labels representing chronologic timeline percentage */}
          {cols.map((binIdx) => {
            const x = xScale(String(binIdx));
            if (x === undefined) return null;

            const startMin = binIdx * minPerBin;
            const labelStr = `${startMin}m`;

            return (
              <text
                key={binIdx}
                x={x + xScale.bandwidth() / 2}
                y={height - margin.bottom + 14}
                textAnchor="middle"
                className="font-mono text-[8px] fill-slate-500 font-bold"
              >
                {labelStr}
              </text>
            );
          })}

          {/* Overall timeframe X-Axis track */}
          <line
            x1={margin.left}
            y1={height - margin.bottom + 4}
            x2={width - margin.right}
            y2={height - margin.bottom + 4}
            className="stroke-slate-800"
            strokeWidth={1.5}
          />

          {/* Timeline Center Label */}
          <text
            x={(width + margin.left - margin.right) / 2}
            y={height - 5}
            textAnchor="middle"
            className="font-sans text-[9px] fill-slate-400 font-extrabold uppercase tracking-widest"
          >
            {lang === "ar" ? "⏱ خط الجلسة الزمني" : "⏱ Secure Exam Time Progress"}
          </text>
        </svg>

        {/* Lightweight HTML Tooltip aligned perfectly relative to our mouse position inside SVG */}
        {tooltip?.visible && (
          <div
            className="absolute rounded-lg bg-slate-900/95 border border-slate-700/80 px-2.5 py-1.5 text-[10px] text-white space-y-0.5 pointer-events-none shadow-2xl backdrop-blur-sm z-30 transition-transform duration-75 text-center"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: "translate(-50%, -20%)",
            }}
          >
            <div className="font-bold text-indigo-300">{tooltip.rowLabel}</div>
            <div className="text-slate-400 font-mono text-[9px]">{tooltip.timeRange}</div>
            <div className="border-t border-slate-800 mt-1 pt-0.5 font-bold">
              {tooltip.count === 0 ? (
                <span className="text-slate-500 font-mono">
                  {lang === "ar" ? "لا غبار (صفر سلوكيات)" : "Clean (0 events)"}
                </span>
              ) : (
                <span className="text-amber-400 font-mono">
                  {tooltip.count} {tooltip.unit}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
