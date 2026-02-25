"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchAdminUsers,
  fetchAdminUserDetail,
  adminUpdateUserRole,
  adminUpdateUsername,
  adminUpdatePassword,
  adminUpdateEmail,
  adminToggleUserStatus,
  adminDeleteUser,
  fetchAdminRoles,
  type AdminUser,
  type AdminRole,
} from "@/app/lib/admin-api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return roles.map((r) => (typeof r === "string" ? r : r.name));
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

type EditField = "username" | "email" | "password" | "role" | "detail";

function EditModal({
  user,
  field,
  availableRoles,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  field: EditField;
  availableRoles: AdminRole[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [value, setValue] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(getRoleNames(user.roles));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (field === "detail") {
      setDetailLoading(true);
      fetchAdminUserDetail(user.id)
        .then(setDetail)
        .catch((e) => setError(e.message))
        .finally(() => setDetailLoading(false));
    }
  }, [user.id, field]);

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);
    try {
      if (field === "username") {
        if (!value.trim()) throw new Error("Username tidak boleh kosong");
        await adminUpdateUsername(user.id, value.trim());
      } else if (field === "email") {
        if (!value.trim()) throw new Error("Email tidak boleh kosong");
        await adminUpdateEmail(user.id, value.trim());
      } else if (field === "password") {
        if (value.length < 6) throw new Error("Password minimal 6 karakter");
        await adminUpdatePassword(user.id, value);
      } else if (field === "role") {
        if (selectedRoles.length === 0) throw new Error("Pilih minimal 1 role");
        await adminUpdateUserRole(user.id, selectedRoles);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const titles: Record<EditField, string> = {
    username: "Ubah Username",
    email: "Ubah Email",
    password: "Reset Password",
    role: "Ubah Role",
    detail: "Detail User",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card-bg p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">{titles[field]}</h3>
            <p className="mt-0.5 text-sm text-muted">
              User: <span className="font-semibold text-foreground">#{user.id} {user.username}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Detail view */}
        {field === "detail" && (
          <div className="space-y-3">
            {detailLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-border" />
                ))}
              </div>
            ) : detail ? (
              <div className="space-y-2 text-sm">
                {[
                  ["ID", `#${detail.id}`],
                  ["Username", detail.username],
                  ["Email", detail.email],
                  ["Roles", getRoleNames(detail.roles).join(", ")],
                  ["Status", detail.is_active ? "Aktif" : "Non-aktif"],
                  ["Bergabung", new Date(detail.created_at ?? "").toLocaleString("id-ID")],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="text-muted">{label}</span>
                    <span className={`font-medium ${val === "Aktif" ? "text-emerald-400" : val === "Non-aktif" ? "text-red-400" : "text-foreground"
                      }`}>{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              error && <p className="text-sm text-red-400">{error}</p>
            )}
            <button onClick={onClose} className="mt-4 w-full rounded-lg border border-border py-2.5 text-sm font-semibold text-muted hover:text-foreground">
              Tutup
            </button>
          </div>
        )}

        {/* Edit fields */}
        {field !== "detail" && field !== "role" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                {field === "username" ? "Username Baru" : field === "email" ? "Email Baru" : "Password Baru"}
              </label>
              <input
                autoFocus
                type={field === "password" ? "password" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={
                  field === "username" ? "Masukkan username baru..."
                    : field === "email" ? "Masukkan email baru..."
                      : "Min. 6 karakter..."
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent"
              />
              {field === "username" && (
                <p className="mt-1 text-xs text-muted">Username saat ini: <span className="text-foreground">{user.username}</span></p>
              )}
              {field === "email" && (
                <p className="mt-1 text-xs text-muted">Email saat ini: <span className="text-foreground">{user.email}</span></p>
              )}
              {field === "password" && (
                <p className="mt-1 text-xs text-muted">Password lama tidak diperlukan (admin override)</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-xs text-red-400">
                ⚠️ {error}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted hover:text-foreground">
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {isLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        )}

        {/* Role edit */}
        {field === "role" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {(availableRoles.length > 0 ? availableRoles.map(r => r.name) : ["admin", "user", "moderator"]).map((role) => (
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
              ))}
            </div>

            {error && (
              <p className="rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-xs text-red-400">
                ⚠️ {error}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted hover:text-foreground">
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {isLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

function ActionMenu({
  user,
  onEdit,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: {
  user: AdminUser;
  onEdit: (field: EditField) => void;
  onToggle: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(true);
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-border hover:text-foreground"
        title="Aksi"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 w-48 rounded-xl border border-border bg-card-bg shadow-xl"
            style={{ top: pos.top, right: pos.right }}
          >
            <div className="p-1">
              <button
                onClick={() => { setOpen(false); onEdit("detail"); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-border hover:text-foreground"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Detail User
              </button>

              <div className="my-1 border-t border-border" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Edit</p>

              <button
                onClick={() => { setOpen(false); onEdit("username"); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-border hover:text-foreground"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Ubah Username
              </button>

              <button
                onClick={() => { setOpen(false); onEdit("email"); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-border hover:text-foreground"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Ubah Email
              </button>

              <button
                onClick={() => { setOpen(false); onEdit("password"); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-border hover:text-foreground"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Reset Password
              </button>

              <button
                onClick={() => { setOpen(false); onEdit("role"); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-border hover:text-foreground"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Ubah Role
              </button>

              <div className="my-1 border-t border-border" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Status</p>

              <button
                onClick={() => { setOpen(false); onToggle(); }}
                disabled={isToggling}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm disabled:opacity-50 ${user.is_active
                  ? "text-yellow-400 hover:bg-yellow-900/20"
                  : "text-emerald-400 hover:bg-emerald-900/20"
                  }`}
              >
                {user.is_active ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    Nonaktifkan
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Aktifkan
                  </>
                )}
              </button>

              <div className="my-1 border-t border-border" />

              <button
                onClick={() => { setOpen(false); onDelete(); }}
                disabled={isDeleting}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Hapus Permanen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
  const [availableRoles, setAvailableRoles] = useState<AdminRole[]>([]);

  // Modal
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editField, setEditField] = useState<EditField>("username");

  // Action loading
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Success toast
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

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

  useEffect(() => {
    fetchAdminRoles()
      .then((r) => setAvailableRoles(Array.isArray(r) ? r : []))
      .catch(() => { });
  }, []);

  const openEdit = (user: AdminUser, field: EditField) => {
    setEditUser(user);
    setEditField(field);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    setTogglingId(user.id);
    try {
      await adminToggleUserStatus(user.id, !user.is_active);
      showToast(`User ${user.username} ${user.is_active ? "dinonaktifkan" : "diaktifkan"}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Hapus user "${user.username}" secara permanen? Aksi ini tidak bisa dibatalkan.`)) return;
    setDeletingId(user.id);
    try {
      await adminDeleteUser(user.id);
      showToast(`User ${user.username} dihapus`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal hapus user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-700/40 bg-emerald-900/80 px-4 py-3 text-sm font-medium text-emerald-300 shadow-xl backdrop-blur-sm">
          ✓ {toast}
        </div>
      )}

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
            className="w-64 rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent"
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
      <div className="overflow-hidden rounded-xl border border-border bg-card-bg">
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
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active
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
                      <div className="flex items-center justify-end">
                        <ActionMenu
                          user={user}
                          onEdit={(field) => openEdit(user, field)}
                          onToggle={() => handleToggleStatus(user)}
                          onDelete={() => handleDelete(user)}
                          isToggling={togglingId === user.id}
                          isDeleting={deletingId === user.id}
                        />
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
              Halaman {page} dari {totalPages} · {total} user
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

      {/* Edit Modal */}
      {editUser && (
        <EditModal
          user={editUser}
          field={editField}
          availableRoles={availableRoles}
          onClose={() => setEditUser(null)}
          onSuccess={async () => {
            const fieldLabels: Record<EditField, string> = {
              username: "Username berhasil diubah",
              email: "Email berhasil diubah",
              password: "Password berhasil direset",
              role: "Role berhasil diubah",
              detail: "",
            };
            showToast(fieldLabels[editField]);
            await load();
          }}
        />
      )}
    </div>
  );
}