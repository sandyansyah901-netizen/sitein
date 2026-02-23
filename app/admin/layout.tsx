"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";

const navGroups = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin", exact: true, label: "Dashboard",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      },
    ],
  },
  {
    label: "Konten",
    items: [
      {
        href: "/admin/manga", label: "Manga",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      },
      {
        href: "/admin/chapters", label: "Chapters",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      },
      {
        href: "/admin/upload", label: "Upload",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
      },
      {
        href: "/admin/genres", label: "Genre",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
      },
      {
        href: "/admin/manga-types", label: "Tipe Manga",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
      },
    ],
  },
  {
    label: "Pengguna",
    items: [
      {
        href: "/admin/users", label: "Users",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      },
      {
        href: "/admin/roles", label: "Roles",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      },
    ],
  },
  {
    label: "Infrastruktur",
    items: [
      {
        href: "/admin/storage", label: "Storage",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
      },
      {
        href: "/admin/remotes", label: "Remotes",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>,
      },
      {
        href: "/admin/cache", label: "Cache",
        icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
      },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) router.replace("/");
  }, [isLoading, isLoggedIn, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-4 border-border border-t-accent" />
          <p className="text-sm text-muted">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 border-r border-border bg-card-bg overflow-y-auto">
        <div className="p-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted">
                {group.label}
              </p>
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = "exact" in item && item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-border hover:text-foreground"
                      }`}>
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
          <div className="border-t border-border pt-3">
            <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-border hover:text-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Site
            </Link>
          </div>
        </div>
      </aside>
      <main className="ml-56 flex-1 p-8">{children}</main>
    </div>
  );
}