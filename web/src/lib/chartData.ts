import { ScenarioPreset } from "@/types/bearing";

export interface SpectrumPoint {
  freq: number;
  amp: number;
  marker?: string;
  isPeak?: boolean;
}

export interface WaveformPoint {
  timeMs: number;
  amp: number;
}

export function generateSpectrumData(
  preset: ScenarioPreset,
  dominantHz: number,
  peakG: number
): SpectrumPoint[] {
  const points: SpectrumPoint[] = [];
  const steps = 120;
  const maxFreq = 2000;

  // Frekuensi cacat teoritis poros pabrik (~2961 RPM / ~49.35 Hz 1X)
  const ftf = 19.8;
  const oneX = 49.35;
  const bsf = 98.4;
  const bpfo = 116.0;
  const bpfi = 168.5;

  for (let i = 0; i <= steps; i++) {
    const freq = Math.round((i / steps) * maxFreq);
    // Base floor noise
    let base = 0.04 + Math.sin(freq * 0.05) * 0.02 + ((freq * 7) % 13) * 0.003;

    let marker: string | undefined = undefined;
    let isPeak = false;

    // Check proximity to known peaks
    if (Math.abs(freq - dominantHz) < 12) {
      base = peakG * 0.95;
      isPeak = true;
      marker = `${dominantHz.toFixed(1)} Hz`;
    } else if (Math.abs(freq - ftf) < 8) {
      base += 0.25;
      marker = "FTF";
    } else if (Math.abs(freq - oneX) < 10) {
      base += 0.45;
      marker = "1X";
    } else if (Math.abs(freq - bpfo) < 10) {
      base += preset === "Outer Race" ? peakG * 0.9 : 0.35;
      if (preset === "Outer Race") marker = "BPFO";
    } else if (Math.abs(freq - bpfi) < 10) {
      base += preset === "Inner Race" ? peakG * 0.9 : 0.3;
      if (preset === "Inner Race") marker = "BPFI";
    } else if (Math.abs(freq - bsf * 2) < 14) {
      base += preset === "Ball Fault" ? 0.65 : 0.15;
      if (preset === "Ball Fault") marker = "2X BSF";
    } else if (Math.abs(freq - bsf * 3) < 14) {
      base += preset === "Ball Fault" ? 0.45 : 0.1;
      if (preset === "Ball Fault") marker = "3X BSF";
    } else {
      // Small random harmonics
      base += ((freq % 100 === 0) ? 0.15 : 0.0) * Math.exp(-freq / 800);
    }

    if (preset === "Normal") {
      base = Math.min(base, 0.35);
    }

    points.push({
      freq,
      amp: Number(base.toFixed(3)),
      marker,
      isPeak,
    });
  }

  return points;
}

export interface TrendPoint {
  timeLabel: string;
  peakG: number;
  rmsG: number;
  isoZone: "A" | "B" | "C" | "D";
  event?: string;
}

export function generateTrendData(
  preset: ScenarioPreset,
  currentPeak: number,
  currentRms: number,
  timeRange: "24h" | "7d" | "30d" = "7d"
): TrendPoint[] {
  const points: TrendPoint[] = [];

  let count = 7;
  let labels: string[] = [];

  if (timeRange === "24h") {
    count = 12; // Tiap 2 jam
    labels = [
      "04:00", "06:00", "08:00", "10:00", "12:00", "14:00",
      "16:00", "18:00", "20:00", "22:00", "00:00", "Saat Ini"
    ];
  } else if (timeRange === "7d") {
    count = 7; // 7 hari terakhir
    labels = [
      "13 Nov", "14 Nov", "15 Nov", "16 Nov", "17 Nov", "18 Nov", "19 Nov (Kini)"
    ];
  } else {
    count = 10; // 30 hari
    labels = [
      "22 Okt", "25 Okt", "28 Okt", "31 Okt", "03 Nov",
      "06 Nov", "09 Nov", "12 Nov", "16 Nov", "19 Nov"
    ];
  }

  const isFault = preset !== "Normal";
  const baselinePeak = 0.38;
  const baselineRms = 0.14;

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1); // 0 to 1
    let peakVal: number;
    let rmsVal: number;
    let event: string | undefined = undefined;

    if (!isFault) {
      // Kondisi normal: fluktuasi stabil di bawah batas 0.6g
      const wobble = Math.sin(i * 1.3) * 0.05 + ((i % 3) * 0.02);
      peakVal = Math.max(0.25, Math.min(0.55, baselinePeak + wobble));
      rmsVal = Math.max(0.1, baselineRms + wobble * 0.4);
      if (i === Math.floor(count / 2)) {
        event = "Pelumasan Berkala";
      }
    } else {
      // Kondisi rusak: kurva eksponensial degradasi bantalan industri
      // Mulai dari baseline normal -> inisiasi spalling -> lonjakan kritis
      const expCurve = Math.pow(progress, 2.6); // pertumbuhan cepat di fase akhir
      peakVal = baselinePeak + (currentPeak - baselinePeak) * expCurve;
      rmsVal = baselineRms + (currentRms - baselineRms) * expCurve;

      // Noise realistis
      const noise = (Math.sin(i * 2.1) * 0.04) * (1 - progress * 0.5);
      peakVal = Math.max(baselinePeak, peakVal + noise);

      if (i === 0) {
        event = "Operasi Normal";
      } else if (progress > 0.45 && progress < 0.65) {
        event = "Inisiasi Cacat";
      } else if (i === count - 1) {
        event = "Ambang Kritis";
      }
    }

    // Pastikan titik terakhir sama persis dengan sensorInput saat ini
    if (i === count - 1) {
      peakVal = currentPeak;
      rmsVal = currentRms;
    }

    // Tentukan zona ISO 20816
    let isoZone: "A" | "B" | "C" | "D" = "A";
    if (peakVal >= 2.5) {
      isoZone = "D";
    } else if (peakVal >= 1.2) {
      isoZone = "C";
    } else if (peakVal >= 0.8) {
      isoZone = "B";
    }

    points.push({
      timeLabel: labels[i] || `T-${count - i}`,
      peakG: Number(peakVal.toFixed(2)),
      rmsG: Number(rmsVal.toFixed(3)),
      isoZone,
      event,
    });
  }

  return points;
}

export function generateWaveformData(
  preset: ScenarioPreset,
  peakG: number,
  rmsG: number
): WaveformPoint[] {
  const points: WaveformPoint[] = [];
  const totalMs = 100;
  const samples = 150;

  // Periodisitas impuls getaran (ms)
  let period = 10.16; // 1/BSF ~ 10.16 ms
  if (preset === "Outer Race") period = 8.62;
  if (preset === "Inner Race") period = 5.93;
  if (preset === "Normal") period = 20.26;

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * totalMs;
    const timeInPeriod = t % period;

    let amp = Math.sin(t * 0.4) * (rmsG * 0.6);

    if (preset !== "Normal") {
      // Ring-down decaying transient shock
      if (timeInPeriod < 2.5) {
        const decay = Math.exp(-timeInPeriod * 1.8);
        const osc = Math.sin(timeInPeriod * 24.0);
        amp += peakG * decay * osc;
      }
    } else {
      amp += (Math.sin(t * 1.2) * 0.15);
    }

    // Add gentle industrial carrier
    amp += (Math.sin(t * 3.5) * 0.05);

    points.push({
      timeMs: Number(t.toFixed(1)),
      amp: Number(amp.toFixed(3)),
    });
  }

  return points;
}


