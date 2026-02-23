"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = "login" | "register";

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  // Form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reset form saat modal dibuka/tutup atau mode berubah
  useEffect(() => {
    setUsername("");
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
    setShowPassword(false);
  }, [isOpen, mode]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll saat modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(username, password);
        setSuccess("Login berhasil! Selamat datang kembali 👋");
        setTimeout(onClose, 1000);
      } else {
        if (password.length < 6) {
          throw new Error("Password minimal 6 karakter");
        }
        await register(username, email, password);
        setSuccess("Registrasi berhasil! Selamat datang 🎉");
        setTimeout(onClose, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card-bg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {mode === "login" ? "Masuk ke KomikHub" : "Daftar KomikHub"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {mode === "login"
                ? "Baca manga favoritmu kapan saja"
                : "Gratis! Tidak ada iklan 🎉"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === "login"
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === "register"
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Error / Success alert */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-800/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-400">
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="contoh: otaku123"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Email — hanya untuk register */}
          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimal 6 karakter" : "••••••••"}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !!success}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {mode === "login" ? "Masuk..." : "Mendaftar..."}
              </span>
            ) : mode === "login" ? (
              "🚀 Masuk"
            ) : (
              "✨ Daftar Sekarang"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 text-center text-xs text-muted">
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                onClick={() => setMode("register")}
                className="font-semibold text-accent hover:underline"
              >
                Daftar gratis
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-semibold text-accent hover:underline"
              >
                Masuk di sini
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}