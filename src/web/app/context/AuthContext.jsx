"use client";

/**
 * AuthContext.jsx — Contexto de autenticación para Sembrar Rifa
 *
 * Provee:
 *   user          → objeto FirebaseUser (null si no está logueado)
 *   userProfile   → datos extendidos desde Firestore (rol, nombre, etc.)
 *   loading       → true mientras se resuelve el estado inicial de auth
 *   isAdmin       → true si userProfile.role === "admin"
 *   loginWithGoogle()
 *   loginWithEmail(email, password)
 *   registerWithEmail(email, password, displayName)
 *   logout()
 */

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

const AuthContext = createContext(null);

// ─── AuthProvider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]         = useState(true);

  // Crea o lee el perfil del usuario en Firestore
  // (declarado antes del useEffect que lo usa para evitar acceso antes de declaración)
  async function syncUserProfile(firebaseUser) {
    const ref  = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setUserProfile(snap.data());
    } else {
      // Primera vez que inicia sesión → crear documento con rol "user"
      const profile = {
        uid:         firebaseUser.uid,
        email:       firebaseUser.email,
        displayName: firebaseUser.displayName || "",
        photoURL:    firebaseUser.photoURL    || "",
        role:        "user",
        createdAt:   serverTimestamp(),
      };
      await setDoc(ref, profile);
      setUserProfile(profile);
    }
  }

  // Escuchar cambios en el estado de auth de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await syncUserProfile(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Métodos de auth ──

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }

  async function loginWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async function registerWithEmail(email, password, displayName, phone = "") {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Actualizar displayName en Firebase Auth
    await updateProfile(result.user, { displayName });

    // Crear documento en Firestore
    await setDoc(doc(db, "users", result.user.uid), {
      uid:         result.user.uid,
      email:       email,
      displayName: displayName,
      photoURL:    "",
      phone:       phone,
      role:        "user",
      createdAt:   serverTimestamp(),
    });

    // Recargar el perfil actualizado
    await syncUserProfile(result.user);
    return result.user;
  }

  function logout() {
    return signOut(auth);
  }

  const isAdmin = userProfile?.role === "admin";

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isAdmin,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
