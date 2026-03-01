# N-Group Storage Management API Docs

> **Last Updated:** 27 Feb 2026  
> **Version:** v4 (N-Group Support)  
> **Auth:** Admin only (Bearer Token) untuk semua endpoint `/admin/*`

---

## Overview

Sistem storage sekarang support **N-group** dengan prefix numerik di path file:

| Group | Path Prefix di DB | Contoh |
|-------|-------------------|--------|
| Group 1 | *(tanpa prefix)* | `manga_library/one-piece/Ch_001/001.jpg` |
| Group 2 | `@2/` | `@2/manga_library/one-piece/Ch_001/001.jpg` |
| Group 3 | `@3/` | `@3/manga_library/one-piece/Ch_001/001.jpg` |
| Group N | `@N/` | `@N/manga_library/...` |

> **Backward Compat:** Path lama dengan prefix `@` tunggal (tanpa angka) tetap dibaca sebagai **Group 2**.

Semua perubahan ini **transparan ke frontend** — image proxy URL tetap di format yang sama, routing ke group yang benar dilakukan secara otomatis.

---

## 📡 New Admin API Endpoints

### 1. `GET /api/v1/admin/groups/status`

Get status semua configured storage groups.

**Auth:** Admin Bearer Token

**Response:**
```json
{
  "active_upload_group": 1,
  "auto_switch_enabled": true,
  "configured_groups": [1, 2],
  "groups": {
    "1": {
      "group": 1,
      "primary": "gdrive",
      "backups": ["gdrive1"],
      "all_remotes": ["gdrive", "gdrive1"],
      "path_prefix": "none (normal path)",
      "quota_gb": 1900,
      "configured": true
    },
    "2": {
      "group": 2,
      "primary": "gdrive11",
      "backups": ["gdrive12"],
      "all_remotes": ["gdrive11", "gdrive12"],
      "path_prefix": "@2/",
      "quota_gb": 1900,
      "configured": true
    }
  },
  "quota": {
    "active_upload_group": 1,
    "auto_switch_enabled": true,
    "groups": {
      "1": {
        "group": 1,
        "primary": "gdrive",
        "backups": ["gdrive1"],
        "quota_gb": 1900,
        "uploaded_gb": 245.12,
        "is_full": false,
        "full_since": null,
        "prefix": ""
      },
      "2": {
        "group": 2,
        "primary": "gdrive11",
        "backups": ["gdrive12"],
        "quota_gb": 1900,
        "uploaded_gb": 0.0,
        "is_full": false,
        "full_since": null,
        "prefix": "@2/"
      }
    }
  },
  "daemon_health": {
    "group1_daemons": 2,
    "group2_daemons": 0
  }
}
```

---

### 2. `POST /api/v1/admin/groups/switch`

Manual switch active upload group ke group N.

**Auth:** Admin Bearer Token

**Query Parameters:**

| Parameter | Type | Required | Deskripsi |
|-----------|------|----------|-----------|
| `target_group` | int | ✅ | Group tujuan (1, 2, 3, ...) |

**Contoh Request:**
```bash
# Switch ke group 2
curl -X POST "http://localhost:8000/api/v1/admin/groups/switch?target_group=2" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Kembali ke group 1
curl -X POST "http://localhost:8000/api/v1/admin/groups/switch?target_group=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response sukses:**
```json
{
  "success": true,
  "message": "Switched to Group 2 (prefix: '@2/')",
  "previous_group": 1,
  "active_group": 2,
  "primary_remote": "gdrive11",
  "path_prefix": "@2/"
}
```

**Response gagal (group tidak dikonfigurasi):**
```json
{
  "detail": "Group 3 tidak dikonfigurasi. Configured groups: [1, 2]"
}
```
*HTTP 400*

---

### 3. `GET /api/v1/admin/groups/quota`

Get quota tracking info per group.

**Auth:** Admin Bearer Token

**Response:**
```json
{
  "active_upload_group": 1,
  "auto_switch_enabled": true,
  "group1_quota_limit_gb": 1900,
  "quota_tracker": {
    "active_upload_group": 1,
    "auto_switch_enabled": true,
    "groups": {
      "1": {
        "uploaded_gb": 245.12,
        "is_full": false,
        "full_since": null,
        "quota_gb": 1900,
        "prefix": ""
      }
    }
  }
}
```

---

## 🔄 Perubahan Existing Endpoints

### `GET /api/v1/admin/groups/status` (Update perilaku)

**Sebelum (v3):** Hanya return info Group 1 dan Group 2 (hardcoded).  
**Sesudah (v4):** Return semua configured groups secara dinamis.

**Response shape berubah:**
```diff
# SEBELUM:
{
  "active_upload_group": 1,
-  "group2_path_prefix": "@",
-  "group1": { "primary": "gdrive", ... },
-  "group2": { "configured": false, ... }
}

# SESUDAH:
{
  "active_upload_group": 1,
+  "configured_groups": [1, 2],
+  "groups": {
+    "1": { "primary": "gdrive", "path_prefix": "none (normal path)", ... },
+    "2": { "primary": "gdrive11", "path_prefix": "@2/", ... }
+  },
+  "quota": { ... }
}
```

> ⚠️ **Breaking Change:** Key `group1`, `group2`, `group2_path_prefix` sudah dihapus. Gunakan key `groups["1"]`, `groups["2"]`, dst.

---

### `POST /api/v1/admin/groups/switch` (Update parameter)

**Sebelum (v3):** Parameter `target_group` dibatasi `le=2` (maksimum 2).  
**Sesudah (v4):** Parameter `target_group` minimal `ge=1`, tidak ada batas atas — bisa switch ke group 3, 4, dst. selama dikonfigurasi.

```diff
# Query param sebelumnya:
- target_group: int  (ge=1, le=2)   ← max 2

# Sekarang:
+ target_group: int  (ge=1)          ← tidak terbatas
```

---

## 🖼️ Image Proxy — Tidak Ada Breaking Change

Image proxy URL tetap sama:

```
GET /api/v1/image-proxy/image/{path}
```

**Perubahan internal (transparan ke frontend):**
- Sebelum: hanya support prefix `@` (group 2) atau tanpa prefix (group 1)
- Sesudah: support prefix `@2/`, `@3/`, `@4/`, dst. dan routing otomatis ke group yang benar

Contoh URL yang sekarang valid:
```
# Group 1 (tanpa prefix)
/api/v1/image-proxy/image/manga_library/one-piece/Ch_001/001.jpg

# Group 2 (prefix @2/)
/api/v1/image-proxy/image/@2/manga_library/one-piece/Ch_001/001.jpg

# Group 3 (prefix @3/)
/api/v1/image-proxy/image/@3/manga_library/one-piece/Ch_001/001.jpg

# Legacy format (@ tanpa angka → dianggap group 2)
/api/v1/image-proxy/image/@manga_library/one-piece/Ch_001/001.jpg
```

Response header sekarang juga include storage group info:
```
X-Storage-Group: 2
X-Storage-Mode: serve-daemon-httpx-round-robin-stream-g2
```

---

## 📁 Smart Bulk Import — Perubahan Internal

Endpoint `/api/v1/upload/smart-import` **tidak berubah dari sisi request/response** untuk frontend. Perubahan internal:

1. **Chapter di group 2+:** Path yang disimpan ke DB otomatis pakai prefix `@2/`, `@3/`, dst. sesuai active upload group
2. **`anchor_path` chapter:** Sekarang menyimpan prefix `@N/` sehingga image proxy bisa route ke group yang benar
3. **`preview_url` chapter:** URL path sudah include prefix `@N/`

**Sebelum (v3):**
```json
{
  "anchor_path": "manga_library/slug/Chapter_001/001.jpg",
  "preview_url": "/api/v1/image-proxy/image/manga_library/slug/Chapter_001/001.jpg"
}
```

**Sesudah (v4) — jika upload saat group 2 aktif:**
```json
{
  "anchor_path": "@2/manga_library/slug/Chapter_001/001.jpg",
  "preview_url": "/api/v1/image-proxy/image/@2/manga_library/slug/Chapter_001/001.jpg"
}
```

> ✅ Image proxy URL masih bisa digunakan langsung oleh frontend — tidak perlu parsing prefix secara manual.

---

## ⚙️ Environment Variables

### Tambahan baru untuk Group 3+

```bash
# Group 3 (dikosongkan jika belum pakai)
RCLONE_GROUP_3_PRIMARY=gdrive21
RCLONE_GROUP_3_BACKUPS=gdrive22
RCLONE_GROUP_3_QUOTA_GB=1900

# Group 4 (dikosongkan jika belum pakai)
RCLONE_GROUP_4_PRIMARY=gdrive31
RCLONE_GROUP_4_BACKUPS=gdrive32
RCLONE_GROUP_4_QUOTA_GB=1900
```

Pola untuk group N:
- Primary: `RCLONE_GROUP_N_PRIMARY=<remote_name>`
- Backups: `RCLONE_GROUP_N_BACKUPS=<remote1>,<remote2>`
- Quota: `RCLONE_GROUP_N_QUOTA_GB=<number>`

---

## 🖥️ Contoh UI — Storage Management Panel

```
┌─────────────────────────────────────────────────┐
│  💾 Storage Management                           │
├─────────────────────────────────────────────────┤
│                                                  │
│  Active Upload Group: Group 1 ✅                 │
│  Auto-Switch: Enabled                            │
│                                                  │
│  ── Manual Switch Active Group ──────────────    │
│                                                  │
│  Group 1  Group 1: gdrive + gdrive1              │
│  (●) Group 1  ← aktif                           │
│  ( ) Group 2  ← prefix @2/ | gdrive11           │
│                                                  │
│  [⚡ Switch ke Group 2]   [🔄 Refresh]           │
│                                                  │
│  ── Quota Tracker ────────────────────────────   │
│  Group 1: 245.1 GB / 1900 GB                    │
│  Group 2: 0 GB / 1900 GB                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Flow untuk frontend Storage Management:**

```
1. Load → GET /api/v1/admin/groups/status
           → Tampilkan semua groups dari response.groups
           → Highlight active group dari response.active_upload_group

2. Switch → POST /api/v1/admin/groups/switch?target_group=2
            → Cek response.success
            → Jika true → update UI, tampilkan active_group baru
            → Jika false → tampilkan response.detail sebagai error

3. Refresh → GET /api/v1/admin/groups/quota
             → Update quota display
```

---

## 📊 Changelog

### v4 — 27 Feb 2026 (REVISI TERBARU)

**Fitur Baru:**
- ✅ N-Group support — tidak terbatas 2 group saja
- ✅ Numeric prefix `@N/` di path DB (group 2 → `@2/`, group 3 → `@3/`)
- ✅ Backward compat — path lama `@manga/...` tetap valid sebagai group 2
- ✅ Admin API switch group bisa ke group 3, 4, dst.
- ✅ Smart Bulk Import group-aware — path DB otomatis pakai prefix group aktif
- ✅ Image proxy support `@N/` prefix

**Breaking Changes:**
- ⚠️ Response shape `GET /admin/groups/status` berubah (key `group1`, `group2` diganti dengan `groups.1`, `groups.2`)
- ⚠️ `POST /admin/groups/switch` tidak lagi terbatas `target_group <= 2`

**File yang Berubah:**
```
app/services/storage_group_service.py  ← Ditulis ulang sepenuhnya
app/api/v1/admin_endpoints.py          ← Update 3 endpoints + image proxy helper
app/services/smart_bulk_import_service.py ← Group-aware upload + DB path
.env                                   ← Tambah group 2, 3 sections (dikosongkan)
.env.example                           ← Tambah contoh group 2, 3, 4
```

### v3 — 26 Feb 2026
- ✅ `status.txt` dan `type.txt` support di smart bulk import

### v2 — Feb 2026
- ✅ Alt titles, custom preview per chapter

### v1 — Initial
- ✅ Smart bulk import, auto-detect folder structure

---

## 🔗 Related Endpoints

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/api/v1/admin/groups/status` | GET | Admin | Status semua storage groups |
| `/api/v1/admin/groups/switch` | POST | Admin | Manual switch active upload group |
| `/api/v1/admin/groups/quota` | GET | Admin | Quota tracking info per group |
| `/api/v1/image-proxy/image/{path}` | GET | Public | Serve gambar (group-aware) |
| `/api/v1/image-proxy/health` | GET | Public | Health check image proxy + daemon status |
| `/api/v1/upload/smart-import` | POST | Admin | Smart bulk import ZIP |
