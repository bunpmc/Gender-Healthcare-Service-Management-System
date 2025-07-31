# Gender Healthcare Service Management System

A modern web-based healthcare platform designed to support both patients and clinic administrators. The system includes:

* A **Product Website** for users to access health services, track their menstrual cycles, and communicate with virtual assistants.
* A **Management Website** for clinic staff (doctors, admins) to manage appointments, patient records, and service analytics.
* A **Supabase-powered backend** providing authentication, database management, API, and edge functions.

---

## Project Structure

```bash
Gender-Healthcare-Service-Management-System/
├── apps/
│   ├── product-web/         # Public-facing website for users/patients
│   └── management-web/      # Admin dashboard for clinic staff
├── supabase/                # Supabase schema, RLS, seed, edge functions
├── docker-compose.yml       # Optional: containerized services
├── .gitignore
├── .dockerignore
└── README.md
```

---

## How to Use

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/Gender-Healthcare-Service-Management-System.git
cd Gender-Healthcare-Service-Management-System
```

---

### 2. Set Up Supabase

> You need a Supabase project. If you don’t have one, [create a free Supabase account](https://supabase.com).

```bash
cd supabase
supabase login
supabase init
supabase start     # start local dev instance
```

* Add your `.env` file with your Supabase URL and service role key.
* Run migrations and seed data (if available):

```bash
supabase db reset
```

---

### 3. Set Up Environment Files

Inside `apps/product-web/` and `apps/management-web/`, create `.env` files:

```env
# Common example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

### 4. Run Frontend Apps

Make sure you have Angular CLI installed:

```bash
npm install -g @angular/cli
```

Then:

```bash
# Run product site
cd apps/product-web
npm install
ng serve --port 4200

# In another terminal, run management site
cd apps/management-web
npm install
ng serve --port 4300
```

Visit:

* Product Web: [http://localhost:4200](http://localhost:4200)
* Management Web: [http://localhost:4300](http://localhost:4300)

---

### 5. (Optional) Docker Setup

If using Docker:

```bash
docker-compose up --build
```

Make sure your environment variables are included in `docker-compose.yml`.

---

### 6. Deploy Edge Functions

```bash
cd supabase
supabase functions deploy <function-name>
```

You can find functions in `supabase/functions/`.
