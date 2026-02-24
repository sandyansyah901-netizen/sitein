"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";

// Ganti dengan base URL API kamu, misal: https://api.sitein.web.id
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.sitein.web.id";

interface Genre {
  name: string;
  slug: string;
}
interface MangaType {
  name: string;
  slug: string;
}
interface Suggestion {
  title: string;
  slug: string;
  cover_url: string;
  status: string;
  type: MangaType;
  genres: Genre[];
  total_chapters: number;
}
interface SuggestResponse {
  q: string;
  total: number;
  suggestions: Suggestion[];
}
interface SearchBarProps {
  variant?: "default" | "compact";
  onClose?: () => void;
}

export default function SearchBar({ variant = "default", onClose }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions dari API suggest
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.trim().length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const url = `${API_BASE}/api/v1/manga/suggest?q=${encodeURIComponent(q.trim())}&limit=5`;
      console.log("[SearchBar] fetch suggest:", url); // debug — hapus kalau sudah jalan
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SuggestResponse = await res.json();
      const list = data.suggestions ?? [];
      setSuggestions(list);
      setShowDropdown(list.length > 0);
    } catch (err) {
      console.error("[SearchBar] suggest error:", err);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce 300ms setiap keystroke
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  // Submit → navigasi ke halaman hasil (logic lama)
  const handleSearch = useCallback(
    (e?: React.FormEvent | React.MouseEvent) => {
      e?.preventDefault();
      setShowDropdown(false);
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("search", query.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/?${params.toString()}`);
      onClose?.();
    },
    [query, searchParams, router, onClose]
  );

  // Klik suggestion → detail manga
  const handleSelectSuggestion = (slug: string) => {
    setShowDropdown(false);
    setQuery("");
    setSuggestions([]);
    router.push(`/manga/${slug}`);
    onClose?.();
  };

  // Tutup dropdown kalau klik di luar area
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup debounce saat unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const isCompact = variant === "compact";

  return (
    <div ref={containerRef} className={`relative ${isCompact ? "w-full" : "w-full max-w-xl"}`}>
      <form onSubmit={handleSearch} className="relative">
        {isCompact ? (
          /* ── Compact (header) ── */
          <div className="flex items-center gap-1 bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded-full px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              placeholder="Search..."
              className="bg-transparent text-[12px] outline-none w-full text-[#333] dark:text-gray-200 placeholder-gray-400"
            />
            {loading && (
              <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>
        ) : (
          /* ── Default (halaman utama) ── */
          <>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              placeholder="Cari manga, manhwa, manhua..."
              className="w-full rounded-lg border border-border bg-card-bg px-4 py-3 pl-11 pr-20 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading && (
              <span className="absolute right-16 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Cari
            </button>
          </>
        )}
      </form>

      {/* ── Dropdown Suggestions ── */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-[999] mt-1 rounded-xl border border-border bg-white dark:bg-[#111] shadow-xl overflow-hidden">
          <ul>
            {suggestions.map((s, idx) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(s.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  {/* Cover */}
                  <div className="w-9 h-12 shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-[#222]">
                    {s.cover_url ? (
                      <img
                        src={s.cover_url.startsWith("http") ? s.cover_url : `${API_BASE}${s.cover_url}`}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#222] dark:text-white truncate">
                      {s.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {/* Type badge */}
                      <span className="inline-block rounded-full bg-[#E50914]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#E50914] uppercase tracking-wide">
                        {s.type?.name ?? "—"}
                      </span>
                      {/* Genres (max 2) */}
                      {s.genres?.slice(0, 2).map((g) => (
                        <span
                          key={g.slug}
                          className="inline-block rounded-full bg-gray-100 dark:bg-[#222] px-1.5 py-0.5 text-[10px] text-gray-500 dark:text-gray-400"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {s.total_chapters} chapter · <span className="capitalize">{s.status}</span>
                    </p>
                  </div>
                </button>

                {idx < suggestions.length - 1 && (
                  <div className="mx-3 border-b border-gray-100 dark:border-[#1e1e1e]" />
                )}
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-[#1e1e1e] px-3 py-2">
            <button
              type="button"
              onClick={handleSearch}
              className="w-full text-center text-[11px] text-accent hover:underline font-medium"
            >
              Lihat semua hasil untuk &quot;{query}&quot; →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}