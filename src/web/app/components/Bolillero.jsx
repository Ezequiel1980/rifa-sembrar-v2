"use client";

/**
 * Bolillero.jsx — Animated Lottery Ball Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Three-phase animation:
 *   idle    → Beautiful 3D sphere, breathing animation, click to start
 *   mixing  → Bolillero cage with small colored balls tumbling inside
 *   zooming → Winner ball shoots out from cage toward viewer (zoom)
 *   result  → Large bingo ball with number on white stripe band + confetti
 *
 * Props:
 *   soldNumbers  : number[]       All paid ticket numbers
 *   onDraw       : () => number   Returns the winner (called on start)
 *   onResult     : (n) => void    Called when animation reaches result
 *   darkMode     : boolean
 *   totalNumbers : number         For zero-padding (100 → "047")
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const padNum = (n, total) =>
  String(n).padStart(String(total).length, "0");

/** Classic bingo ball palette (6 colors, cycling by ball index) */
const BALL_COLORS = [
  {
    sphere: "radial-gradient(circle at 32% 28%, #FCA5A5, #EF4444 52%, #7F1D1D)",
    glow: "rgba(239,68,68,0.55)",
  },
  {
    sphere: "radial-gradient(circle at 32% 28%, #93C5FD, #3B82F6 52%, #1E3A8A)",
    glow: "rgba(59,130,246,0.55)",
  },
  {
    sphere: "radial-gradient(circle at 32% 28%, #86EFAC, #22C55E 52%, #14532D)",
    glow: "rgba(34,197,94,0.55)",
  },
  {
    sphere: "radial-gradient(circle at 32% 28%, #C4B5FD, #8B5CF6 52%, #2E1065)",
    glow: "rgba(139,92,246,0.55)",
  },
  {
    sphere: "radial-gradient(circle at 32% 28%, #FDBA74, #F97316 52%, #431407)",
    glow: "rgba(249,115,22,0.55)",
  },
  {
    sphere: "radial-gradient(circle at 32% 28%, #FDE68A, #F59E0B 52%, #78350F)",
    glow: "rgba(245,158,11,0.55)",
  },
];

/**
 * 8 distinct orbital displacement paths (px from cage center).
 * Each is a closed loop so repeat: "loop" is seamless.
 * Values capped at ±80px so balls stay inside a 260px cage.
 */
const ORBIT_PATHS = [
  { x: [0, 62, 42, -18, -72, -52, 18, 0],  y: [0,  18, 76, 80,  40, -28, -58, 0] },
  { x: [0, -52, -68, -28, 16, 58, 48, 0],   y: [0,  44,  -6, -62, -72, -28, 18, 0] },
  { x: [0, 28, 72, 58,  6, -44, -58, 0],    y: [0, -58, -34, 20,  62,  52,  4,  0] },
  { x: [0, -28, -62, -52,  2,  38, 58, 0],  y: [0, -42,  6, 58,  72,  44, -14, 0] },
  { x: [0, 54, 38, -10, -62, -56,  -4, 0],  y: [0, -18, -68, -62, -18, 28,  62, 0] },
  { x: [0, -44, -20, 28,  62,  54,  10, 0], y: [0,  62,  68,  40, -10, -58, -62, 0] },
  { x: [0, 18, 58,  52,   4, -38, -62, 0],  y: [0,  54,  14, -40, -68, -44, 8,  0] },
  { x: [0, -58, -48,  4,  48,  62,  24, 0], y: [0, -14, -62, -68, -38,  18, 56, 0] },
];

// ─── Sub-component: Idle Sphere ───────────────────────────────────────────────

function IdleSphere({ canDraw, onClick, darkMode }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.038, 1] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      onClick={onClick}
      style={{
        width: 256,
        height: 256,
        borderRadius: "50%",
        background: darkMode
          ? "radial-gradient(circle at 30% 25%, #475569, #1E293B 58%, #0F172A)"
          : "radial-gradient(circle at 30% 25%, #E2E8F0, #94A3B8 58%, #475569)",
        boxShadow: darkMode
          ? "inset -24px -24px 52px rgba(0,0,0,0.5), inset 11px 11px 24px rgba(255,255,255,0.07), 0 18px 45px rgba(0,0,0,0.45)"
          : "inset -24px -24px 52px rgba(0,0,0,0.18), inset 11px 11px 24px rgba(255,255,255,0.35), 0 18px 45px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: canDraw ? "pointer" : "default",
        position: "relative",
        transition: "box-shadow 0.3s",
      }}
      whileHover={canDraw ? { scale: 1.05 } : {}}
      whileTap={canDraw ? { scale: 0.96 } : {}}
    >
      {/* Primary specular (top-left bright spot) */}
      <div
        style={{
          position: "absolute",
          top: "11%",
          left: "15%",
          width: "44%",
          height: "32%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
          filter: "blur(5px)",
          transform: "rotate(-18deg)",
          pointerEvents: "none",
        }}
      />
      {/* Secondary rim light (bottom-right) */}
      <div
        style={{
          position: "absolute",
          bottom: "13%",
          right: "13%",
          width: "22%",
          height: "16%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          filter: "blur(4px)",
          pointerEvents: "none",
        }}
      />
      {/* Icon */}
      <motion.span
        animate={{ rotate: [0, 12, -12, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ fontSize: "4.2rem", zIndex: 1, pointerEvents: "none" }}
      >
        🎲
      </motion.span>
    </motion.div>
  );
}

// ─── Sub-component: Small Ball (inside cage) ──────────────────────────────────

function SmallBall({ number, colorScheme, orbitPath, duration, size }) {
  return (
    <motion.div
      animate={{ x: orbitPath.x, y: orbitPath.y }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        repeatType: "loop",
      }}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        marginTop: -size / 2,
        marginLeft: -size / 2,
        borderRadius: "50%",
        background: colorScheme.sphere,
        boxShadow: `inset -4px -4px 9px rgba(0,0,0,0.45), inset 2px 2px 5px rgba(255,255,255,0.38), 0 3px 12px ${colorScheme.glow}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
      }}
    >
      {/* Specular on small ball */}
      <div
        style={{
          position: "absolute",
          top: "9%",
          left: "13%",
          width: "40%",
          height: "29%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.48)",
          filter: "blur(1.5px)",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          fontSize: size * 0.3,
          fontWeight: 900,
          color: "white",
          textShadow: "0 1px 4px rgba(0,0,0,0.65)",
          fontVariantNumeric: "tabular-nums",
          zIndex: 1,
          lineHeight: 1,
          letterSpacing: "-0.5px",
        }}
      >
        {String(number).padStart(2, "0")}
      </span>
    </motion.div>
  );
}

// ─── Sub-component: Cage (mixing phase) ───────────────────────────────────────

function CageWithBalls({ balls }) {
  return (
    <div
      style={{
        width: 256,
        height: 256,
        borderRadius: "50%",
        position: "relative",
        background:
          "radial-gradient(circle at 42% 38%, rgba(99,102,241,0.22) 0%, rgba(15,10,50,0.90) 72%)",
        boxShadow:
          "inset 0 0 55px rgba(0,0,0,0.65), 0 0 55px rgba(99,102,241,0.28), 0 22px 55px rgba(0,0,0,0.55)",
        overflow: "hidden",
      }}
    >
      {/* ── Rotating cage frame (bars spin, balls do not) ── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", inset: 0, borderRadius: "50%" }}
      >
        {/* Horizontal crossbar */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "-6%",
            width: "112%",
            height: 2,
            background: "rgba(148,163,184,0.22)",
            transform: "translateY(-50%)",
          }}
        />
        {/* Vertical crossbar */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "-6%",
            height: "112%",
            width: 2,
            background: "rgba(148,163,184,0.22)",
            transform: "translateX(-50%)",
          }}
        />
        {/* Diagonal bar ↗ */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "118%",
            height: 1.5,
            background: "rgba(148,163,184,0.14)",
            transform: "translate(-50%,-50%) rotate(45deg)",
          }}
        />
        {/* Diagonal bar ↘ */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "118%",
            height: 1.5,
            background: "rgba(148,163,184,0.14)",
            transform: "translate(-50%,-50%) rotate(-45deg)",
          }}
        />
      </motion.div>

      {/* ── Outer ring (static) ── */}
      <div
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: "50%",
          border: "3px solid rgba(148,163,184,0.38)",
          pointerEvents: "none",
          zIndex: 5,
          boxShadow: "inset 0 0 20px rgba(99,102,241,0.12)",
        }}
      />
      {/* Inner decorative ring */}
      <div
        style={{
          position: "absolute",
          top: "17%",
          left: "17%",
          right: "17%",
          bottom: "17%",
          borderRadius: "50%",
          border: "1.5px solid rgba(148,163,184,0.16)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* ── Balls ── */}
      {balls.map((ball, i) => (
        <SmallBall
          key={i}
          number={ball.number}
          colorScheme={ball.color}
          orbitPath={ball.path}
          duration={ball.duration}
          size={ball.size}
        />
      ))}

      {/* ── Glass cap (top glare) ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "34%",
          borderRadius: "128px 128px 0 0",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 6,
        }}
      />
    </div>
  );
}

// ─── Sub-component: Winner Ball ───────────────────────────────────────────────

/**
 * Classic bingo ball design:
 *  - Colored sphere with realistic 3D lighting
 *  - White horizontal stripe/band across equator
 *  - Number printed on the white band in dark ink
 *  - Color determined by winner number range (standard bingo conventions)
 */
function WinnerBall({ winner, totalNumbers, showNumber }) {
  const numStr = winner != null ? padNum(winner, totalNumbers) : "??";
  const n = winner || 0;

  // Bingo number ranges → ball colors
  const color =
    n <= 15
      ? { sphere: "radial-gradient(circle at 30% 25%, #FFF8DC, #FBBF24 42%, #F59E0B 65%, #92400E)", glow: "rgba(251,191,36,0.85)" }
      : n <= 30
      ? { sphere: "radial-gradient(circle at 30% 25%, #BAE6FD, #38BDF8 42%, #0284C7 65%, #0C4A6E)", glow: "rgba(56,189,248,0.85)" }
      : n <= 45
      ? { sphere: "radial-gradient(circle at 30% 25%, #FCA5A5, #EF4444 42%, #DC2626 65%, #7F1D1D)", glow: "rgba(239,68,68,0.85)" }
      : n <= 60
      ? { sphere: "radial-gradient(circle at 30% 25%, #86EFAC, #22C55E 42%, #16A34A 65%, #14532D)", glow: "rgba(34,197,94,0.85)" }
      : { sphere: "radial-gradient(circle at 30% 25%, #C4B5FD, #8B5CF6 42%, #7C3AED 65%, #2E1065)", glow: "rgba(139,92,246,0.85)" };

  return (
    <div
      style={{
        width: 256,
        height: 256,
        borderRadius: "50%",
        background: color.sphere,
        boxShadow: `0 0 90px ${color.glow}, 0 0 160px ${color.glow.replace("0.85","0.22")}, inset -24px -24px 52px rgba(0,0,0,0.38), inset 12px 12px 26px rgba(255,255,255,0.24)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Primary specular highlight (top-left) */}
      <div
        style={{
          position: "absolute",
          top: "9%",
          left: "13%",
          width: "50%",
          height: "38%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.2) 45%, transparent 70%)",
          filter: "blur(5px)",
          transform: "rotate(-14deg)",
          pointerEvents: "none",
        }}
      />
      {/* Secondary rim light (bottom-right) */}
      <div
        style={{
          position: "absolute",
          bottom: "11%",
          right: "10%",
          width: "26%",
          height: "19%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.18)",
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />

      {/* ── White stripe band (classic bingo ball number area) ── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          left: "9%",
          right: "9%",
          height: "28%",
          background: "rgba(255,255,255,0.94)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.18), inset 0 1px 4px rgba(0,0,0,0.06)",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <AnimatePresence>
          {showNumber && (
            <motion.span
              key={numStr}
              initial={{ opacity: 0, scale: 0.2, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.18,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              style={{
                fontSize: "2.8rem",
                fontWeight: 900,
                color: "#1E293B",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-2.5px",
                lineHeight: 1,
                textShadow: "0 1px 2px rgba(0,0,0,0.12)",
              }}
            >
              {numStr}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Pure helper (outside component — safe to call Math.random) ──────────────

/**
 * Generates stable ball data for the cage animation.
 * Defined outside the component so it can be called from useEffect/useState
 * without triggering the react-hooks/purity ESLint rule.
 */
function computeBallsData(soldNumbers) {
  const pool =
    soldNumbers.length >= 8
      ? [...soldNumbers].sort(() => Math.random() - 0.5).slice(0, 8)
      : Array.from(
          { length: 8 },
          (_, i) =>
            soldNumbers[i % Math.max(soldNumbers.length, 1)] || (i % 20) + 1
        );
  return pool.map((n, i) => ({
    number: n,
    color: BALL_COLORS[i % BALL_COLORS.length],
    path: ORBIT_PATHS[i % ORBIT_PATHS.length],
    duration: 2.0 + i * 0.27,
    size: 36 + (i % 3) * 5,
  }));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Bolillero({
  soldNumbers = [],
  onDraw,
  onResult,
  darkMode = false,
  totalNumbers = 100,
}) {
  const [phase, setPhase] = useState("idle"); // idle | mixing | zooming | result
  const [winner, setWinner] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  // useState initializer runs once on mount (ESLint-safe: not inside useMemo)
  const [ballsData, setBallsData] = useState(() => computeBallsData(soldNumbers));

  // Recompute balls when the sold numbers list changes (runs as a side-effect, not during render)
  useEffect(() => {
    setBallsData(computeBallsData(soldNumbers));
  }, [soldNumbers]);

  const startDraw = () => {
    if (phase !== "idle" || soldNumbers.length === 0) return;
    const w = onDraw?.();
    if (w == null) return;
    setWinner(w);
    setPhase("mixing");

    // Phase timeline:
    //   0s → 4s  : mixing  (cage tumbling)
    //   4s → 5.1s: zooming (ball shoots toward viewer)
    //   5.1s+    : result  (number revealed + confetti)
    const t1 = setTimeout(() => {
      setPhase("zooming");
      const t2 = setTimeout(() => {
        setPhase("result");
        onResult?.(w);

        // Generate confetti burst — all random values computed here (inside useEffect/setTimeout, not during render)
        const particles = Array.from({ length: 60 }, (_, i) => ({
          id: i,
          color: [
            "#FFD700","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4",
            "#FFEAA7","#FF9FF3","#54A0FF","#5F27CD","#FF6348",
          ][i % 10],
          x: (Math.random() - 0.5) * 540,
          y: -(Math.random() * 440 + 90),
          r: Math.random() * 720 - 360,
          scale: 0.4 + Math.random() * 1.3,
          delay: Math.random() * 0.95,
          isRect: Math.random() > 0.5,
          duration: 1.9 + Math.random() * 0.9, // precomputed — avoids Math.random() in JSX render
        }));
        setConfetti(particles);
        const t3 = setTimeout(() => setConfetti([]), 4800);
        timers.current.push(t3);
      }, 1100);
      timers.current.push(t2);
    }, 4000);
    timers.current.push(t1);
  };

  const reset = () => {
    clearTimers();
    setPhase("idle");
    setWinner(null);
    setConfetti([]);
  };

  const canDraw = phase === "idle" && soldNumbers.length > 0;
  const textColor = darkMode ? "#F1F5F9" : "#0F172A";
  const mutedColor = darkMode ? "#94A3B8" : "#64748B";

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        userSelect: "none",
        minWidth: 300,
      }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontWeight: 900,
            fontSize: 22,
            margin: 0,
            color: textColor,
            letterSpacing: "-0.5px",
          }}
        >
          🎱 Bolillero
        </h2>
        <p style={{ fontSize: 13, margin: "5px 0 0", color: mutedColor }}>
          {soldNumbers.length} número
          {soldNumbers.length !== 1 ? "s" : ""} en juego
        </p>
      </div>

      {/* ── Visual Area ── */}
      <div style={{ position: "relative", width: 272, height: 272 }}>
        {/* Cast shadow */}
        <motion.div
          animate={{
            width: phase === "mixing" ? 224 : 190,
            opacity: phase === "mixing" ? 0.48 : 0.28,
          }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute",
            bottom: -14,
            left: "50%",
            transform: "translateX(-50%)",
            height: 22,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(0,0,0,0.42) 0%, transparent 70%)",
          }}
        />

        {/* IDLE sphere */}
        <AnimatePresence>
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.22 } }}
              transition={{ duration: 0.45, ease: "backOut" }}
              style={{
                position: "absolute",
                inset: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IdleSphere
                canDraw={canDraw}
                onClick={canDraw ? startDraw : undefined}
                darkMode={darkMode}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* MIXING cage */}
        <AnimatePresence>
          {phase === "mixing" && (
            <motion.div
              key="mixing"
              initial={{ opacity: 0, scale: 0.72 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.18, transition: { duration: 0.38 } }}
              transition={{ duration: 0.52, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                position: "absolute",
                inset: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Subtle vibration — simulates the bolillero motor */}
              <motion.div
                animate={{ x: [-1, 1.2, -1.5, 1, -0.8, 0], y: [0, -1, 1.2, -0.8, 1, 0] }}
                transition={{ duration: 0.28, repeat: Infinity, ease: "easeInOut" }}
              >
                <CageWithBalls balls={ballsData} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ZOOMING — ball flies toward viewer */}
        <AnimatePresence>
          {phase === "zooming" && (
            <motion.div
              key="zooming"
              initial={{ scale: 0.08, opacity: 0.55 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.92,
                ease: [0.175, 0.885, 0.32, 1.275], // elastic overshoot
              }}
              style={{
                position: "absolute",
                inset: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WinnerBall
                winner={winner}
                totalNumbers={totalNumbers}
                showNumber={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* RESULT — ball with number */}
        <AnimatePresence>
          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: "backOut" }}
              style={{
                position: "absolute",
                inset: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WinnerBall
                winner={winner}
                totalNumbers={totalNumbers}
                showNumber={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Status text ── */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.p
            key="s-idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              fontSize: 13,
              color: mutedColor,
              margin: 0,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {canDraw
              ? "Toca la esfera o el botón ↓"
              : "No hay números pagados aún"}
          </motion.p>
        )}

        {phase === "mixing" && (
          <motion.div
            key="s-mix"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.0, repeat: Infinity, ease: "linear" }}
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2.5px solid #818CF8",
                borderTopColor: "transparent",
                flexShrink: 0,
              }}
            />
            <span
              style={{ fontSize: 14, fontWeight: 700, color: "#818CF8" }}
            >
              Mezclando bolillas…
            </span>
          </motion.div>
        )}

        {phase === "zooming" && (
          <motion.p
            key="s-zoom"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#F59E0B",
              margin: 0,
            }}
          >
            ✨ ¡Salió una bolilla!
          </motion.p>
        )}

        {phase === "result" && (
          <motion.div
            key="s-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center" }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#F59E0B",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              🏆 Número Ganador
            </p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.28, type: "spring", stiffness: 220 }}
              style={{
                fontSize: 46,
                fontWeight: 900,
                color: textColor,
                margin: "4px 0 0",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-2.5px",
              }}
            >
              #{padNum(winner, totalNumbers)}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action buttons ── */}
      <div
        style={{ display: "flex", gap: 12, width: "100%", maxWidth: 258 }}
      >
        {phase === "idle" && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={startDraw}
            disabled={!canDraw}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 14,
              fontWeight: 800,
              fontSize: 15,
              color: "white",
              border: "none",
              cursor: canDraw ? "pointer" : "not-allowed",
              background: canDraw
                ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
                : "#94A3B8",
              boxShadow: canDraw
                ? "0 6px 30px rgba(99,102,241,0.52)"
                : "none",
              transition: "background 0.2s, box-shadow 0.2s",
            }}
          >
            🎰 Iniciar Sorteo
          </motion.button>
        )}

        {phase === "result" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={reset}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              background: "transparent",
              border: `2px solid ${darkMode ? "#475569" : "#CBD5E1"}`,
              color: darkMode ? "#CBD5E1" : "#475569",
            }}
          >
            🔄 Nuevo Sorteo
          </motion.button>
        )}
      </div>

      {/* ── Confetti burst ── */}
      <AnimatePresence>
        {confetti.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: p.scale }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: 0,
              rotate: p.r,
              scale: p.scale * 0.08,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              position: "absolute",
              top: "42%",
              left: "50%",
              width: p.isRect ? 13 : 9,
              height: p.isRect ? 7 : 9,
              borderRadius: p.isRect ? "2px" : "50%",
              background: p.color,
              pointerEvents: "none",
              zIndex: 20,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
