"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Menu, X, LayoutDashboard, BookMarked, History, List, LogOut } from "lucide-react";
import SearchBar from "./SearchBar";
import LoginModal from "./LoginModal";
import { useAuth } from "@/app/lib/auth";

export default function SiteHeader() {
  const { user, isLoggedIn, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sync dark mode
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = saved === "dark" || (!saved && prefersDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Listen for global open-login-modal event
  useEffect(() => {
    const handler = () => setLoginOpen(true);
    window.addEventListener("open-login-modal", handler);
    return () => window.removeEventListener("open-login-modal", handler);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  const USER_MENU_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Reading History", href: "/dashboard/history", icon: History },
    { label: "Bookmarks", href: "/dashboard/bookmarks", icon: BookMarked },
    { label: "Reading List", href: "/dashboard/lists", icon: List },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-[#1e1e1e] transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between h-[52px]">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <h1 style={{ fontWeight: 900 }} className="!text-[18px] tracking-tight text-[#222] dark:text-white">
              <span className="text-[#E50914]">S</span>itein
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5 ml-8">
            {[
              { label: "Recommend", href: "/" },
              { label: "Manhwa", href: "/?type_slug=manhwa" },
              { label: "Manhua", href: "/?type_slug=manhua" },
              { label: "Manga", href: "/?type_slug=manga" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[13px] text-[#555] dark:text-gray-400 hover:text-[#222] dark:hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Search bar (desktop) */}
          <div className="hidden md:flex items-center mr-2 w-[220px] relative">
            <SearchBar variant="compact" />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              aria-label="Search"
            >
              <X className={`w-4 h-4 text-[#555] dark:text-gray-400 ${searchOpen ? "block" : "hidden"}`} />
              <svg
                className={`w-4 h-4 text-[#555] dark:text-gray-400 ${searchOpen ? "hidden" : "block"}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#E50914]" />
              ) : (
                <Moon className="w-4 h-4 text-[#555]" />
              )}
            </button>

            {/* User avatar / login button */}
            {isLoggedIn && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="w-8 h-8 rounded-full bg-[#E50914] flex items-center justify-center text-white text-[13px] font-black hover:opacity-90 transition-opacity"
                  aria-label="User menu"
                >
                  {user.username[0].toUpperCase()}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-10 w-[200px] rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] shadow-xl overflow-hidden z-50">
                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-[#1e1e1e]">
                      <p className="text-[13px] font-bold text-[#222] dark:text-white truncate">{user.username}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {USER_MENU_ITEMS.map(({ label, href, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#444] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0 text-[#E50914]" />
                          {label}
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 dark:border-[#1e1e1e] py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="login-btn"
                onClick={() => setLoginOpen(true)}
                className="rounded-full bg-[#E50914] px-3 py-1 text-[12px] font-semibold text-white hover:bg-[#c8000f] transition-colors"
              >
                Login
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-[#555] dark:text-gray-400" />
              ) : (
                <Menu className="w-4 h-4 text-[#555] dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <SearchBar variant="compact" onClose={() => setSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#0a0a0a] transition-colors">
          <nav className="flex flex-col px-4 py-2">
            {[
              { label: "Recommend", href: "/" },
              { label: "Manhwa", href: "/?type_slug=manhwa" },
              { label: "Manhua", href: "/?type_slug=manhua" },
              { label: "Manga", href: "/?type_slug=manga" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-[13px] text-[#555] dark:text-gray-400 hover:text-[#222] dark:hover:text-white border-b border-gray-50 dark:border-[#111] last:border-0"
              >
                {label}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-[13px] text-[#555] dark:text-gray-400 border-b border-gray-50 dark:border-[#111] hover:text-[#E50914]">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="py-2.5 text-left text-[13px] text-red-500">
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}