"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Sun, Moon, Menu, X } from "lucide-react";

export default function SiteHeader() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-[#1e1e1e]">
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
            <Link href="/" className="text-[13px] text-[#555] dark:text-gray-400 hover:text-[#222] dark:hover:text-white transition-colors">
              Recommend
            </Link>
            <Link href="/?type_slug=manhwa" className="text-[13px] text-[#555] dark:text-gray-400 hover:text-[#222] dark:hover:text-white transition-colors">
              Manhwa
            </Link>
            <Link href="/?type_slug=manhua" className="text-[13px] text-[#555] dark:text-gray-400 hover:text-[#222] dark:hover:text-white transition-colors">
              Manhua
            </Link>
            <Link href="/?type_slug=manga" className="text-[13px] text-[#555] dark:text-gray-400 hover:text-[#222] dark:hover:text-white transition-colors">
              Manga
            </Link>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search bar (desktop) */}
          <div className="hidden md:flex items-center gap-1 bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded-full px-3 py-1.5 mr-2 w-[180px]">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-[12px] outline-none w-full text-[#333] dark:text-gray-200 placeholder-gray-400"
            />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-[#555] dark:text-gray-400" />
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-yellow-400" />
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

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden pb-2">
            <div className="flex items-center gap-1 bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded-full px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                autoFocus
                className="bg-transparent text-[12px] outline-none w-full text-[#333] dark:text-gray-200 placeholder-gray-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#0a0a0a]">
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
