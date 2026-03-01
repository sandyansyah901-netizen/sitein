"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteHeader from "@/app/components/SiteHeader";
import SiteFooter from "@/app/components/SiteFooter";
import { BookMarked, History, List, LayoutDashboard, User } from "lucide-react";

const NAV = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Reading History", href: "/dashboard/history", icon: History },
    { label: "Bookmarks", href: "/dashboard/bookmarks", icon: BookMarked },
    { label: "Reading List", href: "/dashboard/lists", icon: List },
    { label: "Profil", href: "/dashboard/profile", icon: User },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div
            className="min-h-screen bg-white dark:bg-[#0a0a0a]"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            <SiteHeader />

            <div className="max-w-[1200px] mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Sidebar — desktop */}
                    <aside className="hidden md:flex flex-col gap-1 w-[200px] shrink-0">
                        {NAV.map(({ label, href, icon: Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${active
                                        ? "bg-[#E50914]/10 text-[#E50914]"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-[#222] dark:hover:text-white"
                                        }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {label}
                                </Link>
                            );
                        })}
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 min-w-0">
                        {/* Mobile tab bar */}
                        <div className="md:hidden flex gap-1 mb-4 overflow-x-auto pb-1">
                            {NAV.map(({ label, href, icon: Icon }) => {
                                const active = pathname === href;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap shrink-0 transition-colors ${active
                                            ? "bg-[#E50914] text-white"
                                            : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
                                            }`}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>

                        {children}
                    </main>
                </div>
            </div>

            <SiteFooter />
        </div>
    );
}
