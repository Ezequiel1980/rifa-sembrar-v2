"use client";

/**
 * app/login/page.jsx — Página de login/registro de Sembrar Rifa
 * Mobile-first. Soporta Google Sign-In y email + contraseña.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function LoginPage() {
  const { user, loading, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const router = useRouter();

  const [mode, setMode]         = useState("login"); // "login" | "register"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingUid, setPendingUid]         = useState(null);
  const [phoneInput, setPhoneInput]         = useState("");
  const [phoneBusy, setPhoneBusy]           = useState(false);

  // Si ya está logueado, redirigir al inicio
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  if (loading || user) return <FullScreenSpinner />;

  // ── Handlers ──

  async function handleGoogle() {
    setError("");
    setBusy(true);
    try {
      const firebaseUser = await loginWithGoogle();
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!snap.exists() || !snap.data().phone) {
        setPendingUid(firebaseUser.uid);
        setShowPhoneModal(true);
        setBusy(false);
        return;
      }
      router.replace("/");
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setBusy(false);
    }
  }

  async function handleSavePhone() {
    if (!phoneInput.trim()) return;
    setPhoneBusy(true);
    try {
      await updateDoc(doc(db, "users", pendingUid), { phone: phoneInput.trim() });
      router.replace("/");
    } catch {
      // silent — redirect anyway
      router.replace("/");
    } finally {
      setPhoneBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) { setError("Ingresá tu nombre."); setBusy(false); return; }
        await registerWithEmail(email, password, name.trim(), phone.trim());
      }
      router.replace("/");
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setBusy(false);
    }
  }

  // ── Render ──

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #0F172A 0%, #1E1B4B 60%, #0F172A 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{
          width: "100%", maxWidth: 400,
          background: "#1E293B",
          borderRadius: 24,
          padding: "36px 28px",
          border: "1px solid #334155",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99,102,241,0.45)",
          }}>
            <svg width="34" height="34" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="lgLogin" cx="36%" cy="30%" r="68%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98"/>
                  <stop offset="30%" stopColor="#C7D2FE"/>
                  <stop offset="100%" stopColor="#3730A3"/>
                </radialGradient>
              </defs>
              <circle cx="50" cy="53" r="44" fill="rgba(0,0,0,0.18)" />
              <circle cx="50" cy="50" r="44" fill="url(#lgLogin)" />
              <path d="M 8 44 Q 50 32 92 44 L 92 56 Q 50 68 8 56 Z" fill="white" opacity="0.22"/>
              <ellipse cx="34" cy="27" rx="14" ry="9" fill="white" opacity="0.7"/>
              <circle cx="50" cy="50" r="44" fill="none" stroke="#312E81" strokeWidth="1.5" opacity="0.35"/>
            </svg>
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 22, color: "#F1F5F9", margin: 0 }}>
            Sembrar Rifa
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
            {mode === "login" ? "Iniciá sesión para continuar" : "Creá tu cuenta"}
          </p>
        </div>

        {/* Google button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogle}
          disabled={busy}
          style={{
            width: "100%", padding: "13px 0",
            borderRadius: 12, border: "1px solid #475569",
            background: busy ? "#1F2937" : "#0F172A",
            color: "#F1F5F9", fontSize: 14, fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "background 0.15s",
            marginBottom: 20,
          }}
        >
          {busy ? (
            <Spinner />
          ) : (
            <>
              <GoogleIcon />
              Continuar con Google
            </>
          )}
        </motion.button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#334155" }} />
          <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>o</span>
          <div style={{ flex: 1, height: 1, background: "#334155" }} />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <AnimatePresence>
            {mode === "register" && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: 12 }}
              >
                <input
                  type="text"
                  placeholder="Tu nombre y apellido"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={mode === "register"}
                  style={inputStyle}
                />
                <input
                  type="tel"
                  placeholder="Número de contacto (ej: +54 9 11 1234-5678)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  fontSize: 13, color: "#F87171", fontWeight: 500,
                  background: "rgba(239,68,68,0.1)", borderRadius: 8,
                  padding: "8px 12px", margin: 0,
                }}
              >
                ⚠️ {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={busy}
            style={{
              width: "100%", padding: "13px 0",
              borderRadius: 12, border: "none",
              background: busy
                ? "#4F46E5"
                : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "white", fontSize: 14, fontWeight: 800,
              cursor: busy ? "not-allowed" : "pointer",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {busy ? <Spinner /> : (mode === "login" ? "Iniciar sesión" : "Crear cuenta")}
          </motion.button>
        </form>

        {/* Toggle mode */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#64748B", marginTop: 20, marginBottom: 0 }}>
          {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
          <button
            onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#818CF8", fontWeight: 700, fontSize: 13, padding: 0,
            }}
          >
            {mode === "login" ? "Registrate" : "Iniciá sesión"}
          </button>
        </p>
      </motion.div>

      {/* Phone Modal — appears after Google login if phone is missing */}
      <AnimatePresence>
        {showPhoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px 16px", zIndex: 999,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              style={{
                width: "100%", maxWidth: 380,
                background: "#1E293B",
                borderRadius: 20,
                padding: "32px 28px",
                border: "1px solid #334155",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <p style={{ fontSize: 42, margin: "0 0 10px" }}>📱</p>
                <h2 style={{ fontWeight: 900, fontSize: 20, color: "#F1F5F9", margin: "0 0 8px" }}>
                  ¿Cuál es tu número?
                </h2>
                <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                  Ingresá tu número de contacto para que podamos comunicarnos si ganás.
                </p>
              </div>
              <input
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSavePhone()}
                autoFocus
                style={{ ...inputStyle, marginBottom: 16, fontSize: 15 }}
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSavePhone}
                disabled={phoneBusy}
                style={{
                  width: "100%", padding: "13px 0",
                  borderRadius: 12, border: "none",
                  background: phoneBusy ? "#4F46E5" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  color: "white", fontSize: 14, fontWeight: 800,
                  cursor: phoneBusy ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginBottom: 10,
                }}
              >
                {phoneBusy ? <Spinner /> : "Guardar y continuar"}
              </motion.button>
              <button
                onClick={() => router.replace("/")}
                style={{
                  width: "100%", padding: "10px 0",
                  background: "none", border: "none",
                  color: "#64748B", fontSize: 13, cursor: "pointer", fontWeight: 500,
                }}
              >
                Omitir por ahora
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FullScreenSpinner() {
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0F172A",
    }}>
      <Spinner size={32} color="#6366F1" />
    </div>
  );
}

function Spinner({ size = 18, color = "white" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2.5px solid ${color}33`,
      borderTopColor: color,
      animation: "spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%", padding: "12px 14px",
  borderRadius: 10, border: "1px solid #334155",
  background: "#0F172A", color: "#F1F5F9",
  fontSize: 14, outline: "none",
  boxSizing: "border-box",
};

// ─── Error messages ───────────────────────────────────────────────────────────

function friendlyError(code) {
  const map = {
    "auth/email-already-in-use":   "Ese email ya está registrado. Iniciá sesión.",
    "auth/invalid-email":           "El email no es válido.",
    "auth/weak-password":           "La contraseña debe tener al menos 6 caracteres.",
    "auth/user-not-found":          "No encontramos una cuenta con ese email.",
    "auth/wrong-password":          "Contraseña incorrecta.",
    "auth/invalid-credential":      "Email o contraseña incorrectos.",
    "auth/popup-closed-by-user":    "Cerraste la ventana de Google antes de completar.",
    "auth/network-request-failed":  "Error de red. Verificá tu conexión.",
    "auth/too-many-requests":       "Demasiados intentos. Esperá un momento.",
  };
  return map[code] || `Error inesperado (${code})`;
}
