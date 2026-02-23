"use client";

import { useEffect, useState } from "react";
import { fetchAdminRoles, adminCreateRole, type AdminRole } from "@/app/lib/admin-api";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      await adminCreateRole(name.trim());
      setSuccess(`Role "${name}" berhasil dibuat!`);
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ROLE_BADGE: Record<string, string> = {
    admin: "bg-accent/10 text-accent",
    user: "bg-blue-500/10 text-blue-400",
    moderator: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Manajemen Roles</h1>
        <p className="mt-1 text-sm text-muted">Kelola roles dan hak akses pengguna</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card-bg p-6">
            <h2 className="mb-4 font-semibold text-foreground">Buat Role Baru</h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-emerald-800/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-400">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Nama Role
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="contoh: moderator"
                  required
                  maxLength={50}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "+ Buat Role"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card-bg">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold text-foreground">
                Daftar Roles
                <span className="ml-2 rounded-full bg-border px-2 py-0.5 text-xs text-muted">
                  {roles.length}
                </span>
              </h2>
            </div>
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-border" />
                ))}
              </div>
            ) : roles.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">Belum ada role.</p>
            ) : (
              <div className="divide-y divide-border">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center gap-3 px-6 py-4">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${ROLE_BADGE[role.name.toLowerCase()] ?? "bg-border text-muted"}`}
                    >
                      {role.name}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{role.name}</p>
                      <p className="text-xs text-muted">ID: {role.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}