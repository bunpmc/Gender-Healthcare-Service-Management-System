# Supabase Docker

This is a minimal Docker Compose setup for self-hosting Supabase. Follow the steps [here](https://supabase.com/docs/guides/hosting/docker) to get started.

# Tải thư viện nvm và npx

<!-- Libraries -->

nvm install 20
nvm use 20 -> success

# Cài Deno

<!-- Start up -->
<!-- Deno start up -->

VSCode -> Extension -> Deno
Search bar in VSCode -> >Deno Initialize Workspace

# Khởi chạy dự án đầu tiên

<!-- Project start up -->

npx supabase init -> Tạo dự án
npx supabase start -> activate supabase -> Xem trong Docker Desktop click và tên trùng với tên thu mục gốc của dự án hiện xanh hoặc supabase*db*[Tên-folder] đang chạy là được
npx supabase stop -> stop supabase
npx supabase db push -> lần đầu tiêntiên push database len web supabase
npx supabase db pull -> lấy db từ web vềề
npx supabase db reset -> chạy lại file migration khởi tạo lại database (đã có từ trước ở db push)
npx supabase functions new function-name -> tạo edge function  
npx supabase migrations new migration-name -> tạo migration

# Link dự án local vào project chính

Khi tạo như mục Khởi chạy dự án, dự án chỉ mới chạy local có tên miền: http://127.0.0.1:54321
Cần link để đưa lên public project

npx supabase login (nó mở browser tự điền code đê)
npx supabase link --project-ref [project-link] -> [lấy từ https://supabase.com/dashboard/project/[project-link]]
-> Nhập pass: 12345 (pass khi mới tạo project)

<!-- Deploy functions to supabase web -->

npx supabase functions deploy function-name

# Gặp bug thì đọc ở đây

<!-- Unhealthy Supabase_db_[name] Container -->
<!-- log: supabase_db_testFolder container is not ready: unhealthy -->

by: database schema conflict => create new project trong supabase web
by: migrations conflict => rm -rf supabase -> quay lại mục Khởi chạy dự án đầu tiên đồng thời check database schema (viết dơ => conflicts => lỗi unhealthy khi link project supabase)

<!-- Docker bug -->
<!-- Supabase exited || Supabase unhealthy: hot standby -->

Open Docker -> Settings -> Generals -> Tick chon Expose daemon on tcp://localhost:2375 without TLS
