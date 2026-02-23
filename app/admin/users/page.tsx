"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchAdminUsers,
  adminUpdateUserRole,
  adminToggleUserStatus,
  adminDeleteUser,
  fetchAdminRoles,
  type AdminUser,
  type AdminRole,
} from "@/app/lib/admin-api";

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-accent/20 text-accent",
    user: "bg-blue-500/20 text-blue-400",
    moderator: "bg-purple-500/20 text-purple-400",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${colors[role.toLowerCase()] ?? "bg-border text-muted"}`}>
      {role}
    </span>
  );
}

function getRoleNames(roles?: AdminUser["roles"]): string[] {
  if (!roles || roles.length === 0) return ["user"];
  return roles.map((r) =>
    typeof r === "string" ? r : r.name
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Role modal
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<AdminRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Action loading states
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAdminUsers({
        page,
        page_size: 20,
        search: search || undefined,
        is_active: filterActive,
      });
      const items = data.items ?? data.users ?? [];
      setUsers(items);
      setTotal(data.pagination?.total ?? data.total ?? items.length);
      setTotalPages(data.pagination?.total_pages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat users");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filterActive]);

  useEffect(() => { load(); }, [load]);

  // Load available roles untuk modal
  useEffect(() => {
    fetchAdminRoles()
      .then((r) => setAvailableRoles(Array.isArray(r) ? r : []))
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openRoleModal = (user: AdminUser) => {
    setRoleModalUser(user);
    setSelectedRoles(getRoleNames(user.roles));
  };

  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
    setIsUpdatingRole(true);
    try {
      await adminUpdateUserRole(roleModalUser.id, selectedRoles);
      setRoleModalUser(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal update role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    setTogglingId(user.id);
    try {
      await adminToggleUserStatus(user.id, !user.is_active);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Hapus user "${user.username}" secara permanen?`)) return;
    setDeletingId(user.id);
    try {
      await adminDeleteUser(user.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal hapus user");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Users</h1>
          <p className="mt-1 text-sm text-muted">
            Total <span className="font-semibold text-foreground">{total}</span> user terdaftar
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari username / email..."
            className="rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent w-64"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Cari
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
            >
              ✕
            </button>
          )}
        </form>

        <select
          value={filterActive === undefined ? "" : String(filterActive)}
          onChange={(e) => {
            setFilterActive(e.target.value === "" ? undefined : e.target.value === "true");
            setPage(1);
          }}
          className="rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Non-aktif</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Roles</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Bergabung</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-border" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted">
                    Tidak ada user ditemukan
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-4 py-3 text-muted">#{user.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {getRoleNames(user.roles).map((r) => (
                          <RoleBadge key={r} role={r} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.is_active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {user.is_active ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(user.created_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit role */}
                        <button
                          onClick={() => openRoleModal(user)}
                          title="Edit Role"
                          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-border hover:text-foreground"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </button>

                        {/* Toggle status */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={togglingId === user.id}
                          title={user.is_active ? "Nonaktifkan" : "Aktifkan"}
                          className={`rounded-lg p-1.5 transition-colors hover:bg-border ${
                            user.is_active ? "text-yellow-400" : "text-emerald-400"
                          } disabled:opacity-50`}
                        >
                          {togglingId === user.id ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : user.is_active ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={deletingId === user.id}
                          title="Hapus User"
                          className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
                        >
                          {deletingId === user.id ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent hover:text-accent disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent hover:text-accent disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRoleModalUser(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card-bg p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-foreground">Edit Role</h3>
            <p className="mb-4 text-sm text-muted">
              User: <span className="font-semibold text-foreground">{roleModalUser.username}</span>
            </p>

            <div className="mb-6 space-y-2">
              {availableRoles.length > 0 ? (
                availableRoles.map((role) => (
                  <label key={role.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-border">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles((prev) => [...prev, role.name]);
                        } else {
                          setSelectedRoles((prev) => prev.filter((r) => r !== role.name));
                        }
                      }}
                      className="h-4 w-4 accent-accent"
                    />
                    <span className="text-sm font-medium capitalize text-foreground">{role.name}</span>
                  </label>
                ))
              ) : (
                // Fallback kalau roles kosong
                ["admin", "user", "moderator"].map((role) => (
                  <label key={role} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-border">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles((prev) => [...prev, role]);
                        } else {
                          setSelectedRoles((prev) => prev.filter((r) => r !== role));
                        }
                      }}
                      className="h-4 w-4 accent-accent"
                    />
                    <span className="text-sm font-medium capitalize text-foreground">{role}</span>
                  </label>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRoleModalUser(null)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted hover:text-foreground"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={isUpdatingRole}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {isUpdatingRole ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}