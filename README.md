# Directus Publish Extension# directus-publish-extension



Extension Directus untuk mengelola dan mem-build static site generators (Gatsby, Next.js, etc.) langsung dari admin panel Directus.To install dependencies:



## 🎯 Fitur```bash

bun install

- ✅ **Manajemen Multiple Sites** - Kelola beberapa site dalam satu extension```

- ✅ **Auto Build Tracking** - Deteksi otomatis perubahan data Directus sejak build terakhir

- ✅ **Build Monitoring** - Monitor status build secara real-timeTo run:

- ✅ **Log Viewer** - Lihat output build langsung dari UI

- ✅ **Environment Variables** - Konfigurasi environment variable per site```bash

- ✅ **Admin Only** - Hanya admin yang bisa mengaksesbun run index.ts

```

## 📦 Instalasi

This project was created using `bun init` in bun v1.2.11. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

### 1. Install Dependencies

```bash
bun install
```

### 2. Build Extension

```bash
bun run build
```

### 3. Deploy ke Directus

Extension akan di-build ke folder `dist/`:
- `dist/app.js` - Module UI (frontend)
- `dist/api.js` - API Endpoint (backend)

Copy folder `dist/` ke direktori extensions Directus Anda:

```
<directus-project>/extensions/directus-publish-extension/
```

### 4. Restart Directus

Restart server Directus agar extension dimuat.

## 🚀 Penggunaan

### Setup Site Baru

1. Buka **Publish** module dari sidebar Directus
2. Klik tab **Settings**
3. Klik tombol **+** (Add Site)
4. Isi form:
   - **Site Name**: Nama untuk identifikasi (e.g., "Production Site")
   - **Site URL**: URL dimana site dapat diakses (e.g., "https://mysite.com")
   - **Site Path**: Path absolut ke source code di server (e.g., "/var/www/mysite")
   - **Build Command**: npm script untuk build (e.g., "build" untuk `npm run build`)
   - **Environment Variables** (opsional): Key-value pairs untuk environment

### Build Site

1. Buka tab **Build Sites**
2. Akan muncul list semua site yang sudah dikonfigurasi
3. Site akan menampilkan:
   - Status: Created / Building / Published / Build Failed
   - Last Updated: Timestamp build terakhir
   - Update Available: Indicator jika ada perubahan data sejak build terakhir
4. Klik tombol **Build** untuk memulai build
5. Monitor progress secara real-time
6. Klik **Log** untuk melihat output build

### Melihat Log Build

- Klik tombol **Log** pada site card
- Drawer akan muncul menampilkan:
  - Current Status
  - Last Updated timestamp
  - Build log output (live updating saat building)

### Menghapus Site

1. Buka tab **Settings**
2. Klik tombol **Delete** pada site yang ingin dihapus
3. Konfirmasi penghapusan
4. **Note**: Ini hanya menghapus konfigurasi, bukan source code di server

## 🏗️ Arsitektur

### Backend (Endpoint)

File: `src/endpoint-publish/index.ts`

**API Endpoints:**

- `GET /endpoint-publish/build/:site` - Trigger build untuk site tertentu
- `GET /endpoint-publish/status/:site` - Get status & log untuk site

**Proses Build:**

1. Validasi site configuration dari database
2. Buat temporary file untuk log
3. Update status ke "Building..."
4. Jalankan npm command dengan environment variables
5. Stream output ke log file
6. Update status berdasarkan exit code (success/failed)
7. Track activity ID untuk deteksi update

### Frontend (Module)

File: `src/module-publish/`

**Struktur:**

```
module-publish/
├── index.ts              # Module definition & routing
├── settings.ts           # API helper functions
├── config.ts             # Shared configuration
├── routes/
│   ├── build.vue        # Build Sites page
│   └── settings.vue     # Settings page
└── components/
    ├── Sites.vue        # Site cards component
    ├── Navigation.vue   # Sidebar navigation
    ├── LogDrawer.vue    # Build log viewer
    ├── Dialog.vue       # Confirmation dialogs
    ├── addSiteDrawer.vue # Add site form
    ├── Message.vue      # Info messages
    └── error.vue        # Error display
```

### Database Schema

Extension membuat collection `melvishniz_publish_node` (hidden) dengan struktur key-value:

| Field | Type | Description |
|-------|------|-------------|
| site | integer | Site ID (grouping key) |
| key | string | Property name |
| value | text | Property value |

**Keys per Site:**

- `site-id`: Unique identifier
- `site-name`: Display name
- `site-path`: Source code path
- `site-command`: npm build command
- `site-url`: Public URL
- `site-env`: Environment variables (JSON)
- `build-status`: Current build status
- `build-log`: Path to log file
- `build-timestamp`: Last build time
- `build-activity`: Last Directus activity ID

## ⚙️ Konfigurasi

Edit `src/config.ts` untuk customisasi:

```typescript
const extension_name = "melvishniz-publish-node";  // Ubah sesuai kebutuhan
const collection_name = "melvishniz_publish_node"; // Collection name

export const config = {
  extension: extension_name,
  // ... other configs
  allow_concurrent_builds: false,  // Set true untuk allow multiple builds
};
```

## 🔐 Security

- **Admin Only**: Hanya user dengan `admin_access` yang bisa mengakses
- **Server-side Execution**: Build command dijalankan di server Directus
- **Path Validation**: Pastikan `site-path` aman dan terbatas

## 🛠️ Development

### Development Mode

```bash
bun run dev
```

Ini akan watch changes dan rebuild otomatis tanpa minifikasi.

### Link ke Directus Local

```bash
bun run link
```

### Validate Extension

```bash
bun run validate
```

## 📝 Use Cases

### Static Site Generators

- **Gatsby**: Build setelah update konten
- **Next.js**: Regenerate static pages
- **Hugo/Jekyll**: Rebuild blog posts
- **Gridsome**: Update Vue static site

### Deployment Workflows

1. Content editor update konten di Directus
2. Check "Updates Available" indicator
3. Klik "Build" button
4. Site automatically rebuilds
5. Changes go live

### CI/CD Integration

Extension dapat diintegrasikan dengan:
- Post-build hooks untuk deployment
- Webhook notifications
- Custom build scripts

## 🐛 Troubleshooting

### Build Gagal

1. Check log untuk error details
2. Verifikasi `site-path` benar
3. Pastikan npm dependencies terinstall di server
4. Check permissions untuk write log files

### Extension Tidak Muncul

1. Pastikan sudah restart Directus
2. Check console untuk errors
3. Verify file ada di `extensions/` folder
4. Check user memiliki admin access

### Environment Variables Tidak Work

- Pastikan format JSON benar di form
- Check log apakah env dikirim ke command
- Verifikasi build script menggunakan env vars

## 📄 License

MIT

## 🤝 Contributing

Pull requests welcome! Untuk perubahan major, mohon buka issue dulu.

## 📧 Support

Jika ada pertanyaan atau issue, silakan buka issue di repository.
