"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/app/lib/auth";
import LoginModal from "@/app/components/LoginModal";

export default function Header() {
  const { user, isLoggedIn, isAdmin, isLoading, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
  };

  const avatarInitial = user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">
              Komik<span className="text-accent">Hub</span>
            </span>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/?type_slug=manga" className="text-sm text-muted transition-colors hover:text-foreground">Manga</Link>
            <Link href="/?type_slug=manhwa" className="text-sm text-muted transition-colors hover:text-foreground">Manhwa</Link>
            <Link href="/?type_slug=manhua" className="text-sm text-muted transition-colors hover:text-foreground">Manhua</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Mobile badges */}
            <div className="flex items-center gap-2 md:hidden">
              <Link href="/?type_slug=manga" className="rounded-md bg-blue-600/20 px-2 py-1 text-[10px] font-bold uppercase text-blue-400">Manga</Link>
              <Link href="/?type_slug=manhwa" className="rounded-md bg-green-600/20 px-2 py-1 text-[10px] font-bold uppercase text-green-400">Manhwa</Link>
              <Link href="/?type_slug=manhua" className="rounded-md bg-orange-600/20 px-2 py-1 text-[10px] font-bold uppercase text-orange-400">Manhua</Link>
            </div>

            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-border" />
            ) : isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-border"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-accent/30" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                      {avatarInitial}
                    </div>
                  )}
                  <span className="hidden text-sm font-medium text-foreground md:block">
                    {user.username}
                  </span>
                  {isAdmin && (
                    <span className="hidden rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent md:block">
                      Admin
                    </span>
                  )}
                  <svg className={`h-3 w-3 text-muted transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-border bg-card-bg shadow-xl">
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{user.username}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                        {isAdmin && (
                          <span className="mt-1 inline-block rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="py-1">
                        {/* ← Link ke Admin Dashboard */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-border"
                          >
                            <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-border"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Keluar
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Masuk
              </button>
            )}
          </div>
        </div>
      </header>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}