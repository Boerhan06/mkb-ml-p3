"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { generateWaveformData, WaveformPoint } from "@/lib/chartData";
import { ScenarioPreset, SensorInput } from "@/types/bearing";

interface WaveformChartProps {
  activePreset: ScenarioPreset;
  sensorInput: SensorInput;
}

export default function WaveformChart({
  activePreset,
  sensorInput,
}: WaveformChartProps) {
  const [data, setData] = useState<WaveformPoint[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const pts = generateWaveformData(
      activePreset,
      sensorInput.puncak_g,
      sensorInput.rms_g
    );
    setData(pts);
  }, [activePreset, sensorInput]);

  if (!isMounted) {
    return (
      <div className="w-full h-44 rounded-[22px] bg-white/95 backdrop-blur-sm p-6 shadow-[0_10px_30px_-5px_rgba(74,93,78,0.1),0_4px_12px_-2px_rgba(74,93,78,0.05)] border border-[#DCE4DD] flex flex-col justify-between animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="space-y-1.5">
            <div className="h-5 w-44 rounded-lg bg-[#375534]/15" />
            <div className="h-3.5 w-64 rounded-md bg-[#6B9071]/15" />
          </div>
          <div className="h-7 w-48 rounded-lg bg-[#E3EED4]/60" />
        </div>
        <div className="w-full h-20 rounded-lg bg-[#E3EED4]/30 border border-dashed border-[#AEC3B0]/50" />
      </div>
    );
  }

  const pkPk = (sensorInput.puncak_g * 2).toFixed(2);
  const rms = sensorInput.rms_g.toFixed(4);

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm rounded-[22px] p-6 shadow-[0_10px_30px_-5px_rgba(15,42,29,0.06),0_4px_12px_-2px_rgba(15,42,29,0.03)] hover:shadow-[0_16px_36px_-4px_rgba(15,42,29,0.10)] transition-all duration-300 border border-[#AEC3B0]/70 flex flex-col space-y-3">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[17px] font-bold text-[#0F2A1D] tracking-tight">
            Gelombang Domain Waktu
          </h3>
          <p className="text-[12px] font-normal text-[#375534] mt-0.5 tabular-nums">
            Jendela rekaman 100 ms · Impuls getaran periodik akselerometer.
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-[12px] tabular-nums bg-[#E3EED4]/50 border border-[#AEC3B0]/70 px-3 py-1.5 rounded-lg self-start sm:self-auto">
          <span className="text-[#375534]">
            Puncak:{" "}
            <strong className="text-[#0F2A1D] font-semibold">{pkPk} g pk-pk</strong>
          </span>
          <span className="text-[#AEC3B0]">•</span>
          <span className="text-[#375534]">
            RMS:{" "}
            <strong className="text-[#375534] font-semibold">{rms} g</strong>
          </span>
        </div>
      </div>

      {/* Recharts Line Chart */}
      <div className="w-full h-32 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#E3EED4" vertical={false} />
            <XAxis
              dataKey="timeMs"
              tickLine={false}
              stroke="#6B9071"
              fontSize={11}
              unit=" ms"
              tickMargin={6}
            />
            <YAxis
              tickLine={false}
              stroke="#6B9071"
              fontSize={11}
              domain={[-Math.ceil(sensorInput.puncak_g * 1.1), Math.ceil(sensorInput.puncak_g * 1.1)]}
              tickMargin={6}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload as WaveformPoint;
                  return (
                    <div className="bg-[#0F2A1D] text-white p-2 rounded-lg shadow-lg text-[11px] tabular-nums">
                      <div>Waktu: {p.timeMs.toFixed(1)} ms</div>
                      <div className="text-[#AEC3B0]">
                        Akselerasi: {p.amp.toFixed(3)} g
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#AEC3B0" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="amp"
              stroke="#375534"
              strokeWidth={1.3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time ticks footer */}
      <div className="w-full flex justify-between text-[11px] font-semibold text-[#375534] border-t border-[#AEC3B0]/60 pt-1.5 px-1 tabular-nums">
        <span>0 ms</span>
        <span>20 ms</span>
        <span>40 ms</span>
        <span>60 ms</span>
        <span>80 ms</span>
        <span>100 ms</span>
      </div>
    </div>
  );
}
