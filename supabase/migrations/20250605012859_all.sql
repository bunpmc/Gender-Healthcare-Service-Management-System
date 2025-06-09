-- Enable UUID extension for Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define ENUMs
CREATE TYPE role_enum AS ENUM ('doctor', 'manager', 'advisor');
CREATE TYPE department_enum AS ENUM (
    'reproductive_health',
    'gynecology',
    'urology',
    'transgender_care',
    'sexual_health'
);
CREATE TYPE speciality_enum AS ENUM (
    'gynecologist',
    'urologist',
    'endocrinologist',
    'reproductive_specialist',
    'sexual_health_specialist'
);
CREATE TYPE record_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE process_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved');
CREATE TYPE blog_status AS ENUM ('draft', 'published', 'archived');

-- Create patients table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    allergies JSONB,
    chronic_conditions JSONB,
    past_surgeries JSONB,
    vaccination_status JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_members table
CREATE TABLE public.staff_members (
    staff_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    working_email VARCHAR(255) NOT NULL UNIQUE,
    role role_enum NOT NULL,
    years_experience INTEGER CHECK (years_experience >= 0),
    hired_at DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    staff_status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create doctor_details table
CREATE TABLE public.doctor_details (
    doctor_id UUID PRIMARY KEY REFERENCES public.staff_members(staff_id) ON DELETE CASCADE,
    department department_enum NOT NULL,
    speciality speciality_enum NOT NULL,
    license_no VARCHAR(50) NOT NULL UNIQUE
);

-- Create staff_schedules table
CREATE TABLE public.staff_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.staff_members(staff_id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule TEXT,
    CHECK (end_time > start_time)
);

-- Create staff_certifications table
CREATE TABLE public.staff_certifications (
    certification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.staff_members(staff_id) ON DELETE CASCADE,
    certification_name TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    CHECK (expiry_date IS NULL OR expiry_date > issue_date)
);

-- Create staff_history table
CREATE TABLE public.staff_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.staff_members(staff_id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.staff_members(staff_id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    field_name TEXT NOT NULL CHECK (field_name IN ('full_name', 'working_email', 'role', 'years_experience', 'hired_at', 'is_available', 'department', 'speciality', 'license_no')),
    old_value JSONB,
    new_value JSONB,
    change_reason TEXT
);

-- Create visit_types table
CREATE TABLE public.visit_types (
    visit_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name TEXT NOT NULL UNIQUE CHECK (type_name IN ('consultation', 'follow-up', 'emergency', 'routine'))
);

-- Create receipts table
CREATE TABLE public.receipts (
    receipt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) CHECK (amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create health_records table
CREATE TABLE public.health_records (
    health_record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    doctor_id UUID NOT NULL REFERENCES public.staff_members(staff_id),
    visit_type_id UUID NOT NULL REFERENCES public.visit_types(visit_type_id),
    symptoms TEXT,
    diagnosis TEXT,
    prescription JSONB,
    follow_up_date DATE,
    receipt_id UUID REFERENCES public.receipts(receipt_id),
    record_status record_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (doctor_id != patient_id)
);

-- Create health_record_histories table
CREATE TABLE public.health_record_histories (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_record_id UUID NOT NULL REFERENCES public.health_records(health_record_id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    changed_by UUID NOT NULL REFERENCES public.staff_members(staff_id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    field_name TEXT NOT NULL CHECK (field_name IN ('symptoms', 'diagnosis', 'prescription', 'follow_up_date', 'record_status')),
    old_value JSONB,
    new_value JSONB,
    change_reason TEXT
);

-- Create period_tracking table
CREATE TABLE public.period_tracking (
    period_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    estimated_next_date TIMESTAMP WITH TIME ZONE,
    cycle_length INTEGER CHECK (cycle_length > 0),
    flow_intensity TEXT CHECK (flow_intensity IN ('light', 'medium', 'heavy')),
    symptoms JSONB,
    period_description TEXT,
    predictions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create service_categories table
CREATE TABLE public.service_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name TEXT NOT NULL UNIQUE,
    category_description TEXT
);

-- Create medical_services table
CREATE TABLE public.medical_services (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.service_categories(category_id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    service_description TEXT,
    service_cost NUMERIC CHECK (service_cost >= 0),
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create health_record_services table
CREATE TABLE public.health_record_services (
    health_record_service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_record_id UUID NOT NULL REFERENCES public.health_records(health_record_id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.medical_services(service_id),
    unit_cost NUMERIC CHECK (unit_cost >= 0),
    quantity INTEGER CHECK (quantity > 0) DEFAULT 1,
    service_notes TEXT
);

-- Create service_process_logs table
CREATE TABLE public.service_process_logs (
    service_process_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_record_service_id UUID NOT NULL REFERENCES public.health_record_services(health_record_service_id) ON DELETE CASCADE,
    process_status process_status NOT NULL,
    process_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
    blog_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.staff_members(staff_id),
    blog_title TEXT NOT NULL,
    blog_content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    blog_tags JSONB,
    published_at TIMESTAMP WITH TIME ZONE,
    blog_status blog_status DEFAULT 'draft',
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (blog_status = 'published' AND published_at IS NOT NULL OR blog_status != 'published')
);

-- Create patient_reports table (replacing guest_reports)
CREATE TABLE public.patient_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    report_content TEXT NOT NULL,
    report_description TEXT,
    staff_id UUID REFERENCES public.staff_members(staff_id),
    report_status report_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);