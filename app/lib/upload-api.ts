const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("komik_token") ?? "";
}

async function uploadFetch(url: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
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

export interface UploadHealth {
  status: string;
  primary_remote: string;
  backup_remotes: string[];
  mirror_enabled: boolean;
  temp_dir: string;
  max_file_size_mb: number;
  allowed_extensions: string[];
  active_storage_group: Record<string, unknown>;
  thumbnail: Record<string, unknown>;
  features: Record<string, boolean>;
}

export interface UploadProgress {
  upload_id: string;
  status: string;
  progress: number;
  current_file?: string;
  total_files?: number;
  processed_files?: number;
  errors?: string[];
  [key: string]: unknown;
}

export interface UploadResult {
  [key: string]: unknown;
}

export async function fetchUploadHealth(): Promise<UploadHealth> {
  const res = await fetch(`${API_BASE_URL}/upload/health`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchUploadProgress(uploadId: string): Promise<UploadProgress> {
  return uploadFetch(`${API_BASE_URL}/upload/progress/${uploadId}`) as Promise<UploadProgress>;
}

export async function resumeUpload(resumeToken: string): Promise<UploadResult> {
  return uploadFetch(`${API_BASE_URL}/upload/resume/${resumeToken}`, {
    method: "POST",
  }) as Promise<UploadResult>;
}

export async function uploadSingleChapter(data: {
  manga_slug: string;
  chapter_main: number;
  chapter_sub?: number;
  chapter_label: string;
  chapter_folder_name: string;
  volume_number?: number;
  files: File[];
  preserve_filenames?: boolean;
}): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("manga_slug", data.manga_slug);
  fd.append("chapter_main", String(data.chapter_main));
  if (data.chapter_sub !== undefined) fd.append("chapter_sub", String(data.chapter_sub));
  fd.append("chapter_label", data.chapter_label);
  fd.append("chapter_folder_name", data.chapter_folder_name);
  if (data.volume_number !== undefined) fd.append("volume_number", String(data.volume_number));
  if (data.preserve_filenames !== undefined) fd.append("preserve_filenames", String(data.preserve_filenames));
  data.files.forEach((f) => fd.append("files", f));

  return uploadFetch(`${API_BASE_URL}/upload/chapter`, {
    method: "POST",
    body: fd,
  }) as Promise<UploadResult>;
}

export async function uploadBulkChapters(data: {
  manga_slug: string;
  zip_file: File;
  start_chapter?: number;
  end_chapter?: number;
  naming_pattern?: string;
  conflict_strategy?: string;
  dry_run?: boolean;
  parallel?: boolean;
  preserve_filenames?: boolean;
}): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("manga_slug", data.manga_slug);
  fd.append("zip_file", data.zip_file);
  if (data.start_chapter !== undefined) fd.append("start_chapter", String(data.start_chapter));
  if (data.end_chapter !== undefined) fd.append("end_chapter", String(data.end_chapter));
  if (data.naming_pattern) fd.append("naming_pattern", data.naming_pattern);
  if (data.conflict_strategy) fd.append("conflict_strategy", data.conflict_strategy);
  if (data.dry_run !== undefined) fd.append("dry_run", String(data.dry_run));
  if (data.parallel !== undefined) fd.append("parallel", String(data.parallel));
  if (data.preserve_filenames !== undefined) fd.append("preserve_filenames", String(data.preserve_filenames));

  return uploadFetch(`${API_BASE_URL}/upload/bulk-chapters`, {
    method: "POST",
    body: fd,
  }) as Promise<UploadResult>;
}

export async function uploadBulkJson(data: {
  metadata: string;
  zip_file: File;
  conflict_strategy_manga?: string;
  conflict_strategy_chapter?: string;
  dry_run?: boolean;
}): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("metadata", data.metadata);
  fd.append("zip_file", data.zip_file);
  if (data.conflict_strategy_manga) fd.append("conflict_strategy_manga", data.conflict_strategy_manga);
  if (data.conflict_strategy_chapter) fd.append("conflict_strategy_chapter", data.conflict_strategy_chapter);
  if (data.dry_run !== undefined) fd.append("dry_run", String(data.dry_run));

  return uploadFetch(`${API_BASE_URL}/upload/bulk-json`, {
    method: "POST",
    body: fd,
  }) as Promise<UploadResult>;
}

export async function validateJsonConfig(data: {
  config: string;
  check_existing?: boolean;
}): Promise<UploadResult> {
  const body = new URLSearchParams();
  body.append("config", data.config);
  if (data.check_existing !== undefined) body.append("check_existing", String(data.check_existing));

  return uploadFetch(`${API_BASE_URL}/upload/validate-json`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  }) as Promise<UploadResult>;
}

export async function uploadMultipleManga(data: {
  config: string;
  zip_file: File;
  dry_run?: boolean;
}): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("config", data.config);
  fd.append("zip_file", data.zip_file);
  if (data.dry_run !== undefined) fd.append("dry_run", String(data.dry_run));

  return uploadFetch(`${API_BASE_URL}/upload/multiple-manga`, {
    method: "POST",
    body: fd,
  }) as Promise<UploadResult>;
}

export async function uploadSmartImport(data: {
  zip_file: File;
  storage_id?: number;
  type_slug?: string;
  default_status?: string;
  dry_run?: boolean;
}): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("zip_file", data.zip_file);
  if (data.storage_id !== undefined) fd.append("storage_id", String(data.storage_id));
  if (data.type_slug) fd.append("type_slug", data.type_slug);
  if (data.default_status) fd.append("default_status", data.default_status);
  if (data.dry_run !== undefined) fd.append("dry_run", String(data.dry_run));

  return uploadFetch(`${API_BASE_URL}/upload/smart-import`, {
    method: "POST",
    body: fd,
  }) as Promise<UploadResult>;
}

export async function fetchSmartImportExample(): Promise<unknown> {
  return uploadFetch(`${API_BASE_URL}/upload/smart-import/example`);
}