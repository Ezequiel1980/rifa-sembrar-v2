"use client";

/**
 * AuthGuard.jsx — Protege rutas que requieren autenticación.
 * Si el usuario no está logueado, redirige a /login.
 * Si está cargando, muestra un spinner de pantalla completa.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0F172A",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid rgba(99,102,241,0.25)",
          borderTopColor: "#6366F1",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null; // redirigiendo…

  return children;
}
