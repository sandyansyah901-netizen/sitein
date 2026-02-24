"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";
import SearchBar from "./SearchBar";

export default function SiteHeader() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Sync state dengan class yg ada di <html> saat mount
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

          {/* Search bar (desktop) — pakai SearchBar compact dengan suggest */}
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
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

        {/* Mobile search bar — pakai SearchBar compact dengan suggest */}
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
          </nav>
        </div>
      )}
    </header>
  );
}