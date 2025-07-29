# Gender Healthcare Service Management System

A modern web-based healthcare platform designed to support both patients and clinic administrators. The system includes:

- A **Product Website** for users to access health services, track their menstrual cycles, and communicate with virtual assistants.
- A **Management Website** for clinic staff (doctors, admins) to manage appointments, patient records, and service analytics.
- A **Supabase-powered backend** providing authentication, database management, API, and edge functions.

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
