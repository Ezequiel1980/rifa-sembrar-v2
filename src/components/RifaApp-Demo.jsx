"use client";

/**
 * RifaApp-Demo.jsx
 * ──────────────────────────────────────────────────────────────────────────
 * Demo interactivo completo — Sembrar Rifa
 * Funciona standalone (sin Firebase real) usando React state como mock.
 * Para producción: reemplazar mock state con useRifa() hook + Firebase.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── useWindowWidth hook ──────────────────────────────────────────────────────
// useSyncExternalStore is the React 18+ official way to subscribe to external
// stores (like window size). No useState + useEffect = no setState-in-effect
// lint warning, no hydration mismatch (getServerSnapshot returns desktop default).

function subscribeToResize(cb) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
function getWindowWidth() { return window.innerWidth; }
function getServerWidth() { return 1200; } // SSR / first render default

function useWindowWidth() {
  return useSyncExternalStore(subscribeToResize, getWindowWidth, getServerWidth);
}

// ─── Utils ───────────────────────────────────────────────────────────────────

const pad = (n, total = 100) => String(n).padStart(String(total).length, "0");

// ─── Bolillero helpers (outside component — Math.random safe here) ───────────

function computeDemoBalls(soldNumbers) {
  const pool =
    soldNumbers.length >= 8
      ? [...soldNumbers].sort(() => Math.random() - 0.5).slice(0, 8)
      : Array.from(
          { length: 8 },
          (_, i) => soldNumbers[i % Math.max(soldNumbers.length, 1)] || (i % 20) + 1
        );
  return pool.map((n, i) => ({
    number: n,
    color: BALL_COLORS_DEMO[i % BALL_COLORS_DEMO.length],
    path: ORBIT_PATHS_DEMO[i % ORBIT_PATHS_DEMO.length],
    duration: 2.0 + i * 0.27,
    size: 36 + (i % 3) * 5,
  }));
}

// ─── Bolillero — Sub-components ──────────────────────────────────────────────

const BALL_COLORS_DEMO = [
  { sphere: "radial-gradient(circle at 32% 28%, #FCA5A5, #EF4444 52%, #7F1D1D)", glow: "rgba(239,68,68,0.55)" },
  { sphere: "radial-gradient(circle at 32% 28%, #93C5FD, #3B82F6 52%, #1E3A8A)", glow: "rgba(59,130,246,0.55)" },
  { sphere: "radial-gradient(circle at 32% 28%, #86EFAC, #22C55E 52%, #14532D)", glow: "rgba(34,197,94,0.55)" },
  { sphere: "radial-gradient(circle at 32% 28%, #C4B5FD, #8B5CF6 52%, #2E1065)", glow: "rgba(139,92,246,0.55)" },
  { sphere: "radial-gradient(circle at 32% 28%, #FDBA74, #F97316 52%, #431407)", glow: "rgba(249,115,22,0.55)" },
  { sphere: "radial-gradient(circle at 32% 28%, #FDE68A, #F59E0B 52%, #78350F)", glow: "rgba(245,158,11,0.55)" },
];

const ORBIT_PATHS_DEMO = [
  { x: [0, 62, 42, -18, -72, -52, 18, 0],  y: [0, 18, 76, 80, 40, -28, -58, 0] },
  { x: [0, -52, -68, -28, 16, 58, 48, 0],   y: [0, 44, -6, -62, -72, -28, 18, 0] },
  { x: [0, 28, 72, 58, 6, -44, -58, 0],     y: [0, -58, -34, 20, 62, 52, 4, 0] },
  { x: [0, -28, -62, -52, 2, 38, 58, 0],    y: [0, -42, 6, 58, 72, 44, -14, 0] },
  { x: [0, 54, 38, -10, -62, -56, -4, 0],   y: [0, -18, -68, -62, -18, 28, 62, 0] },
  { x: [0, -44, -20, 28, 62, 54, 10, 0],    y: [0, 62, 68, 40, -10, -58, -62, 0] },
  { x: [0, 18, 58, 52, 4, -38, -62, 0],     y: [0, 54, 14, -40, -68, -44, 8, 0] },
  { x: [0, -58, -48, 4, 48, 62, 24, 0],     y: [0, -14, -62, -68, -38, 18, 56, 0] },
];

function DemoSmallBall({ number, colorScheme, orbitPath, duration, size }) {
  return (
    <motion.div
      animate={{ x: orbitPath.x, y: orbitPath.y }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
      style={{
        position: "absolute", top: "50%", left: "50%",
        width: size, height: size, marginTop: -size / 2, marginLeft: -size / 2,
        borderRadius: "50%", background: colorScheme.sphere,
        boxShadow: `inset -4px -4px 9px rgba(0,0,0,0.45), inset 2px 2px 5px rgba(255,255,255,0.38), 0 3px 12px ${colorScheme.glow}`,
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
      }}
    >
      <div style={{
        position: "absolute", top: "9%", left: "13%", width: "40%", height: "29%",
        borderRadius: "50%", background: "rgba(255,255,255,0.48)", filter: "blur(1.5px)", pointerEvents: "none",
      }} />
      <span style={{
        fontSize: size * 0.3, fontWeight: 900, color: "white",
        textShadow: "0 1px 4px rgba(0,0,0,0.65)", fontVariantNumeric: "tabular-nums",
        zIndex: 1, lineHeight: 1, letterSpacing: "-0.5px",
      }}>
        {String(number).padStart(2, "0")}
      </span>
    </motion.div>
  );
}

function DemoCage({ balls }) {
  return (
    <div style={{
      width: 256, height: 256, borderRadius: "50%", position: "relative",
      background: "radial-gradient(circle at 42% 38%, rgba(99,102,241,0.22) 0%, rgba(15,10,50,0.90) 72%)",
      boxShadow: "inset 0 0 55px rgba(0,0,0,0.65), 0 0 55px rgba(99,102,241,0.28), 0 22px 55px rgba(0,0,0,0.55)",
      overflow: "hidden",
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", inset: 0, borderRadius: "50%" }}
      >
        <div style={{ position:"absolute", top:"50%", left:"-6%", width:"112%", height:2, background:"rgba(148,163,184,0.22)", transform:"translateY(-50%)" }} />
        <div style={{ position:"absolute", left:"50%", top:"-6%", height:"112%", width:2, background:"rgba(148,163,184,0.22)", transform:"translateX(-50%)" }} />
        <div style={{ position:"absolute", top:"50%", left:"50%", width:"118%", height:1.5, background:"rgba(148,163,184,0.14)", transform:"translate(-50%,-50%) rotate(45deg)" }} />
        <div style={{ position:"absolute", top:"50%", left:"50%", width:"118%", height:1.5, background:"rgba(148,163,184,0.14)", transform:"translate(-50%,-50%) rotate(-45deg)" }} />
      </motion.div>
      <div style={{ position:"absolute", inset:3, borderRadius:"50%", border:"3px solid rgba(148,163,184,0.38)", pointerEvents:"none", zIndex:5 }} />
      <div style={{ position:"absolute", top:"17%", left:"17%", right:"17%", bottom:"17%", borderRadius:"50%", border:"1.5px solid rgba(148,163,184,0.16)", pointerEvents:"none", zIndex:5 }} />
      {balls.map((ball, i) => (
        <DemoSmallBall key={i} number={ball.number} colorScheme={ball.color} orbitPath={ball.path} duration={ball.duration} size={ball.size} />
      ))}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"34%",
        borderRadius:"128px 128px 0 0",
        background:"linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 100%)",
        pointerEvents:"none", zIndex:6,
      }} />
    </div>
  );
}

function DemoWinnerBall({ winner, showNumber }) {
  const numStr = winner != null ? pad(winner, 100) : "??";
  const n = winner || 0;
  const color =
    n <= 15 ? { sphere: "radial-gradient(circle at 30% 25%, #FFF8DC, #FBBF24 42%, #F59E0B 65%, #92400E)", glow: "rgba(251,191,36,0.85)" }
    : n <= 30 ? { sphere: "radial-gradient(circle at 30% 25%, #BAE6FD, #38BDF8 42%, #0284C7 65%, #0C4A6E)", glow: "rgba(56,189,248,0.85)" }
    : n <= 45 ? { sphere: "radial-gradient(circle at 30% 25%, #FCA5A5, #EF4444 42%, #DC2626 65%, #7F1D1D)", glow: "rgba(239,68,68,0.85)" }
    : n <= 60 ? { sphere: "radial-gradient(circle at 30% 25%, #86EFAC, #22C55E 42%, #16A34A 65%, #14532D)", glow: "rgba(34,197,94,0.85)" }
    : { sphere: "radial-gradient(circle at 30% 25%, #C4B5FD, #8B5CF6 42%, #7C3AED 65%, #2E1065)", glow: "rgba(139,92,246,0.85)" };

  return (
    <div style={{
      width: 256, height: 256, borderRadius: "50%", background: color.sphere,
      boxShadow: `0 0 90px ${color.glow}, 0 0 160px ${color.glow.replace("0.85","0.22")}, inset -24px -24px 52px rgba(0,0,0,0.38), inset 12px 12px 26px rgba(255,255,255,0.24)`,
      display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
    }}>
      <div style={{
        position:"absolute", top:"9%", left:"13%", width:"50%", height:"38%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.2) 45%, transparent 70%)",
        filter:"blur(5px)", transform:"rotate(-14deg)", pointerEvents:"none",
      }} />
      <div style={{
        position:"absolute", bottom:"11%", right:"10%", width:"26%", height:"19%", borderRadius:"50%",
        background:"rgba(255,255,255,0.18)", filter:"blur(6px)", pointerEvents:"none",
      }} />
      {/* White number band */}
      <div style={{
        position:"absolute", top:"50%", transform:"translateY(-50%)", left:"9%", right:"9%", height:"28%",
        background:"rgba(255,255,255,0.94)", borderRadius:8,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 3px 10px rgba(0,0,0,0.18), inset 0 1px 4px rgba(0,0,0,0.06)",
        overflow:"hidden", zIndex:2,
      }}>
        <AnimatePresence>
          {showNumber && (
            <motion.span
              key={numStr}
              initial={{ opacity: 0, scale: 0.2, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.18, type: "spring", stiffness: 260, damping: 18 }}
              style={{
                fontSize: "2.8rem", fontWeight: 900, color: "#1E293B",
                fontVariantNumeric: "tabular-nums", letterSpacing: "-2.5px", lineHeight: 1,
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

// ─── Bolillero Component ──────────────────────────────────────────────────────

function Bolillero({ soldNumbers, onStartDraw, onComplete, darkMode }) {
  const [phase, setPhase] = useState("idle"); // idle | mixing | zooming | result
  const [winner, setWinner] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const timers = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  // useState initializer runs once (ESLint-safe); useEffect recomputes on soldNumbers change
  const [ballsData, setBallsData] = useState(() => computeDemoBalls(soldNumbers));
  useEffect(() => {
    setBallsData(computeDemoBalls(soldNumbers));
  }, [soldNumbers]);

  const handleDraw = () => {
    if (phase !== "idle" || soldNumbers.length === 0) return;
    const w = onStartDraw();
    if (!w) return;
    setWinner(w);
    setPhase("mixing");

    const t1 = setTimeout(() => {
      setPhase("zooming");
      const t2 = setTimeout(() => {
        setPhase("result");
        onComplete?.(w); // notify parent only now (after full animation)
        const particles = Array.from({ length: 60 }, (_, i) => ({
          id: i,
          color: ["#FFD700","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#FF9FF3","#54A0FF","#5F27CD","#FF6348"][i % 10],
          x: (Math.random() - 0.5) * 540,
          y: -(Math.random() * 440 + 90),
          r: Math.random() * 720 - 360,
          scale: 0.4 + Math.random() * 1.3,
          delay: Math.random() * 0.95,
          isRect: Math.random() > 0.5,
          duration: 1.9 + Math.random() * 0.9, // precomputed — no Math.random() in JSX render
        }));
        setConfetti(particles);
        const t3 = setTimeout(() => setConfetti([]), 4800);
        timers.current.push(t3);
      }, 1100);
      timers.current.push(t2);
    }, 4000);
    timers.current.push(t1);
  };

  const reset = () => { clearTimers(); setPhase("idle"); setWinner(null); setConfetti([]); };
  const canDraw = phase === "idle" && soldNumbers.length > 0;
  const textColor = darkMode ? "#F1F5F9" : "#0F172A";
  const mutedColor = darkMode ? "#94A3B8" : "#64748B";

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 26, userSelect: "none", minWidth: 300 }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0, color: textColor, letterSpacing: "-0.5px" }}>🎱 Bolillero</h2>
        <p style={{ fontSize: 13, margin: "5px 0 0", color: mutedColor }}>
          {soldNumbers.length} número{soldNumbers.length !== 1 ? "s" : ""} en juego
        </p>
      </div>

      {/* Visual Area */}
      <div style={{ position: "relative", width: 272, height: 272 }}>
        {/* Drop shadow */}
        <motion.div
          animate={{ width: phase === "mixing" ? 224 : 190, opacity: phase === "mixing" ? 0.48 : 0.28 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
            height: 22, borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.42) 0%, transparent 70%)",
          }}
        />

        {/* IDLE */}
        <AnimatePresence>
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.22 } }}
              transition={{ duration: 0.45, ease: "backOut" }}
              style={{ position: "absolute", inset: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <motion.div
                animate={{ scale: [1, 1.038, 1] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                onClick={canDraw ? handleDraw : undefined}
                style={{
                  width: 256, height: 256, borderRadius: "50%",
                  background: darkMode
                    ? "radial-gradient(circle at 30% 25%, #475569, #1E293B 58%, #0F172A)"
                    : "radial-gradient(circle at 30% 25%, #E2E8F0, #94A3B8 58%, #475569)",
                  boxShadow: darkMode
                    ? "inset -24px -24px 52px rgba(0,0,0,0.5), inset 11px 11px 24px rgba(255,255,255,0.07), 0 18px 45px rgba(0,0,0,0.45)"
                    : "inset -24px -24px 52px rgba(0,0,0,0.18), inset 11px 11px 24px rgba(255,255,255,0.35), 0 18px 45px rgba(0,0,0,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: canDraw ? "pointer" : "default", position: "relative",
                }}>
                <div style={{ position:"absolute", top:"11%", left:"15%", width:"44%", height:"32%", borderRadius:"50%",
                  background:"radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)", filter:"blur(5px)", transform:"rotate(-18deg)", pointerEvents:"none" }} />
                <div style={{ position:"absolute", bottom:"13%", right:"13%", width:"22%", height:"16%", borderRadius:"50%",
                  background:"rgba(255,255,255,0.1)", filter:"blur(4px)", pointerEvents:"none" }} />
                <motion.span
                  animate={{ rotate: [0, 12, -12, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ fontSize: "4.2rem", zIndex: 1, pointerEvents: "none" }}>🎲</motion.span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MIXING */}
        <AnimatePresence>
          {phase === "mixing" && (
            <motion.div key="mixing" initial={{ opacity: 0, scale: 0.72 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.18, transition: { duration: 0.38 } }}
              transition={{ duration: 0.52, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{ position: "absolute", inset: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <motion.div
                animate={{ x: [-1, 1.2, -1.5, 1, -0.8, 0], y: [0, -1, 1.2, -0.8, 1, 0] }}
                transition={{ duration: 0.28, repeat: Infinity, ease: "easeInOut" }}>
                <DemoCage balls={ballsData} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ZOOMING */}
        <AnimatePresence>
          {phase === "zooming" && (
            <motion.div key="zooming" initial={{ scale: 0.08, opacity: 0.55 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.92, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{ position: "absolute", inset: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DemoWinnerBall winner={winner} showNumber={false} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* RESULT */}
        <AnimatePresence>
          {phase === "result" && (
            <motion.div key="result" initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.38, ease: "backOut" }}
              style={{ position: "absolute", inset: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DemoWinnerBall winner={winner} showNumber={true} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.p key="s-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontSize: 13, color: mutedColor, margin: 0, fontWeight: 600, textAlign: "center" }}>
            {canDraw ? "Toca la esfera o el botón ↓" : "No hay números pagados aún"}
          </motion.p>
        )}
        {phase === "mixing" && (
          <motion.div key="s-mix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.0, repeat: Infinity, ease: "linear" }}
              style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid #818CF8", borderTopColor: "transparent", flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#818CF8" }}>Mezclando bolillas…</span>
          </motion.div>
        )}
        {phase === "zooming" && (
          <motion.p key="s-zoom" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
            style={{ fontSize: 15, fontWeight: 800, color: "#F59E0B", margin: 0 }}>
            ✨ ¡Salió una bolilla!
          </motion.p>
        )}
        {phase === "result" && (
          <motion.div key="s-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#F59E0B", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
              🏆 Número Ganador
            </p>
            <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.28, type: "spring", stiffness: 220 }}
              style={{ fontSize: 46, fontWeight: 900, color: textColor, margin: "4px 0 0", fontVariantNumeric: "tabular-nums", letterSpacing: "-2.5px" }}>
              #{winner ? pad(winner, 100) : "??"}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 258 }}>
        {phase === "idle" && (
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleDraw} disabled={!canDraw}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 14, fontWeight: 800, fontSize: 15,
              color: "white", border: "none", cursor: canDraw ? "pointer" : "not-allowed",
              background: canDraw ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#94A3B8",
              boxShadow: canDraw ? "0 6px 30px rgba(99,102,241,0.52)" : "none",
            }}>
            🎰 Iniciar Sorteo
          </motion.button>
        )}
        {phase === "result" && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={reset}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 14, fontWeight: 700, fontSize: 14,
              cursor: "pointer", background: "transparent",
              border: `2px solid ${darkMode ? "#475569" : "#CBD5E1"}`,
              color: darkMode ? "#CBD5E1" : "#475569",
            }}>
            🔄 Nuevo Sorteo
          </motion.button>
        )}
      </div>

      {/* Confetti */}
      <AnimatePresence>
        {confetti.map(p => (
          <motion.div key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: p.scale }}
            animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.r, scale: p.scale * 0.08 }}
            transition={{ duration: p.duration, delay: p.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: "absolute", top: "42%", left: "50%",
              width: p.isRect ? 13 : 9, height: p.isRect ? 7 : 9,
              borderRadius: p.isRect ? "2px" : "50%",
              background: p.color, pointerEvents: "none", zIndex: 20,
            }} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Number Grid ─────────────────────────────────────────────────────────────

function NumberGrid({ totalNumbers, tickets, selectedNums, onToggle, darkMode, currentUserId }) {
  const statusColors = {
    available: {
      bg: darkMode ? "#1F2937" : "#F9FAFB",
      border: darkMode ? "#374151" : "#E5E7EB",
      text: darkMode ? "#9CA3AF" : "#6B7280",
      hover: darkMode ? "#374151" : "#F3F4F6",
    },
    reserved: {
      bg: darkMode ? "#451A03" : "#FEF3C7",
      border: darkMode ? "#92400E" : "#FCD34D",
      text: darkMode ? "#FCD34D" : "#92400E",
    },
    paid: {
      bg: darkMode ? "#14532D" : "#DCFCE7",
      border: darkMode ? "#166534" : "#86EFAC",
      text: darkMode ? "#86EFAC" : "#166534",
    },
    mine: {
      bg: darkMode ? "#1E1B4B" : "#EEF2FF",
      border: "#6366F1",
      text: "#6366F1",
    },
    selected: {
      bg: "#6366F1",
      border: "#4F46E5",
      text: "white",
    },
  };

  const getStyle = (n) => {
    if (selectedNums.includes(n)) return statusColors.selected;
    const t = tickets[n];
    if (!t) return statusColors.available;
    if (t.userId === currentUserId) return statusColors.mine;
    return statusColors[t.status] || statusColors.available;
  };

  const isClickable = (n) => !tickets[n];

  const cols = totalNumbers <= 100 ? 10 : totalNumbers <= 200 ? 10 : 20;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: totalNumbers <= 100 ? 6 : 4,
    }}>
      {Array.from({ length: totalNumbers }, (_, i) => i + 1).map((n) => {
        const s = getStyle(n);
        const clickable = isClickable(n);
        return (
          <motion.button
            key={n}
            whileHover={clickable ? { scale: 1.12 } : {}}
            whileTap={clickable ? { scale: 0.9 } : {}}
            onClick={() => clickable && onToggle(n)}
            style={{
              padding: totalNumbers <= 100 ? "8px 4px" : "5px 2px",
              borderRadius: 8,
              fontSize: totalNumbers <= 100 ? 13 : 11,
              fontWeight: 700,
              background: s.bg,
              border: `2px solid ${s.border}`,
              color: s.text,
              cursor: clickable ? "pointer" : "default",
              fontVariantNumeric: "tabular-nums",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            {pad(n, totalNumbers)}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function GridLegend({ darkMode }) {
  const items = [
    { color: darkMode ? "#374151" : "#E5E7EB", label: "Disponible" },
    { color: "#6366F1", label: "Seleccionado" },
    { color: darkMode ? "#1E1B4B" : "#EEF2FF", border: "#6366F1", label: "El mío" },
    { color: darkMode ? "#451A03" : "#FEF3C7", border: "#FCD34D", label: "Reservado" },
    { color: darkMode ? "#14532D" : "#DCFCE7", border: "#86EFAC", label: "Pagado" },
  ];
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {items.map(({ color, border, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div style={{
            width: 14, height: 14, borderRadius: 4,
            background: color,
            border: `2px solid ${border || color}`,
          }} />
          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, darkMode }) {
  return (
    <div style={{
      padding: "16px 20px", borderRadius: 14,
      background: darkMode ? "#1F2937" : "#F9FAFB",
      border: `1px solid ${darkMode ? "#374151" : "#E5E7EB"}`,
    }}>
      <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{icon} {label}</p>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function RifaApp() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("user"); // "user" | "admin" | "draw"
  const [currentRole, setCurrentRole] = useState("user"); // "user" | "admin"

  // Mock raffle config
  const [rifaConfig, setRifaConfig] = useState({
    title: "Gran Rifa Solidaria 2026",
    totalNumbers: 100,
    ticketPrice: 2000,
    numberOfPrizes: 1,
    status: "active",
    payment: {
      mercadoPagoAlias: "sembrar.rifa",
      mercadoPagoLink: "https://link.mercadopago.com.ar/sembrar",
      instructions: "Enviar comprobante al WhatsApp del organizador.",
    },
  });

  // Mock tickets state: { [number]: ticketData }
  const [tickets, setTickets] = useState(() => {
    const initial = {};
    [[5, "user2", "María G.", "paid"], [12, "user2", "María G.", "paid"],
     [33, "user3", "Carlos P.", "paid"], [47, "user3", "Carlos P.", "paid"],
     [71, "user4", "Laura M.", "paid"], [88, "user4", "Laura M.", "paid"],
     [19, "user1", "Tú", "reserved"], [42, "user5", "Pedro R.", "reserved"]
    ].forEach(([n, uid, name, status]) => {
      initial[n] = { number: n, userId: uid, userName: name, status };
    });
    return initial;
  });

  const currentUserId = "user1";
  const [selectedNums, setSelectedNums] = useState([]);
  const [randomCount, setRandomCount] = useState(1);
  // Multi-prize draw state
  const [drawResults, setDrawResults] = useState([]); // [{prizeLabel, prizeNumber, number, userName, userEmail}]
  const [showWinnerCard, setShowWinnerCard] = useState(false);
  const [bolilleroKey, setBolilleroKey] = useState(0); // remount bolillero between draws
  const [showPayModal, setShowPayModal] = useState(false);
  const [adminEdit, setAdminEdit] = useState(null); // number being edited
  const [editForm, setEditForm] = useState({ userName: "", userEmail: "" });
  const [notification, setNotification] = useState(null);

  // Config edit state
  const [editConfig, setEditConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState({ ...rifaConfig });

  // Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  // Responsive
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Derived ──
  const soldNumbers = Object.values(tickets).filter(t => t.status === "paid").map(t => t.number);
  const reservedNumbers = Object.values(tickets).filter(t => t.status === "reserved").map(t => t.number);
  const myTickets = Object.values(tickets).filter(t => t.userId === currentUserId);
  const available = rifaConfig.totalNumbers - Object.keys(tickets).length;
  const revenue = soldNumbers.length * rifaConfig.ticketPrice;

  // ── Toggle number selection ──
  const toggleNumber = (n) => {
    setSelectedNums(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  };

  // ── Pick random numbers ──
  const pickRandom = () => {
    const avail = Array.from({ length: rifaConfig.totalNumbers }, (_, i) => i + 1)
      .filter(n => !tickets[n] && !selectedNums.includes(n));
    const picks = [];
    const pool = [...avail];
    for (let i = 0; i < randomCount && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    setSelectedNums(prev => [...new Set([...prev, ...picks])]);
  };

  // ── Reserve selected numbers ──
  const reserveNumbers = () => {
    if (!selectedNums.length) return;
    const conflict = selectedNums.filter(n => tickets[n]);
    if (conflict.length) {
      notify(`❌ Los números ${conflict.join(", ")} ya fueron tomados.`, "error");
      setSelectedNums(prev => prev.filter(n => !conflict.includes(n)));
      return;
    }
    setTickets(prev => {
      const updated = { ...prev };
      selectedNums.forEach(n => {
        updated[n] = { number: n, userId: currentUserId, userName: "Tú", status: "reserved" };
      });
      return updated;
    });
    notify(`✅ ${selectedNums.length} número(s) reservado(s). ¡Completa el pago!`);
    setSelectedNums([]);
    setShowPayModal(true);
  };

  // ── Admin: confirm payment ──
  const confirmPayment = (n) => {
    setTickets(prev => ({
      ...prev,
      [n]: { ...prev[n], status: "paid" },
    }));
    notify(`✅ Pago confirmado para #${pad(n, rifaConfig.totalNumbers)}`);
  };

  // ── Admin: release number ──
  const releaseNumber = (n) => {
    setTickets(prev => {
      const updated = { ...prev };
      delete updated[n];
      return updated;
    });
    notify(`🔄 Número #${pad(n, rifaConfig.totalNumbers)} liberado`);
  };

  // ── Admin: reassign ──
  const saveReassign = () => {
    if (!adminEdit) return;
    setTickets(prev => ({
      ...prev,
      [adminEdit]: {
        ...prev[adminEdit],
        userName: editForm.userName,
        ...(editForm.userEmail ? { userEmail: editForm.userEmail } : {}),
      },
    }));
    notify(`✏️ Número #${pad(adminEdit, rifaConfig.totalNumbers)} reasignado`);
    setAdminEdit(null);
  };

  // ── Draw helpers ──
  const getPrizeLabel = (prizeNumber) =>
    prizeNumber === 1 ? "🥇 1er Premio"
    : prizeNumber === 2 ? "🥈 2do Premio"
    : prizeNumber === 3 ? "🥉 3er Premio"
    : `🏅 ${prizeNumber}° Premio`;

  // Called by Bolillero at start — picks winner from available pool
  const executeDraw = useCallback(() => {
    const alreadyDrawn = drawResults.map(r => r.number);
    const pool = soldNumbers.filter(n => !alreadyDrawn.includes(n));
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [soldNumbers, drawResults]);

  // Called by Bolillero onComplete — records the result AFTER animation ends
  const handleDrawComplete = useCallback((winnerNum) => {
    const ticket = tickets[winnerNum];
    if (!ticket) return;
    const prizeNumber = rifaConfig.numberOfPrizes - drawResults.length; // counting down
    setDrawResults(prev => [...prev, {
      prizeLabel: getPrizeLabel(prizeNumber),
      prizeNumber,
      number: winnerNum,
      userName: ticket.userName,
      userEmail: ticket.userEmail || "",
    }]);
    setShowWinnerCard(true);
  }, [drawResults, tickets, rifaConfig.numberOfPrizes]);

  // ── Save config ──
  const saveConfig = () => {
    setRifaConfig(configDraft);
    setEditConfig(false);
    notify("✅ Configuración guardada");
  };

  // ── Reset rifa ──
  const resetRifa = () => {
    setTickets({});
    setDrawResults([]);
    setShowWinnerCard(false);
    setBolilleroKey(k => k + 1);
    setSelectedNums([]);
    setShowResetModal(false);
    notify("🔄 Rifa reiniciada. Todos los tickets fueron liberados.");
  };

  const totalPrice = selectedNums.length * rifaConfig.ticketPrice;

  // ─── Styles ────────────────────────────────────────────────────────────────
  const bg = darkMode ? "#0F172A" : "#F8FAFC";
  const surface = darkMode ? "#1E293B" : "#FFFFFF";
  const surfaceAlt = darkMode ? "#0F172A" : "#F1F5F9";
  const border = darkMode ? "#334155" : "#E2E8F0";
  const textPrimary = darkMode ? "#F1F5F9" : "#0F172A";
  const textSecondary = darkMode ? "#94A3B8" : "#64748B";

  const tabs = currentRole === "admin"
    ? [
        { id: "admin", label: "⚙️ Admin", mobileLabel: "Admin", icon: "⚙️" },
        { id: "draw", label: "🎰 Sorteo", mobileLabel: "Sorteo", icon: "🎰" },
      ]
    : [
        { id: "user", label: "🎟️ Mis Números", mobileLabel: "Números", icon: "🎟️" },
        { id: "history", label: "📋 Historial", mobileLabel: "Historial", icon: "📋" },
      ];

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textPrimary, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Notification ── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            style={{
              position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
              padding: "10px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14,
              zIndex: 9999, whiteSpace: "nowrap",
              background: notification.type === "error" ? "#FEE2E2" : "#DCFCE7",
              color: notification.type === "error" ? "#991B1B" : "#166534",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            }}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header style={{
        background: surface, borderBottom: `1px solid ${border}`,
        padding: isMobile ? "0 16px" : "0 24px",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, height: 56 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17,
            }}>🎲</div>
            {!isMobile && (
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 15, margin: 0, whiteSpace: "nowrap" }}>Sembrar Rifa</p>
                <p style={{ fontSize: 11, color: textSecondary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rifaConfig.title}</p>
              </div>
            )}
          </div>

          {/* Tabs — hidden on mobile (bottom nav takes over) */}
          {!isMobile && (
            <nav style={{ display: "flex", gap: 4 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: "none", cursor: "pointer", transition: "all 0.15s",
                    background: activeTab === t.id
                      ? "linear-gradient(135deg, #6366F1, #8B5CF6)"
                      : "transparent",
                    color: activeTab === t.id ? "white" : textSecondary,
                  }}>
                  {t.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Role switcher (demo only) */}
            <button onClick={() => { setCurrentRole(r => r === "user" ? "admin" : "user"); setActiveTab(currentRole === "user" ? "admin" : "user"); }}
              style={{
                padding: isMobile ? "5px 8px" : "5px 12px", borderRadius: 8,
                fontSize: isMobile ? 11 : 12, fontWeight: 600,
                border: `1px solid ${border}`, background: "transparent",
                color: currentRole === "admin" ? "#F59E0B" : "#6366F1", cursor: "pointer",
                whiteSpace: "nowrap",
              }}>
              {currentRole === "admin" ? "👑" : "👤"}{!isMobile && (currentRole === "admin" ? " Admin" : " User")}
            </button>
            {/* Dark mode */}
            <button onClick={() => setDarkMode(d => !d)}
              style={{
                width: 34, height: 34, borderRadius: 10, border: `1px solid ${border}`,
                background: "transparent", cursor: "pointer", fontSize: 17,
              }}>
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px 12px 80px" : "28px 24px" }}>
        <AnimatePresence mode="wait">

          {/* ═══ USER PANEL ═══════════════════════════════════════════════ */}
          {activeTab === "user" && (
            <motion.div key="user" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14, marginBottom: isMobile ? 16 : 24 }}>
                <StatCard icon="🎟️" label="Disponibles" value={available} color="#6366F1" darkMode={darkMode} />
                <StatCard icon="✅" label="Pagados" value={soldNumbers.length} color="#10B981" darkMode={darkMode} />
                <StatCard icon="⏳" label="Reservados" value={reservedNumbers.length} color="#F59E0B" darkMode={darkMode} />
                <StatCard icon="💰" label="Precio" value={`$${rifaConfig.ticketPrice.toLocaleString()}`} color="#8B5CF6" darkMode={darkMode} />
              </div>

              {/* Main grid area */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 16 }}>
                {/* Number Grid */}
                <div style={{ background: surface, borderRadius: 16, padding: isMobile ? 14 : 24, border: `1px solid ${border}` }}>
                  <div style={{ marginBottom: 16 }}>
                    <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>Grilla de Números</h2>
                  </div>
                  <NumberGrid
                    totalNumbers={rifaConfig.totalNumbers}
                    tickets={tickets}
                    selectedNums={selectedNums}
                    onToggle={toggleNumber}
                    darkMode={darkMode}
                    currentUserId={currentUserId}
                  />
                  <GridLegend darkMode={darkMode} />
                </div>

                {/* Selection Panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Random picker */}
                  <div style={{ background: surface, borderRadius: 16, padding: 20, border: `1px solid ${border}` }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, marginTop: 0 }}>🎲 Selección Aleatoria</h3>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {[1, 2, 3, 5].map(n => (
                        <button key={n} onClick={() => setRandomCount(n)}
                          style={{
                            flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 700,
                            cursor: "pointer", border: `2px solid ${randomCount === n ? "#6366F1" : border}`,
                            background: randomCount === n ? "#6366F1" : "transparent",
                            color: randomCount === n ? "white" : textSecondary,
                          }}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <button onClick={pickRandom}
                      style={{
                        width: "100%", padding: "10px 0", borderRadius: 10,
                        fontWeight: 700, fontSize: 13, cursor: "pointer",
                        background: darkMode ? "#1E293B" : "#F1F5F9",
                        border: `1px solid ${border}`, color: textPrimary,
                      }}>
                      🎯 Elegir {randomCount} al azar
                    </button>
                  </div>

                  {/* Cart */}
                  <div style={{ background: surface, borderRadius: 16, padding: 20, border: `1px solid ${border}`, flex: 1 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, marginTop: 0 }}>
                      🛒 Carrito ({selectedNums.length})
                    </h3>
                    {selectedNums.length === 0 ? (
                      <p style={{ color: textSecondary, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                        Seleccioná números de la grilla
                      </p>
                    ) : (
                      <>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                          {selectedNums.sort((a, b) => a - b).map(n => (
                            <motion.span key={n} initial={{ scale: 0 }} animate={{ scale: 1 }}
                              onClick={() => toggleNumber(n)}
                              style={{
                                padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                                background: "#6366F1", color: "white", cursor: "pointer",
                              }}>
                              #{pad(n, rifaConfig.totalNumbers)} ×
                            </motion.span>
                          ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                          <span style={{ color: textSecondary, fontSize: 13 }}>Total:</span>
                          <span style={{ fontWeight: 800, fontSize: 16 }}>${totalPrice.toLocaleString()}</span>
                        </div>
                        <button onClick={reserveNumbers}
                          style={{
                            width: "100%", padding: "12px 0", borderRadius: 10,
                            fontWeight: 800, fontSize: 14, cursor: "pointer", border: "none",
                            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                            color: "white",
                            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                          }}>
                          Reservar Números
                        </button>
                      </>
                    )}
                  </div>

                  {/* Payment info */}
                  <div style={{
                    background: darkMode ? "#1E293B" : "#EEF2FF",
                    borderRadius: 14, padding: 16,
                    border: `1px solid ${darkMode ? "#334155" : "#C7D2FE"}`,
                  }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, marginTop: 0, color: "#6366F1" }}>
                      💳 Datos de Pago
                    </p>
                    <p style={{ fontSize: 12, color: textSecondary, margin: "4px 0" }}>
                      Alias: <strong style={{ color: textPrimary }}>{rifaConfig.payment.mercadoPagoAlias}</strong>
                    </p>
                    <p style={{ fontSize: 12, color: textSecondary, margin: "4px 0" }}>
                      {rifaConfig.payment.instructions}
                    </p>
                    <a href={rifaConfig.payment.mercadoPagoLink} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "block", marginTop: 10, padding: "8px 0", borderRadius: 8,
                        textAlign: "center", fontSize: 12, fontWeight: 700,
                        background: "#009EE3", color: "white", textDecoration: "none",
                      }}>
                      Pagar con Mercado Pago →
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ HISTORIAL ═══════════════════════════════════════════════ */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>📋 Mis Tickets</h2>
              {myTickets.length === 0 ? (
                <div style={{
                  background: surface, borderRadius: 16, padding: 48, textAlign: "center",
                  border: `1px solid ${border}`,
                }}>
                  <p style={{ fontSize: 48, marginBottom: 12 }}>🎟️</p>
                  <p style={{ color: textSecondary, fontSize: 15 }}>No tenés tickets aún. ¡Comprá números!</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {myTickets.map(t => (
                    <motion.div key={t.number} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      style={{
                        background: surface, borderRadius: 14, padding: 20,
                        border: `2px solid ${t.status === "paid" ? "#10B981" : "#F59E0B"}`,
                      }}>
                      <p style={{ fontSize: 32, fontWeight: 900, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                        #{pad(t.number, rifaConfig.totalNumbers)}
                      </p>
                      <span style={{
                        display: "inline-block", marginTop: 8, padding: "3px 10px", borderRadius: 6,
                        fontSize: 11, fontWeight: 700,
                        background: t.status === "paid" ? "#DCFCE7" : "#FEF3C7",
                        color: t.status === "paid" ? "#166534" : "#92400E",
                      }}>
                        {t.status === "paid" ? "✅ Pagado" : "⏳ Pendiente"}
                      </span>
                      <p style={{ fontSize: 13, color: textSecondary, marginTop: 8, marginBottom: 0 }}>
                        ${rifaConfig.ticketPrice.toLocaleString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ ADMIN PANEL ══════════════════════════════════════════════ */}
          {activeTab === "admin" && (
            <motion.div key="admin" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14, marginBottom: isMobile ? 16 : 24 }}>
                <StatCard icon="💰" label="Recaudado" value={`$${revenue.toLocaleString()}`} color="#10B981" darkMode={darkMode} />
                <StatCard icon="✅" label="Pagados" value={soldNumbers.length} color="#6366F1" darkMode={darkMode} />
                <StatCard icon="⏳" label="Reservados" value={reservedNumbers.length} color="#F59E0B" darkMode={darkMode} />
                <StatCard icon="📊" label="Vendido" value={`${Math.round((rifaConfig.totalNumbers - available) / rifaConfig.totalNumbers * 100)}%`} color="#8B5CF6" darkMode={darkMode} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                {/* Raffle Config */}
                <div style={{ background: surface, borderRadius: 16, padding: 24, border: `1px solid ${border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>⚙️ Configuración</h3>
                    <button onClick={() => editConfig ? saveConfig() : setEditConfig(true)}
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                        border: "none", cursor: "pointer",
                        background: editConfig ? "#10B981" : "#6366F1",
                        color: "white",
                      }}>
                      {editConfig ? "💾 Guardar" : "✏️ Editar"}
                    </button>
                  </div>

                  {editConfig ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { label: "Título", key: "title", type: "text" },
                        { label: "Total Números", key: "totalNumbers", type: "number" },
                        { label: "Precio por Ticket ($)", key: "ticketPrice", type: "number" },
                        { label: "Cantidad de Premios", key: "numberOfPrizes", type: "number" },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ fontSize: 12, color: textSecondary, display: "block", marginBottom: 4 }}>{f.label}</label>
                          <input type={f.type} value={configDraft[f.key] ?? ""}
                            min={f.key === "numberOfPrizes" ? 1 : undefined}
                            onChange={e => setConfigDraft(d => ({ ...d, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                            style={{
                              width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 14,
                              background: surfaceAlt, border: `1px solid ${border}`, color: textPrimary,
                              boxSizing: "border-box",
                            }} />
                          {f.key === "numberOfPrizes" && (
                            <p style={{ fontSize: 11, color: textSecondary, margin: "4px 0 0" }}>
                              Se sortea del último al primero (2do premio → 1er premio).
                            </p>
                          )}
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize: 12, color: textSecondary, display: "block", marginBottom: 4 }}>Alias MP</label>
                        <input value={configDraft.payment.mercadoPagoAlias}
                          onChange={e => setConfigDraft(d => ({ ...d, payment: { ...d.payment, mercadoPagoAlias: e.target.value } }))}
                          style={{
                            width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 14,
                            background: surfaceAlt, border: `1px solid ${border}`, color: textPrimary,
                            boxSizing: "border-box",
                          }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        ["Título", rifaConfig.title],
                        ["Total Números", rifaConfig.totalNumbers],
                        ["Precio Ticket", `$${rifaConfig.ticketPrice.toLocaleString()}`],
                        ["Premios a sortear", rifaConfig.numberOfPrizes],
                        ["Alias MP", rifaConfig.payment.mercadoPagoAlias],
                        ["Estado", rifaConfig.status.toUpperCase()],
                      ].map(([label, val]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, color: textSecondary }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reset rifa — danger zone */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${darkMode ? "#7F1D1D" : "#FEE2E2"}` }}>
                    <p style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, marginBottom: 8, marginTop: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ⚠️ Zona Peligrosa
                    </p>
                    <button onClick={() => setShowResetModal(true)}
                      style={{
                        width: "100%", padding: "10px 0", borderRadius: 10,
                        fontWeight: 700, fontSize: 13, cursor: "pointer",
                        background: "transparent",
                        border: "2px solid #EF4444", color: "#EF4444",
                        transition: "all 0.15s",
                      }}>
                      🗑️ Reiniciar Rifa
                    </button>
                    <p style={{ fontSize: 11, color: textSecondary, margin: "6px 0 0", textAlign: "center" }}>
                      Borra todos los tickets y el ganador.
                    </p>
                  </div>
                </div>

                {/* Ticket Management */}
                <div style={{ background: surface, borderRadius: 16, padding: isMobile ? 14 : 24, border: `1px solid ${border}` }}>
                  <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, marginTop: 0 }}>🎟️ Gestión de Tickets</h3>

                  {/* Inline edit form — desktop only; mobile uses bottom sheet modal */}
                  {!isMobile && (
                    <AnimatePresence>
                      {adminEdit && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{
                            padding: 16, borderRadius: 12, marginBottom: 16,
                            background: darkMode ? "#1E293B" : "#EEF2FF",
                            border: "2px solid #6366F1",
                          }}>
                          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, marginTop: 0 }}>
                            ✏️ Reasignar #{pad(adminEdit, rifaConfig.totalNumbers)}
                          </p>
                          <input placeholder="Nuevo nombre"
                            value={editForm.userName}
                            onChange={e => setEditForm(f => ({ ...f, userName: e.target.value }))}
                            style={{
                              width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 13,
                              background: surfaceAlt, border: `1px solid ${border}`, color: textPrimary,
                              marginBottom: 8, boxSizing: "border-box",
                            }} />
                          <input placeholder="Email (opcional)"
                            value={editForm.userEmail || ""}
                            onChange={e => setEditForm(f => ({ ...f, userEmail: e.target.value }))}
                            style={{
                              width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 13,
                              background: surfaceAlt, border: `1px solid ${border}`, color: textPrimary,
                              marginBottom: 8, boxSizing: "border-box",
                            }} />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={saveReassign}
                              style={{ flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", background: "#6366F1", color: "white", cursor: "pointer" }}>
                              Guardar
                            </button>
                            <button onClick={() => setAdminEdit(null)}
                              style={{ flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12, fontWeight: 700, border: `1px solid ${border}`, background: "transparent", color: textPrimary, cursor: "pointer" }}>
                              Cancelar
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  <div style={{ maxHeight: isMobile ? "none" : 340, overflowY: isMobile ? "visible" : "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.values(tickets).sort((a, b) => a.number - b.number).map(t => (
                      <div key={t.number} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "12px 10px" : "10px 12px",
                        borderRadius: 10, background: surfaceAlt, border: `1px solid ${border}`,
                      }}>
                        <span style={{ fontWeight: 800, fontSize: 14, minWidth: 38, fontVariantNumeric: "tabular-nums" }}>
                          #{pad(t.number, rifaConfig.totalNumbers)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.userName}</p>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                            background: t.status === "paid" ? "#DCFCE7" : "#FEF3C7",
                            color: t.status === "paid" ? "#166534" : "#92400E",
                          }}>
                            {t.status === "paid" ? "✅ Pagado" : "⏳ Reservado"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {t.status === "reserved" && (
                            <button onClick={() => confirmPayment(t.number)}
                              title="Confirmar pago"
                              style={{ padding: "6px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", background: "#10B981", color: "white", cursor: "pointer" }}>
                              ✅
                            </button>
                          )}
                          <button
                            title="Reasignar"
                            onClick={() => {
                              setAdminEdit(t.number);
                              setEditForm({ userName: t.userName, userEmail: t.userEmail || "" });
                              if (isMobile) setShowReassignModal(true);
                            }}
                            style={{ padding: "6px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", background: "#6366F1", color: "white", cursor: "pointer" }}>
                            ✏️
                          </button>
                          <button
                            title="Liberar número"
                            onClick={() => releaseNumber(t.number)}
                            style={{ padding: "6px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", background: "#EF4444", color: "white", cursor: "pointer" }}>
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                    {Object.keys(tickets).length === 0 && (
                      <p style={{ textAlign: "center", color: textSecondary, padding: 24, fontSize: 13 }}>
                        No hay tickets registrados aún.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Draw Results — shown when at least one prize has been drawn */}
              {drawResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: surface, borderRadius: 16, padding: isMobile ? 14 : 24, border: `2px solid #F59E0B`, marginTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>🏆 Resultados del Sorteo</h3>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                      background: drawResults.length >= rifaConfig.numberOfPrizes ? "#10B981" : "#F59E0B",
                      color: "white",
                    }}>
                      {drawResults.length}/{rifaConfig.numberOfPrizes} premios
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...drawResults].sort((a, b) => a.prizeNumber - b.prizeNumber).map(r => (
                      <div key={r.number} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                        borderRadius: 12, background: surfaceAlt, border: `1px solid ${border}`,
                      }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{r.prizeLabel.split(" ")[0]}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {r.prizeLabel.replace(/^\S+\s/, "")}
                          </p>
                          <p style={{ fontSize: 14, fontWeight: 700, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.userName}
                          </p>
                          {r.userEmail && (
                            <p style={{ fontSize: 12, color: textSecondary, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.userEmail}
                            </p>
                          )}
                        </div>
                        <span style={{
                          fontSize: 18, fontWeight: 900, fontVariantNumeric: "tabular-nums",
                          color: "#F59E0B", letterSpacing: "-1px", flexShrink: 0,
                        }}>
                          #{pad(r.number, rifaConfig.totalNumbers)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══ DRAW / BOLILLERO ═══════════════════════════════════════ */}
          {activeTab === "draw" && (() => {
            const totalPrizes = rifaConfig.numberOfPrizes;
            const allPrizesDrawn = drawResults.length >= totalPrizes;
            const nextPrizeNumber = totalPrizes - drawResults.length; // counting down (e.g., 2, then 1)
            const nextPrizeLabel = getPrizeLabel(nextPrizeNumber);
            const alreadyDrawnNums = drawResults.map(r => r.number);
            const availableForDraw = soldNumbers.filter(n => !alreadyDrawnNums.includes(n));
            const latestResult = drawResults[drawResults.length - 1];

            return (
              <motion.div key="draw" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 20, width: "100%", maxWidth: 520, margin: "0 auto" }}>

                {/* Title */}
                <div style={{ textAlign: "center" }}>
                  <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, margin: 0 }}>🎰 Sorteo en Vivo</h2>
                  <p style={{ color: textSecondary, marginTop: 6, fontSize: 14 }}>
                    {soldNumbers.length} número{soldNumbers.length !== 1 ? "s" : ""} pagado{soldNumbers.length !== 1 ? "s" : ""} participan
                    {totalPrizes > 1 && ` · ${totalPrizes} premios`}
                  </p>
                </div>

                {/* Previous draws strip */}
                {drawResults.length > 0 && (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: textSecondary, margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Premios ya sorteados
                    </p>
                    {[...drawResults].reverse().map((r, i) => (
                      <motion.div key={r.number} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                          borderRadius: 12, background: surface, border: `1px solid ${border}`,
                        }}>
                        <span style={{ fontSize: 18 }}>{r.prizeLabel.split(" ")[0]}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: textSecondary, margin: 0 }}>{r.prizeLabel.replace(/^\S+\s/, "")}</p>
                          <p style={{ fontSize: 14, fontWeight: 800, margin: "2px 0 0" }}>
                            {r.userName}
                            {r.userEmail && <span style={{ fontWeight: 500, color: textSecondary, fontSize: 12 }}> · {r.userEmail}</span>}
                          </p>
                        </div>
                        <span style={{
                          fontSize: 16, fontWeight: 900, fontVariantNumeric: "tabular-nums",
                          color: "#F59E0B", letterSpacing: "-1px",
                        }}>#{pad(r.number, rifaConfig.totalNumbers)}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Bolillero card — hidden once all prizes are drawn */}
                {!allPrizesDrawn && (
                  <>
                    {totalPrizes > 1 && (
                      <div style={{
                        padding: "6px 18px", borderRadius: 100,
                        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                        color: "white", fontSize: 13, fontWeight: 700,
                      }}>
                        Sorteando: {nextPrizeLabel}
                      </div>
                    )}
                    <div style={{
                      background: surface, borderRadius: 24,
                      padding: isMobile ? "24px 16px" : 40,
                      border: `2px solid ${border}`,
                      boxShadow: darkMode ? "0 20px 60px rgba(0,0,0,0.5)" : "0 20px 60px rgba(0,0,0,0.08)",
                      width: "100%",
                    }}>
                      <Bolillero
                        key={bolilleroKey}
                        soldNumbers={availableForDraw}
                        onStartDraw={executeDraw}
                        onComplete={handleDrawComplete}
                        darkMode={darkMode}
                      />
                    </div>
                  </>
                )}

                {/* Winner card — appears AFTER bolillero animation completes */}
                <AnimatePresence>
                  {showWinnerCard && latestResult && (
                    <motion.div
                      key={`winner-${latestResult.number}`}
                      initial={{ opacity: 0, scale: 0.88, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                      style={{
                        position: "relative", borderRadius: 24,
                        padding: isMobile ? "24px 20px" : "32px 48px",
                        textAlign: "center", overflow: "hidden", width: "100%",
                        background: darkMode
                          ? "linear-gradient(135deg, #1C1207 0%, #292001 50%, #1a1a00 100%)"
                          : "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)",
                        boxShadow: "0 0 0 2px #F59E0B, 0 16px 60px rgba(245,158,11,0.35), 0 4px 20px rgba(0,0,0,0.2)",
                      }}>
                      {/* Pulsing border glow */}
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        style={{ position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none", boxShadow: "inset 0 0 40px rgba(245,158,11,0.25)" }} />
                      {/* Sparkles */}
                      <div style={{ position: "absolute", top: 12, left: 18, fontSize: 18, opacity: 0.6 }}>✨</div>
                      <div style={{ position: "absolute", top: 12, right: 18, fontSize: 18, opacity: 0.6 }}>✨</div>

                      {/* Prize label */}
                      {totalPrizes > 1 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                          style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
                          {latestResult.prizeLabel}
                        </motion.p>
                      )}

                      {/* Trophy */}
                      <motion.div animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ fontSize: 52, marginBottom: 4 }}>🏆</motion.div>

                      {/* Winner name */}
                      <motion.p initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 220 }}
                        style={{
                          fontWeight: 900, fontSize: isMobile ? 22 : 26, margin: "6px 0 0",
                          background: "linear-gradient(135deg, #F59E0B, #EF4444)",
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                          letterSpacing: "-0.5px",
                        }}>
                        ¡{latestResult.userName} gana!
                      </motion.p>
                      {latestResult.userEmail && (
                        <p style={{ fontSize: 12, color: darkMode ? "#FCD34D" : "#92400E", margin: "4px 0 0", opacity: 0.8 }}>
                          {latestResult.userEmail}
                        </p>
                      )}

                      {/* Number badge */}
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                        style={{ marginTop: 14, display: "inline-block" }}>
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 100,
                          background: darkMode ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.22)",
                          border: "1.5px solid rgba(245,158,11,0.5)",
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: darkMode ? "#FCD34D" : "#92400E" }}>Número</span>
                          <span style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: darkMode ? "#FBBF24" : "#78350F", letterSpacing: "-1px" }}>
                            #{pad(latestResult.number, rifaConfig.totalNumbers)}
                          </span>
                        </div>
                      </motion.div>

                      {/* Next draw button */}
                      {!allPrizesDrawn && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                          style={{ marginTop: 20 }}>
                          <button onClick={() => {
                            setShowWinnerCard(false);
                            setBolilleroKey(k => k + 1);
                          }}
                            style={{
                              padding: "12px 28px", borderRadius: 12, fontWeight: 800, fontSize: 14,
                              cursor: "pointer", border: "none",
                              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                              color: "white", boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
                            }}>
                            🎰 Sortear {getPrizeLabel(nextPrizeNumber)}
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* All prizes done message */}
                {allPrizesDrawn && !showWinnerCard && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{
                      padding: "16px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: "center",
                      background: darkMode ? "#14532D" : "#DCFCE7", color: darkMode ? "#86EFAC" : "#166534",
                      border: `1px solid ${darkMode ? "#166534" : "#86EFAC"}`,
                    }}>
                    🎊 ¡Todos los premios fueron sorteados!
                  </motion.div>
                )}

                {soldNumbers.length === 0 && (
                  <div style={{
                    padding: "16px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                    background: darkMode ? "#1E293B" : "#FEF3C7",
                    color: darkMode ? "#FCD34D" : "#92400E",
                    border: `1px solid ${darkMode ? "#92400E" : "#FCD34D"}`,
                  }}>
                    ⚠️ No hay números con pago confirmado. Confirmá pagos en el panel Admin primero.
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <AnimatePresence>
        {isMobile && (
          <motion.nav
            initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              background: surface, borderTop: `1px solid ${border}`,
              display: "flex", alignItems: "stretch",
              zIndex: 200, paddingBottom: "env(safe-area-inset-bottom)",
            }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 1, padding: "10px 8px 8px", border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3,
                  borderTop: activeTab === t.id ? "2.5px solid #6366F1" : "2.5px solid transparent",
                }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: activeTab === t.id ? "#6366F1" : textSecondary,
                }}>{t.mobileLabel}</span>
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Reset Rifa Confirmation Modal ── */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowResetModal(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
              display: "flex", alignItems: isMobile ? "flex-end" : "center",
              justifyContent: "center", zIndex: 600, padding: isMobile ? 0 : 24,
            }}>
            <motion.div
              initial={isMobile ? { y: "100%" } : { scale: 0.88, y: 20 }}
              animate={isMobile ? { y: 0 } : { scale: 1, y: 0 }}
              exit={isMobile ? { y: "100%" } : { scale: 0.88, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: surface, borderRadius: isMobile ? "20px 20px 0 0" : 20,
                padding: isMobile ? "28px 24px 40px" : "32px 36px",
                width: isMobile ? "100%" : 420,
                border: `1px solid ${border}`,
              }}>
              {isMobile && (
                <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? "#475569" : "#CBD5E1", margin: "0 auto 20px" }} />
              )}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <p style={{ fontSize: 44, margin: "0 0 8px" }}>⚠️</p>
                <h3 style={{ fontWeight: 800, fontSize: 20, margin: "0 0 8px", color: "#EF4444" }}>Reiniciar Rifa</h3>
                <p style={{ color: textSecondary, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  ¿Estás seguro? Esta acción va a borrar <strong style={{ color: textPrimary }}>todos los tickets</strong> y el ganador registrado. No se puede deshacer.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowResetModal(false)}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: 12,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    border: `1px solid ${border}`, background: "transparent",
                    color: textPrimary,
                  }}>
                  Cancelar
                </button>
                <button onClick={resetRifa}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: 12,
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    border: "none", background: "#EF4444", color: "white",
                    boxShadow: "0 4px 16px rgba(239,68,68,0.35)",
                  }}>
                  🗑️ Reiniciar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reassign Modal (mobile bottom sheet) ── */}
      <AnimatePresence>
        {showReassignModal && adminEdit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowReassignModal(false); setAdminEdit(null); }}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              zIndex: 600,
            }}>
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: surface, borderRadius: "20px 20px 0 0",
                padding: "28px 24px 40px", width: "100%",
                border: `1px solid ${border}`,
              }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? "#475569" : "#CBD5E1", margin: "0 auto 20px" }} />
              <p style={{ fontWeight: 800, fontSize: 17, marginBottom: 18, marginTop: 0 }}>
                ✏️ Reasignar #{pad(adminEdit, rifaConfig.totalNumbers)}
              </p>
              <label style={{ fontSize: 12, color: textSecondary, display: "block", marginBottom: 6, fontWeight: 600 }}>Nombre</label>
              <input
                placeholder="Nombre del comprador"
                value={editForm.userName}
                onChange={e => setEditForm(f => ({ ...f, userName: e.target.value }))}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
                  background: surfaceAlt, border: `1px solid ${border}`, color: textPrimary,
                  marginBottom: 14, boxSizing: "border-box",
                }} />
              <label style={{ fontSize: 12, color: textSecondary, display: "block", marginBottom: 6, fontWeight: 600 }}>Email (opcional)</label>
              <input
                placeholder="email@ejemplo.com"
                value={editForm.userEmail || ""}
                onChange={e => setEditForm(f => ({ ...f, userEmail: e.target.value }))}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
                  background: surfaceAlt, border: `1px solid ${border}`, color: textPrimary,
                  marginBottom: 20, boxSizing: "border-box",
                }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowReassignModal(false); setAdminEdit(null); }}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: 12,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    border: `1px solid ${border}`, background: "transparent", color: textPrimary,
                  }}>
                  Cancelar
                </button>
                <button onClick={() => { saveReassign(); setShowReassignModal(false); }}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: 12,
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    border: "none", background: "#6366F1", color: "white",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                  }}>
                  💾 Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pay Modal ── */}
      <AnimatePresence>
        {showPayModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPayModal(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 500, padding: 24,
            }}>
            <motion.div
              initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: surface, borderRadius: 20, padding: 32, maxWidth: 400, width: "100%",
                border: `1px solid ${border}`,
              }}>
              <p style={{ fontSize: 36, textAlign: "center", margin: 0 }}>💳</p>
              <h3 style={{ textAlign: "center", fontWeight: 800, fontSize: 20, marginTop: 12 }}>¡Reserva Exitosa!</h3>
              <p style={{ color: textSecondary, textAlign: "center", fontSize: 14, marginTop: 8 }}>
                Tus números fueron reservados. Completá el pago para confirmarlos.
              </p>
              <div style={{
                marginTop: 20, padding: 16, borderRadius: 12,
                background: darkMode ? "#1E293B" : "#EEF2FF",
                border: `1px solid ${darkMode ? "#334155" : "#C7D2FE"}`,
              }}>
                <p style={{ fontSize: 13, margin: "4px 0", fontWeight: 600 }}>
                  Alias: <span style={{ color: "#6366F1" }}>{rifaConfig.payment.mercadoPagoAlias}</span>
                </p>
                <p style={{ fontSize: 12, color: textSecondary, margin: "4px 0" }}>
                  {rifaConfig.payment.instructions}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <a href={rifaConfig.payment.mercadoPagoLink} target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 10, textAlign: "center",
                    fontWeight: 700, fontSize: 14, background: "#009EE3", color: "white",
                    textDecoration: "none", display: "block",
                  }}>
                  Pagar con MP
                </a>
                <button onClick={() => setShowPayModal(false)}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 10,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    border: `1px solid ${border}`, background: "transparent",
                    color: textPrimary,
                  }}>
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
