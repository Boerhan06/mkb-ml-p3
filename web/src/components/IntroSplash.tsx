"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, ArrowRight } from "lucide-react";

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [stage, setStage] = useState<"card" | "eyes" | "smile" | "wink" | "exit">("card");
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Inisialisasi AudioContext dengan aman untuk browser
  const getAudioContext = () => {
    if (typeof window === "undefined" || isMuted) return null;
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  // Sound 1: Soft Pop / Bubble saat kartu muncul
  const playPopSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  };

  // Sound 2: Smile Chime (akor marimba lembut 2-nada)
  const playSmileSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25]; // C5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime + idx * 0.07;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      });
    } catch {}
  };

  // Sound 3: Cute Wink Sound (twinkle / sparkle ping C6 - G6)
  const playWinkSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const freqs = [1046.5, 1318.5, 1567.98]; // C6, E6, G6
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime + i * 0.045;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch {}
  };

  // Sound 4: Smooth Whoosh / Transition ke dashboard
  const playWhooshSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {}
  };

  // Sequence Timer Animasi
  useEffect(() => {
    // 0.3s: Card pop in
    playPopSound();

    // 0.8s: Eyes appear
    const tEyes = setTimeout(() => {
      setStage("eyes");
    }, 700);

    // 1.4s: Smile appears
    const tSmile = setTimeout(() => {
      setStage("smile");
      playSmileSound();
    }, 1300);

    // 2.0s: Right eye winks
    const tWink = setTimeout(() => {
      setStage("wink");
      playWinkSound();
    }, 2000);

    // 3.1s: Start exit transition
    const tExit = setTimeout(() => {
      setStage("exit");
      playWhooshSound();
    }, 3100);

    // 3.6s: Trigger onComplete to reveal dashboard
    const tComplete = setTimeout(() => {
      onComplete();
    }, 3600);

    return () => {
      clearTimeout(tEyes);
      clearTimeout(tSmile);
      clearTimeout(tWink);
      clearTimeout(tExit);
      clearTimeout(tComplete);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch {}
      }
      audioCtxRef.current = null;
    };
  }, []);

  const canSkipRef = useRef<boolean>(false);

  // Grace period 500ms agar klik dari tombol pemicu tidak langsung men-skip intro secara tidak sengaja
  useEffect(() => {
    const timer = setTimeout(() => {
      canSkipRef.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut: Escape atau Space untuk langsung skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSkip = (force: boolean = false) => {
    if (!force && !canSkipRef.current) return;
    playWhooshSound();
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: stage === "exit" ? 0 : 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#4E5A4C] select-none overflow-hidden cursor-pointer"
      onClick={() => handleSkip()}
      title="Klik di mana saja untuk melewati intro"
    >
      {/* Top Controls: Sound Toggle & Skip Button */}
      <div
        className="absolute top-5 inset-x-5 flex items-center justify-between z-20 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Mute/Unmute */}
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-[12px] font-medium backdrop-blur-md transition-colors cursor-pointer"
          title={isMuted ? "Aktifkan Efek Suara" : "Bisukan Suara"}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Suara Mati</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Sound On</span>
            </>
          )}
        </button>

        {/* Tombol Lewati Intro */}
        <button
          type="button"
          onClick={() => handleSkip(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[12px] font-semibold backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-sm"
        >
          <span>Lewati</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ripple Wave Gelombang Sensor Getaran di Balik Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.8, 1.35, 1.7], opacity: [0.35, 0.15, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          className="w-72 h-72 sm:w-84 sm:h-84 rounded-full border border-white/25 absolute"
        />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.8, 1.45, 1.9], opacity: [0.25, 0.1, 0] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            delay: 0.6,
            ease: "easeOut",
          }}
          className="w-72 h-72 sm:w-84 sm:h-84 rounded-full border border-white/15 absolute"
        />
      </div>

      {/* Kartu Maskot Utama (Animated Squircle) */}
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 18,
            mass: 0.8,
          }}
          className="relative w-56 h-56 sm:w-68 sm:h-68 rounded-[52px] sm:rounded-[64px] bg-white shadow-[0_24px_64px_-12px_rgba(15,42,29,0.35),0_8px_24px_-4px_rgba(15,42,29,0.2)] flex items-center justify-center overflow-hidden"
        >
          {/* Face Features SVG Canvas (400x400 Coordinate Space) */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full p-4 sm:p-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 1. Mata Kiri (Selalu Bulat Terbuka) */}
            <motion.circle
              cx="95"
              cy="145"
              r="33"
              fill="#4E5A4C"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                stage === "card"
                  ? { scale: 0, opacity: 0 }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            />

            {/* 2. Mata Kanan (Animasi Morph dari Bulat ke Kedipan/Wink) */}
            {stage === "wink" ? (
              <motion.path
                key="wink-eye"
                d="M 366,102 L 362,99 L 339,100 L 318,105 L 301,113 L 289,122 L 277,135 L 268,150 L 270,158 L 277,161 L 290,158 L 311,159 L 329,163 L 357,174 L 363,173 L 367,169 L 367,162 L 359,156 L 334,147 L 295,140 L 306,130 L 321,122 L 340,117 L 363,115 L 367,111 Z"
                fill="#4E5A4C"
                initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 16,
                  mass: 0.6,
                }}
              />
            ) : (
              <motion.circle
                key="open-eye"
                cx="312"
                cy="145"
                r="33"
                fill="#4E5A4C"
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  stage === "card"
                    ? { scale: 0, opacity: 0 }
                    : { scale: 1, opacity: 1 }
                }
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
              />
            )}

            {/* 3. Mulut (Senyum Melengkung Ceria) */}
            <motion.path
              d="M 153,234 L 153,260 L 159,276 L 168,287 L 185,297 L 207,299 L 219,296 L 233,287 L 245,270 L 249,254 L 249,237 L 244,230 L 237,230 L 232,235 L 232,255 L 226,270 L 217,278 L 207,282 L 190,281 L 179,274 L 174,268 L 170,259 L 168,233 L 164,230 L 157,230 Z"
              fill="#4E5A4C"
              initial={{ scaleY: 0, opacity: 0, originY: "264px" }}
              animate={
                stage === "card" || stage === "eyes"
                  ? { scaleY: 0, opacity: 0 }
                  : { scaleY: 1, opacity: 1 }
              }
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 18,
              }}
            />
          </svg>
        </motion.div>

        {/* Teks Brand VibraCheck Fade Up */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          className="mt-7 text-center"
        >
          <h1 className="text-[26px] sm:text-[30px] font-bold text-white tracking-tight">
            VibraCheck
          </h1>
          <p className="text-[13px] text-[#E3EED4]/80 font-medium mt-1 tracking-wide">
            Industrial Bearing Diagnostic Hub
          </p>
        </motion.div>
      </div>

      {/* Petunjuk Interaksi Bawah */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="absolute bottom-6 text-center text-[11px] text-white/70"
      >
        Klik di mana saja atau tekan Space / Esc untuk lanjut
      </motion.div>
    </motion.div>
  );
}
