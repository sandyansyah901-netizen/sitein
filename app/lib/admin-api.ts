const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
export const API_BASE = "http://127.0.0.1:8000";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("komik_token") ?? "";
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function adminFetch(url: string, options: RequestInit = {}): Promise<unknown> {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401 || res.status === 403) throw new Error("Akses ditolak.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `API error: ${res.status}`);
  }
  return res.json();
}

/**
 * adminFetch dengan timeout — untuk endpoint yang bisa hang lama (groups/status, groups/quota)
 */
async function adminFetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await adminFetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timeout (${timeoutMs / 1000}s) — backend tidak merespon`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Normalize cover URL dari berbagai format ke path relatif
 * yang akan di-proxy oleh Next.js rewrite ke backend.
 *
 * Next.js rewrite config:
 *   /static/:path*  → http://127.0.0.1:8000/static/:path*
 *   /covers/:path*  → http://127.0.0.1:8000/covers/:path*
 *
 * - null/undefined                                        → null
 * - "http://127.0.0.1:8000/static/covers/x.webp"        → "/static/covers/x.webp"
 * - "http://localhost:8000/static/covers/x.webp"         → "/static/covers/x.webp"
 * - "https://external.com/image.jpg"                     → "https://external.com/image.jpg" (pakai langsung)
 * - "/static/covers/x.webp"                              → "/static/covers/x.webp"
 * - "/covers/x.webp"                                     → "/covers/x.webp"
 * - "covers/x.webp"                                      → "/static/covers/x.webp"
 * - "x.webp"                                             → "/static/covers/x.webp"
 */
export function normalizeCoverUrl(coverPath: string | null | undefined): string | null {
  if (!coverPath) return null;

  // URL dari backend lokal — ambil pathname-nya saja (akan di-proxy Next.js)
  if (
    coverPath.startsWith("http://127.0.0.1:8000") ||
    coverPath.startsWith("http://localhost:8000")
  ) {
    const url = new URL(coverPath);
    return url.pathname; // → "/static/covers/x.webp"
  }

  // External URL (bukan backend lokal) — pakai langsung
  if (coverPath.startsWith("http://") || coverPath.startsWith("https://")) {
    return coverPath;
  }

  // Sudah path dengan leading slash — pakai langsung (Next.js proxy akan handle)
  if (coverPath.startsWith("/")) {
    return coverPath;
  }

  // "covers/x.webp" → "/static/covers/x.webp"
  if (coverPath.startsWith("covers/")) {
    return `/static/${coverPath}`;
  }

  // Nama file saja: "x.webp" → "/static/covers/x.webp"
  return `/static/covers/${coverPath}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminStats {
  [key: string]: unknown;
}

export interface AdminRole {
  id: number;
  name: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  roles?: string[] | Array<{ id: number; name: string }>;
}

export interface AdminUsersResponse {
  items?: AdminUser[];
  users?: AdminUser[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  total?: number;
}

export interface StorageSource {
  id: number;
  // Nama bisa di berbagai field tergantung API version
  name?: string;
  source_name?: string;
  remote_name?: string;
  // Path info
  base_path?: string;
  base_folder_id?: string;
  storage_type?: string;
  // Status
  status?: string;
  is_active?: boolean;
  // Stats
  manga_count?: number;
  total_manga?: number;
  total_chapters?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface AdminManga {
  id: number;
  title: string;
  slug: string;
  description?: string;
  cover_url?: string | null;
  status?: string;
  type?: { id: number; name: string; slug: string };
  genres?: Array<{ id: number; name: string; slug: string }>;
  total_chapters?: number;
  storage_id?: number;
  storage?: { id: number; name?: string; remote_name?: string };
  updated_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface AdminMangaListResponse {
  items?: AdminManga[];
  manga?: AdminManga[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  total?: number;
}

export interface AdminChapter {
  id: number;
  chapter_main: number;
  chapter_sub: number;
  chapter_label: string;
  slug: string;
  total_pages?: number;
  volume_number?: number;
  chapter_type?: string;
  anchor_path?: string | null;
  preview_url?: string | null;
  chapter_folder_name?: string;
  uploaded_by?: string;
  created_at?: string;
  manga?: { id: number; title: string; slug: string };
  [key: string]: unknown;
}

export interface AdminChapterListResponse {
  items?: AdminChapter[];
  chapters?: AdminChapter[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  total?: number;
}

export interface GroupStatusItem {
  group: number;
  primary: string;
  backups: string[];
  all_remotes: string[];
  path_prefix: string;
  quota_gb: number;
  configured: boolean;
}

export interface GroupQuotaItem {
  group: number;
  primary: string;
  backups: string[];
  quota_gb: number;
  uploaded_gb: number;
  is_full: boolean;
  full_since: string | null;
  prefix: string | null;
}

export interface DaemonInfo {
  alive: boolean;
  ready: boolean;
  url: string | null;
  port?: number;
  status: string;
}

export interface DaemonHealth {
  group1_daemons_ready?: number;
  group1_daemons_total?: number;
  daemons: Record<string, DaemonInfo>;
  [key: string]: unknown;
}

export interface GroupsStatus {
  active_upload_group: number;
  auto_switch_enabled: boolean;
  configured_groups: number[];
  groups: Record<string, GroupStatusItem>;
  quota: {
    active_upload_group: number;
    auto_switch_enabled: boolean;
    groups: Record<string, GroupQuotaItem>;
  };
  daemon_health: DaemonHealth;
  [key: string]: unknown;
}

export interface GroupsQuota {
  active_upload_group: number;
  auto_switch_enabled: boolean;
  group1_quota_limit_gb?: number;
  quota_tracker: {
    active_upload_group: number;
    auto_switch_enabled: boolean;
    groups: Record<string, GroupQuotaItem>;
  };
  [key: string]: unknown;
}

// Storage test result — response dari GET /admin/storage/{id}/test
export interface RemoteStatus {
  alive: boolean;
  ready: boolean;
  url: string | null;
  status: string;
}

export interface StorageTestResult {
  success: boolean;
  storage_id: number;
  source_name?: string;
  status: string;
  total_remotes?: number;
  healthy_remotes?: number;
  available_remotes?: number;
  remotes_status?: Record<string, RemoteStatus>;
  group2_configured?: boolean;
  group2_enabled?: boolean;
  error?: string;
  [key: string]: unknown;
}

// GDrive real usage — response dari GET /admin/storage/gdrive-usage
export interface GdriveRemoteUsage {
  remote: string;
  group: number;
  total_bytes?: number;
  used_bytes?: number;
  free_bytes?: number;
  trashed_bytes?: number;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  trashed_gb?: number;
  error: string | null;
}

export interface GdriveGroupUsage {
  group: number;
  remotes: GdriveRemoteUsage[];
  total_used_gb: number;
  total_free_gb: number;
  total_capacity_gb: number;
}

export interface GdriveUsageResult {
  groups: Record<string, GdriveGroupUsage>;
  total_remotes_queried: number;
  fetched_at: string;
}

export interface CacheStats {
  [key: string]: unknown;
}

export interface CoverStats {
  [key: string]: unknown;
}

export interface ThumbnailInfo {
  [key: string]: unknown;
}

export interface RemoteHealth {
  [key: string]: unknown;
}

export interface RemoteStats {
  [key: string]: unknown;
}

export interface CoverInfo {
  cover_url: string | null;
  cover_path: string | null;
  file_exists: boolean;
  file_size_kb: number | null;
  format: string | null;
  access_url: string | null;
  [key: string]: unknown;
}

export interface CoverListItem {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  has_cover: boolean;
  [key: string]: unknown;
}

export interface CoverListResponse {
  items: CoverListItem[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  total?: number;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminStats(): Promise<AdminStats> {
  return adminFetch(`${API_BASE_URL}/admin/stats`) as Promise<AdminStats>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENRES
// ─────────────────────────────────────────────────────────────────────────────

export async function adminCreateGenre(
  name: string,
  slug: string
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/genres?${new URLSearchParams({ name, slug })}`,
    { method: "POST" }
  );
}

export async function adminDeleteGenre(genreId: number): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/genres/${genreId}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MANGA TYPES
// ─────────────────────────────────────────────────────────────────────────────

export async function adminCreateMangaType(
  name: string,
  slug: string
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga-types?${new URLSearchParams({ name, slug })}`,
    { method: "POST" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminRoles(): Promise<AdminRole[]> {
  return adminFetch(`${API_BASE_URL}/admin/roles`) as Promise<AdminRole[]>;
}

export async function adminCreateRole(name: string): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/roles?${new URLSearchParams({ name })}`,
    { method: "POST" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminUsers(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}): Promise<AdminUsersResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  if (params?.search) sp.set("search", params.search);
  if (params?.is_active !== undefined)
    sp.set("is_active", String(params.is_active));
  return adminFetch(
    `${API_BASE_URL}/admin/users?${sp}`
  ) as Promise<AdminUsersResponse>;
}

export async function adminUpdateUserRole(
  userId: number,
  roles: string[]
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ roles }),
  });
}

export async function adminToggleUserStatus(
  userId: number,
  isActive: boolean
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: "PUT",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function adminDeleteUser(userId: number): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "DELETE",
  });
}

// GET /admin/users/{user_id}
export async function fetchAdminUserDetail(userId: number): Promise<AdminUser> {
  return adminFetch(
    `${API_BASE_URL}/admin/users/${userId}`
  ) as Promise<AdminUser>;
}

// PATCH /admin/users/{user_id}/username
export async function adminUpdateUsername(
  userId: number,
  newUsername: string
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/users/${userId}/username`, {
    method: "PATCH",
    body: JSON.stringify({ new_username: newUsername }),
  });
}

// PATCH /admin/users/{user_id}/password
export async function adminUpdatePassword(
  userId: number,
  newPassword: string
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ new_password: newPassword }),
  });
}

// PATCH /admin/users/{user_id}/email
export async function adminUpdateEmail(
  userId: number,
  newEmail: string
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/users/${userId}/email`, {
    method: "PATCH",
    body: JSON.stringify({ new_email: newEmail }),
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// MANGA
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminMangaList(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  storage_id?: number;
}): Promise<AdminMangaListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  if (params?.search) sp.set("search", params.search);
  if (params?.storage_id) sp.set("storage_id", String(params.storage_id));
  return adminFetch(
    `${API_BASE_URL}/admin/manga?${sp}`
  ) as Promise<AdminMangaListResponse>;
}

export async function fetchAdminMangaDetail(
  mangaId: number
): Promise<AdminManga> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}`
  ) as Promise<AdminManga>;
}

// POST /admin/manga — application/x-www-form-urlencoded
export async function adminCreateManga(data: {
  title: string;
  slug: string;
  description?: string;
  type_slug: string;
  storage_id: number;
  status_manga?: string;
  genre_slugs?: string[];
}): Promise<unknown> {
  const token = getToken();
  const body = new URLSearchParams();
  body.append("title", data.title);
  body.append("slug", data.slug);
  if (data.description) body.append("description", data.description);
  body.append("type_slug", data.type_slug);
  body.append("storage_id", String(data.storage_id));
  if (data.status_manga) body.append("status_manga", data.status_manga);
  if (data.genre_slugs) {
    data.genre_slugs.forEach((g) => body.append("genre_slugs", g));
  }

  const res = await fetch(`${API_BASE_URL}/admin/manga`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${token}`,
    },
    body: body.toString(),
  });

  if (res.status === 401 || res.status === 403)
    throw new Error("Akses ditolak.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// PUT /admin/manga/{manga_id} — application/json
export async function adminUpdateManga(
  mangaId: number,
  body: {
    title?: string;
    slug?: string;
    description?: string;
    cover_image_path?: string;
    status?: string;
    type_slug?: string;
    storage_id?: number;
    genre_slugs?: string[];
  }
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/manga/${mangaId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function adminDeleteManga(
  mangaId: number,
  deleteGdrive = false
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}?delete_gdrive=${deleteGdrive}`,
    { method: "DELETE" }
  );
}

// PUT /admin/manga/{manga_id}/status
export async function adminToggleMangaStatus(
  mangaId: number,
  newStatus: string
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}/status?new_status=${encodeURIComponent(newStatus)}`,
    { method: "PUT" }
  );
}

// POST /admin/manga/{manga_id}/cover — multipart/form-data
export async function adminUploadCover(
  mangaId: number,
  file: File,
  backupToGdrive = true
): Promise<unknown> {
  const token = getToken();
  if (!token) throw new Error("Akses ditolak.");
  const fd = new FormData();
  fd.append("cover", file);

  const res = await fetch(
    `${API_BASE_URL}/admin/manga/${mangaId}/cover?backup_to_gdrive=${backupToGdrive}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    }
  );

  if (res.status === 401 || res.status === 403)
    throw new Error("Akses ditolak. Pastikan kamu sudah login sebagai admin.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "Upload cover gagal");
  }
  return res.json();
}

// DELETE /admin/manga/{manga_id}/cover
export async function adminDeleteCover(
  mangaId: number,
  deleteGdrive = true
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}/cover?delete_gdrive=${deleteGdrive}`,
    { method: "DELETE" }
  );
}

// GET /admin/manga/{manga_id}/cover/info
export async function fetchCoverInfo(mangaId: number): Promise<CoverInfo> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}/cover/info`
  ) as Promise<CoverInfo>;
}

// POST /admin/covers/sync-from-gdrive
export async function adminSyncCoversFromGdrive(): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/covers/sync-from-gdrive`, {
    method: "POST",
  });
}

// GET /admin/covers/stats
export async function fetchCoverStats(): Promise<CoverStats> {
  return adminFetch(
    `${API_BASE_URL}/admin/covers/stats`
  ) as Promise<CoverStats>;
}

// GET /admin/covers/list
export async function fetchCoverList(params?: {
  page?: number;
  page_size?: number;
  has_cover?: boolean;
}): Promise<CoverListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  if (params?.has_cover !== undefined)
    sp.set("has_cover", String(params.has_cover));
  return adminFetch(
    `${API_BASE_URL}/admin/covers/list?${sp}`
  ) as Promise<CoverListResponse>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAPTERS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminChapters(params?: {
  manga_id?: number;
  manga_slug?: string;
  page?: number;
  page_size?: number;
}): Promise<AdminChapterListResponse> {
  const sp = new URLSearchParams();
  if (params?.manga_id) sp.set("manga_id", String(params.manga_id));
  if (params?.manga_slug) sp.set("manga_slug", params.manga_slug);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return adminFetch(
    `${API_BASE_URL}/admin/chapters?${sp}`
  ) as Promise<AdminChapterListResponse>;
}

// PUT /admin/chapter/{chapter_id}
export async function adminUpdateChapter(
  chapterId: number,
  body: {
    chapter_main?: number;
    chapter_sub?: number;
    chapter_label?: string;
    slug?: string;
    chapter_folder_name?: string;
    volume_number?: number;
    chapter_type?: string;
    anchor_path?: string;
    preview_url?: string;
  }
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/chapter/${chapterId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// DELETE /admin/chapter/{chapter_id}
export async function adminDeleteChapter(
  chapterId: number,
  deleteGdrive = false
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}?delete_gdrive=${deleteGdrive}`,
    { method: "DELETE" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAPTER PAGE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface ChapterPage {
  id: number;
  page_order: number;
  proxy_url: string;
  gdrive_file_id?: string;
  is_anchor?: boolean;
}

export interface ChapterWithPages {
  id: number;
  chapter_label: string;
  slug: string;
  total_pages: number;
  manga: { id: number; title: string; slug: string };
  pages: ChapterPage[];
}

export interface AddPagesResult {
  success: boolean;
  chapter_id: number;
  chapter_label: string;
  pages_added: number;
  total_pages_before: number;
  total_pages_after: number;
  message: string;
}

export interface DeletePageResult {
  success: boolean;
  chapter_id: number;
  deleted_page_id: number;
  deleted_page_order: number;
  total_pages_before: number;
  total_pages_after: number;
  message: string;
}

export interface SwapPagesResult {
  success: boolean;
  chapter_id: number;
  chapter_label: string;
  message: string;
}

export interface ReorderPagesResult {
  success: boolean;
  chapter_id: number;
  chapter_label: string;
  total_pages_reordered: number;
  message: string;
}

// GET /admin/chapter/{chapter_id} — admin endpoint, dengan pages + proxy_url
export async function fetchAdminChapterDetail(chapterId: number): Promise<ChapterWithPages & {
  manga_id: number;
  chapter_main: number;
  chapter_sub: number;
  slug: string;
  chapter_folder_name?: string;
  volume_number?: number;
  anchor_path?: string | null;
  preview_url?: string | null;
  uploaded_by?: string | null;
  created_at?: string;
}> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}`
  ) as ReturnType<typeof fetchAdminChapterDetail>;
}

// GET /chapter/{chapter_slug} — public endpoint, pakai API_BASE_URL tanpa /admin
export async function fetchChapterWithPages(chapterSlug: string): Promise<ChapterWithPages> {
  const res = await fetch(`${API_BASE_URL}/chapter/${chapterSlug}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>)?.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// POST /admin/chapter/{chapter_id}/pages/add — multipart/form-data
export async function adminAddChapterPages(
  chapterId: number,
  files: File[],
  insertAfter?: number
): Promise<AddPagesResult> {
  const token = getToken();
  if (!token) throw new Error("Akses ditolak.");
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const url = insertAfter !== undefined
    ? `${API_BASE_URL}/admin/chapter/${chapterId}/pages/add?insert_after=${insertAfter}`
    : `${API_BASE_URL}/admin/chapter/${chapterId}/pages/add`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (res.status === 401 || res.status === 403) throw new Error("Akses ditolak.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>)?.detail || "Upload gagal");
  }
  return res.json();
}

// DELETE /admin/chapter/{chapter_id}/pages/{page_id}
export async function adminDeleteChapterPage(
  chapterId: number,
  pageId: number,
  deleteFromGdrive = true,
  renumber = true
): Promise<DeletePageResult> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/pages/${pageId}?delete_from_gdrive=${deleteFromGdrive}&renumber=${renumber}`,
    { method: "DELETE" }
  ) as Promise<DeletePageResult>;
}

// POST /admin/chapter/{chapter_id}/pages/swap
export async function adminSwapChapterPages(
  chapterId: number,
  pageId1: number,
  pageId2: number
): Promise<SwapPagesResult> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/pages/swap`,
    {
      method: "POST",
      body: JSON.stringify({ page_id_1: pageId1, page_id_2: pageId2 }),
    }
  ) as Promise<SwapPagesResult>;
}

// PUT /admin/chapter/{chapter_id}/pages/reorder
export async function adminReorderChapterPages(
  chapterId: number,
  pageOrders: Array<{ page_id: number; new_order: number }>
): Promise<ReorderPagesResult> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/pages/reorder`,
    {
      method: "PUT",
      body: JSON.stringify({ page_orders: pageOrders }),
    }
  ) as Promise<ReorderPagesResult>;
}



// ─────────────────────────────────────────────────────────────────────────────
// CHAPTER THUMBNAILS
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/chapter/{chapter_id}/thumbnail/info
export async function fetchThumbnailInfo(
  chapterId: number
): Promise<ThumbnailInfo> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/thumbnail/info`
  ) as Promise<ThumbnailInfo>;
}

// POST /admin/chapter/{chapter_id}/thumbnail/upload — multipart/form-data
export async function adminUploadThumbnail(
  chapterId: number,
  file: File
): Promise<unknown> {
  const token = getToken();
  if (!token) throw new Error("Akses ditolak.");
  const fd = new FormData();
  fd.append("thumbnail", file);

  const res = await fetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/thumbnail/upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    }
  );

  if (res.status === 401 || res.status === 403)
    throw new Error("Akses ditolak.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "Upload thumbnail gagal");
  }
  return res.json();
}

// POST /admin/chapter/{chapter_id}/thumbnail/generate
export async function adminGenerateThumbnail(
  chapterId: number,
  sourcePage = 1
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/thumbnail/generate?source_page=${sourcePage}`,
    { method: "POST" }
  );
}

// POST /admin/manga/{manga_slug}/thumbnails/generate-all
export async function adminBulkGenerateThumbnails(
  mangaSlug: string,
  sourcePage = 1
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaSlug}/thumbnails/generate-all?source_page=${sourcePage}`,
    { method: "POST" }
  );
}

// DELETE /admin/chapter/{chapter_id}/thumbnail
export async function adminDeleteThumbnail(
  chapterId: number
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/thumbnail`,
    { method: "DELETE" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE SOURCES
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/storage
export async function fetchAdminStorage(): Promise<StorageSource[]> {
  const data = await adminFetch(`${API_BASE_URL}/admin/storage`);
  // Handle both array response and wrapped {items: [...], total: N} response
  if (Array.isArray(data)) return data as StorageSource[];
  const wrapped = data as Record<string, unknown>;
  if (Array.isArray(wrapped?.items)) return wrapped.items as StorageSource[];
  if (Array.isArray(wrapped?.sources)) return wrapped.sources as StorageSource[];
  return [];
}

// GET /admin/storage/{storage_id}/test
export async function adminTestStorage(storageId: number): Promise<StorageTestResult> {
  return adminFetch(`${API_BASE_URL}/admin/storage/${storageId}/test`) as Promise<StorageTestResult>;
}

// GET /admin/storage/gdrive-usage — blocking (~1-3s per remote, parallel)
// ⚠️ Panggil hanya saat user click manual, bukan auto-poll
export async function fetchGdriveUsage(): Promise<GdriveUsageResult> {
  return adminFetchWithTimeout(
    `${API_BASE_URL}/admin/storage/gdrive-usage`,
    {},
    30000 // max 30 detik untuk banyak remote
  ) as Promise<GdriveUsageResult>;
}

// PUT /admin/storage/{storage_id}/status
export async function adminToggleStorageStatus(
  storageId: number,
  newStatus: "active" | "suspended"
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/storage/${storageId}/status?new_status=${newStatus}`,
    { method: "PUT" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE GROUPS
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/groups/status — non-blocking async (backend fix 27 Feb)
export async function fetchGroupsStatus(): Promise<GroupsStatus> {
  return adminFetchWithTimeout(
    `${API_BASE_URL}/admin/groups/status`,
    {},
    15000
  ) as Promise<GroupsStatus>;
}

// GET /admin/groups/quota — non-blocking async (backend fix 27 Feb)
export async function fetchGroupsQuota(): Promise<GroupsQuota> {
  return adminFetchWithTimeout(
    `${API_BASE_URL}/admin/groups/quota`,
    {},
    15000
  ) as Promise<GroupsQuota>;
}

// POST /admin/groups/switch
export async function adminSwitchGroup(
  targetGroup: number
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/groups/switch?target_group=${targetGroup}`,
    { method: "POST" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/cache/stats
export async function fetchCacheStats(): Promise<CacheStats> {
  return adminFetch(
    `${API_BASE_URL}/admin/cache/stats`
  ) as Promise<CacheStats>;
}

// POST /admin/cache/cleanup
export async function adminCacheCleanup(): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/cache/cleanup`, {
    method: "POST",
  });
}

// DELETE /admin/cache/chapter/{chapter_id}
export async function adminClearChapterCache(
  chapterId: number
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/cache/chapter/${chapterId}`,
    { method: "DELETE" }
  );
}

// DELETE /admin/cache/manga/{manga_id}
export async function adminClearMangaCache(mangaId: number): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/cache/manga/${mangaId}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REMOTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/remotes/health
export async function fetchRemotesHealth(): Promise<RemoteHealth> {
  return adminFetch(
    `${API_BASE_URL}/admin/remotes/health`
  ) as Promise<RemoteHealth>;
}

// GET /admin/remotes/stats
export async function fetchRemotesStats(): Promise<RemoteStats> {
  return adminFetch(
    `${API_BASE_URL}/admin/remotes/stats`
  ) as Promise<RemoteStats>;
}

// GET /admin/remotes/best
export async function fetchBestRemote(group: number = 1): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/remotes/best?group=${group}`);
}

// POST /admin/remotes/{remote_name}/reset
export async function adminResetRemoteHealth(
  remoteName: string,
  group: number = 1
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/remotes/${encodeURIComponent(remoteName)}/reset?group=${group}`,
    { method: "POST" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  database: {
    total_users: number;
    active_users_today: number;
    active_users_week: number;
    total_manga: number;
    manga_ongoing: number;
    manga_completed: number;
    total_chapters: number;
  };
  views: {
    total_manga_views: number;
    total_chapter_views: number;
    views_today: number;
    views_week: number;
    views_month: number;
  };
  engagement: {
    total_bookmarks: number;
    total_reading_lists: number;
  };
  popular_genres: Array<{
    name: string;
    slug: string;
    manga_count: number;
  }>;
  user_growth: {
    labels: string[];
    data: number[];
  };
  timestamp: string;
}

export interface MangaViewItem {
  manga_id: number;
  manga_title: string;
  manga_slug: string;
  total_views: number;
  views_today: number;
  views_week: number;
  views_month: number;
  unique_viewers: number;
}

export interface MangaViewsResponse {
  items: MangaViewItem[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  period: string;
}

export interface UserGrowthEntry {
  date: string;
  new_users: number;
  total_users: number;
}

export interface UserGrowthResponse {
  period_days: number;
  total_new_users: number;
  data: UserGrowthEntry[];
}

export interface PopularGenreItem {
  id: number;
  name: string;
  slug: string;
  manga_count: number;
  total_views: number;
  bookmarks: number;
}

export interface PopularGenresResponse {
  genres: PopularGenreItem[];
  total_genres: number;
}

export interface TopMangaItem {
  rank: number;
  manga_id: number;
  manga_title: string;
  manga_slug: string;
  views?: number;
  bookmarks?: number;
  in_reading_lists?: number;
}

export interface TopMangaResponse {
  metric: string;
  period: string;
  items: TopMangaItem[];
}

export interface RecentActivityItem {
  type: "view" | "bookmark";
  username: string;
  manga_title: string;
  timestamp: string;
}

export interface RecentActivityResponse {
  recent_activity: RecentActivityItem[];
}

// GET /admin/analytics/overview
export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/overview`
  ) as Promise<AnalyticsOverview>;
}

// GET /admin/analytics/manga-views
export async function fetchMangaViews(params?: {
  page?: number;
  page_size?: number;
  period?: "today" | "week" | "month" | "year" | "all";
  sort_by?: "total_views" | "title";
}): Promise<MangaViewsResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  if (params?.period) sp.set("period", params.period);
  if (params?.sort_by) sp.set("sort_by", params.sort_by);
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/manga-views?${sp}`
  ) as Promise<MangaViewsResponse>;
}

// GET /admin/analytics/user-growth
export async function fetchUserGrowth(days = 30): Promise<UserGrowthResponse> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/user-growth?days=${days}`
  ) as Promise<UserGrowthResponse>;
}

// GET /admin/analytics/popular-genres
export async function fetchPopularGenres(limit = 10): Promise<PopularGenresResponse> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/popular-genres?limit=${limit}`
  ) as Promise<PopularGenresResponse>;
}

// GET /admin/analytics/top-manga
export async function fetchTopManga(params?: {
  metric?: "views" | "bookmarks" | "reading_lists";
  period?: "today" | "week" | "month" | "all";
  limit?: number;
}): Promise<TopMangaResponse> {
  const sp = new URLSearchParams();
  if (params?.metric) sp.set("metric", params.metric);
  if (params?.period) sp.set("period", params.period);
  if (params?.limit) sp.set("limit", String(params.limit));
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/top-manga?${sp}`
  ) as Promise<TopMangaResponse>;
}

// GET /admin/analytics/recent-activity
export async function fetchRecentActivity(limit = 50): Promise<RecentActivityResponse> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/recent-activity?limit=${limit}`
  ) as Promise<RecentActivityResponse>;
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEWS CLEANUP
// ─────────────────────────────────────────────────────────────────────────────

export interface ViewsDeleteResult {
  success: boolean;
  deleted_count: number;
  message: string;
  cutoff_date?: string;
  manga_id?: number;
  manga_title?: string;
  manga_slug?: string;
  chapter_id?: number;
  chapter_label?: string;
  chapter_slug?: string;
}

// DELETE /admin/analytics/manga-views?older_than_days=N
export async function deleteMangaViewsByPeriod(olderThanDays = 30): Promise<ViewsDeleteResult> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/manga-views?older_than_days=${olderThanDays}`,
    { method: "DELETE" }
  ) as Promise<ViewsDeleteResult>;
}

// DELETE /admin/analytics/manga-views/manga/{manga_id}
export async function deleteMangaViewsByManga(mangaId: number): Promise<ViewsDeleteResult> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/manga-views/manga/${mangaId}`,
    { method: "DELETE" }
  ) as Promise<ViewsDeleteResult>;
}

// DELETE /admin/analytics/manga-views/all?confirm=true
export async function deleteAllMangaViews(): Promise<ViewsDeleteResult> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/manga-views/all?confirm=true`,
    { method: "DELETE" }
  ) as Promise<ViewsDeleteResult>;
}

// DELETE /admin/analytics/chapter-views?older_than_days=N
export async function deleteChapterViewsByPeriod(olderThanDays = 30): Promise<ViewsDeleteResult> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/chapter-views?older_than_days=${olderThanDays}`,
    { method: "DELETE" }
  ) as Promise<ViewsDeleteResult>;
}

// DELETE /admin/analytics/chapter-views/chapter/{chapter_id}
export async function deleteChapterViewsByChapter(chapterId: number): Promise<ViewsDeleteResult> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/chapter-views/chapter/${chapterId}`,
    { method: "DELETE" }
  ) as Promise<ViewsDeleteResult>;
}

// DELETE /admin/analytics/chapter-views/all?confirm=true
export async function deleteAllChapterViews(): Promise<ViewsDeleteResult> {
  return adminFetch(
    `${API_BASE_URL}/admin/analytics/chapter-views/all?confirm=true`,
    { method: "DELETE" }
  ) as Promise<ViewsDeleteResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMGURL TOKEN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface ImgurlTokenInfo {
  index: number;
  token_preview: string;
  usage_today: number;
  limit: number;
  over_limit: boolean;
}

export interface ImgurlTokenStatus {
  status: string;
  token_file: string;
  daily_limit_per_token: number;
  rotation_strategy: string;
  total_tokens: number;
  current_index: number;
  tokens: ImgurlTokenInfo[];
}

// GET /api/admin/imgurl/token-status
export async function fetchImgurlTokenStatus(): Promise<ImgurlTokenStatus> {
  const token = getToken();
  if (!token) throw new Error("Akses ditolak.");
  const ADMIN_BASE = "http://127.0.0.1:8000/api/admin";
  const res = await fetch(`${ADMIN_BASE}/imgurl/token-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>)?.detail || `API error: ${res.status}`);
  }
  return res.json() as Promise<ImgurlTokenStatus>;
}

// POST /api/admin/imgurl/reload-tokens
export async function reloadImgurlTokens(): Promise<ImgurlTokenStatus> {
  const token = getToken();
  if (!token) throw new Error("Akses ditolak.");
  const ADMIN_BASE = "http://127.0.0.1:8000/api/admin";
  const res = await fetch(`${ADMIN_BASE}/imgurl/reload-tokens`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>)?.detail || `API error: ${res.status}`);
  }
  return res.json() as Promise<ImgurlTokenStatus>;
}
