# Hướng Dẫn Thiết Lập và Vận Hành Dự Án Supabase với Deno

## Cài Đặt Thư Viện

### Cài đặt nvm và Node.js

1. Cài đặt Node.js phiên bản 20:
   ```bash
   nvm install 20
   ```

2. Sử dụng Node.js phiên bản 20:
   ```bash
   nvm use 20
   ```

## Cài Đặt Deno

1. Cài đặt Deno Extension trong VSCode:
   - Mở VSCode, vào Extensions (Ctrl+Shift+X).
   - Tìm và cài đặt Deno (bởi denoland).

2. Khởi tạo không gian làm việc cho Deno:
   - Nhấn Ctrl+Shift+P, gõ `> Deno: Initialize Workspace`, nhấn Enter.
   - Chấp nhận cấu hình mặc định.

## Khởi Chạy Dự Án

### Khởi Tạo Dự Án Supabase

1. Khởi tạo dự án Supabase local:
   ```bash
   npx supabase init
   ```

2. Khởi động Supabase:
   ```bash
   npx supabase start
   ```
   - Kiểm tra trong Docker Desktop: Container trùng tên thư mục dự án hoặc `supabase_db_[Tên-folder]` phải ở trạng thái chạy (màu xanh).

3. Dừng Supabase:
   ```bash
   npx supabase stop
   ```

### Quản Lý Database

1. Push database lên Supabase cloud (lần đầu):
   ```bash
   npx supabase db push
   ```

2. Pull database từ Supabase cloud về local:
   ```bash
   npx supabase db pull
   ```

3. Reset database (chạy lại migrations):
   ```bash
   npx supabase db reset
   ```

### Tạo Edge Functions và Migrations

1. Tạo edge function:
   ```bash
   npx supabase functions new function-name
   ```

2. Tạo migration:
   ```bash
   npx supabase migrations new migration-name
   ```

## Liên Kết Dự Án Local với Dự Án Supabase Cloud

Dự án local chạy trên `http://127.0.0.1:54321`. Để đưa lên Supabase cloud:

1. Đăng nhập Supabase CLI:
   ```bash
   npx supabase login
   ```

2. Liên kết dự án local với dự án cloud:
   ```bash
   npx supabase link --project-ref [project-link]
   ```
   - Lấy `[project-link]` từ https://supabase.com/dashboard/project/[project-link].
   - Nhập mật khẩu dự án (mặc định: `12345`).

## Triển Khai Edge Functions

Triển khai edge function lên Supabase cloud:
```bash
npx supabase functions deploy function-name
```

## Xử Lý Lỗi Thường Gặp

### Container `supabase_db_[name]` Unhealthy

**Lỗi**: `supabase_db_testFolder container is not ready: unhealthy`

**Nguyên nhân**:
- Xung đột schema database.
- Xung đột migrations.

**Khắc phục**:
1. Xung đột schema: Tạo dự án mới trên Supabase web.
2. Xung đột migrations: Xóa và khởi tạo lại dự án local:
   ```bash
   rm -rf supabase
   npx supabase init
   npx supabase start
   ```

### Lỗi Docker

**Lỗi**: `Supabase exited` hoặc `Supabase unhealthy: hot standby`

**Khắc phục**:
1. Mở Docker Desktop > Settings > General.
2. Tích chọn `Expose daemon on tcp://localhost:2375 without TLS`.
3. Khởi động lại Supabase:
   ```bash
   npx supabase stop
   npx supabase start
   ```
