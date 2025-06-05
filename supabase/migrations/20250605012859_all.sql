CREATE TABLE customer (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  sex_identify VARCHAR(100),
  login_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_customer_auth_id FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE refreshtoken (
  refreshtoken_id SERIAL PRIMARY KEY,
  customer_id UUID NOT NULL,
  token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_refreshtoken_customer_id FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
);

-- Main user table (replaces customer table - handles all user types)
CREATE TABLE app_users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email VARCHAR(100),
  phone VARCHAR(15),
  sex_identify VARCHAR(100),
  login_type VARCHAR(100),
  avatar_url TEXT,
  date_of_birth DATE,
  address TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(15),
  user_status VARCHAR(50) DEFAULT 'active',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_app_user_auth_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Refresh token table (references user table)
CREATE TABLE refresh_tokens (
  refresh_token_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  token_value TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_refresh_token_user_id FOREIGN KEY (user_id) REFERENCES app_users(user_id) ON DELETE CASCADE
);

-- Role table
CREATE TABLE user_roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  role_description TEXT
);

-- Staff table (for doctors, nurses, admins, etc.)
CREATE TABLE staff_members (
  staff_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- References user table
  role_id INTEGER NOT NULL,
  working_email VARCHAR(100) UNIQUE,
  employee_id VARCHAR(50) UNIQUE,
  department VARCHAR(100),
  hire_date DATE,
  staff_status VARCHAR(50) DEFAULT 'active',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_staff_user_id FOREIGN KEY (user_id) REFERENCES app_users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_role_id FOREIGN KEY (role_id) REFERENCES user_roles(role_id)
);

-- Doctor table (extends staff with medical-specific fields)
CREATE TABLE doctors (
  doctor_id INTEGER PRIMARY KEY,
  specialty VARCHAR(100),
  license_no VARCHAR(50) UNIQUE,
  bio TEXT,
  years_experience INTEGER,
  consultation_fee DECIMAL(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_doctor_staff_id FOREIGN KEY (doctor_id) REFERENCES staff_members(staff_id) ON DELETE CASCADE
);

-- Patient profiles (references user table directly)
CREATE TABLE patients (
  patient_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- References user table
  patient_name TEXT, -- Can be different from user full_name if needed
  sex_biology VARCHAR(50),
  sex_identity VARCHAR(50),
  health_insurance VARCHAR(100),
  allergies TEXT,
  chronic_conditions TEXT,
  past_surgeries TEXT,
  family_medical_history TEXT,
  vaccination_status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_patient_user_id FOREIGN KEY (user_id) REFERENCES app_users(user_id) ON DELETE CASCADE
);

-- Period tracking (references user table)
CREATE TABLE period_tracking (
  period_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- References user table
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  estimated_date TIMESTAMP WITH TIME ZONE,
  estimated_period VARCHAR(50),
  flow_intensity VARCHAR(20), -- light, normal, heavy
  symptoms TEXT,
  period_description TEXT,
  predictions TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_period_user_id FOREIGN KEY (user_id) REFERENCES app_users(user_id) ON DELETE CASCADE
);

-- Guest users (for anonymous reports/consultations)
CREATE TABLE guest_users (
  guest_id SERIAL PRIMARY KEY,
  phone VARCHAR(15) UNIQUE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  sex_identify VARCHAR(50),
  guest_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports from guests
CREATE TABLE guest_reports (
  report_id SERIAL PRIMARY KEY,
  guest_id INTEGER,
  report_content TEXT,
  report_description TEXT,
  staff_id INTEGER, -- Who handles the report
  report_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_report_guest_id FOREIGN KEY (guest_id) REFERENCES guest_users(guest_id) ON DELETE CASCADE,
  CONSTRAINT fk_report_staff_id FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id)
);

-- Service categories
CREATE TABLE service_categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  category_description TEXT
);

-- Medical services
CREATE TABLE medical_services (
  service_id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  service_description TEXT,
  service_cost DECIMAL(10,2),
  duration_minutes INTEGER, -- Estimated service duration
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_service_category_id FOREIGN KEY (category_id) REFERENCES service_categories(category_id)
);

-- Health records/consultations
CREATE TABLE health_records (
  health_record_id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  visit_date TIMESTAMP WITH TIME ZONE,
  doctor_id INTEGER NOT NULL, -- References doctor table
  visit_type VARCHAR(50), -- consultation, follow-up, emergency
  symptoms TEXT,
  diagnosis TEXT,
  prescription TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  receipt_id INTEGER, -- For billing reference
  record_status VARCHAR(100) DEFAULT 'active',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_health_record_patient_id FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT fk_health_record_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
);

-- Junction table for health records and services
CREATE TABLE health_record_services (
  health_record_service_id SERIAL PRIMARY KEY,
  health_record_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_cost DECIMAL(10,2), -- Cost at time of service
  service_notes TEXT,
  CONSTRAINT fk_hrs_health_record_id FOREIGN KEY (health_record_id) REFERENCES health_records(health_record_id) ON DELETE CASCADE,
  CONSTRAINT fk_hrs_service_id FOREIGN KEY (service_id) REFERENCES medical_services(service_id)
);

-- Service process tracking
CREATE TABLE service_process_logs (
  service_process_log_id SERIAL PRIMARY KEY,
  health_record_service_id INTEGER NOT NULL,
  process_status VARCHAR(100) NOT NULL, -- pending, in_progress, completed, cancelled
  process_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_spl_hrs_id FOREIGN KEY (health_record_service_id) REFERENCES health_record_services(health_record_service_id) ON DELETE CASCADE
);

-- Blog posts (1 doctor can have many blogs, 1 blog belongs to 1 doctor)
CREATE TABLE blog_posts (
  blog_id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL, -- References doctor table
  blog_title TEXT NOT NULL,
  blog_content TEXT,
  excerpt TEXT, -- Short summary for previews
  featured_image_url TEXT,
  blog_tags TEXT[], -- Array of tags
  published_at TIMESTAMP WITH TIME ZONE,
  blog_status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_blog_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION create_staff_member(
  full_name_input TEXT,
  email_input VARCHAR(100),
  role_name_input VARCHAR(50),
  working_email_input VARCHAR(100),
  department_input VARCHAR(100) DEFAULT NULL,
  hire_date_input DATE DEFAULT CURRENT_DATE,
  specialty_input VARCHAR(100) DEFAULT NULL,
  license_no_input VARCHAR(50) DEFAULT NULL,
  years_experience_input INTEGER DEFAULT NULL,
  created_at_input TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at_input TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS TABLE (
  user_id UUID,
  staff_id INTEGER,
  doctor_id INTEGER,
  role_id INTEGER,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_role_id INTEGER;
  v_staff_id INTEGER;
  v_doctor_id INTEGER;
BEGIN 
  -- Get role ID
  SELECT role_id INTO v_role_id
  FROM user_roles
  WHERE role_name = role_name_input;

  -- Insert user
  INSERT INTO app_users (
    full_name,
    email,
    user_status,
    created_at,
    updated_at
  ) VALUES (
    full_name_input,
    email_input,
    'active',
    created_at_input,
    updated_at_input
  )
  RETURNING user_id INTO v_user_id;

  -- Insert staff
  INSERT INTO staff_members (
    user_id,
    role_id,
    working_email,
    employee_id,
    department,
    hire_date,
    staff_status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_role_id,
    working_email_input,
    'EMP-' || v_user_id::TEXT,
    department_input,
    hire_date_input,
    'active',
    created_at_input,
    updated_at_input
  )
  RETURNING staff_id INTO v_staff_id;

  -- Insert doctor if applicable
  IF role_name_input = 'doctor' THEN
    INSERT INTO doctors (
      doctor_id,
      specialty,
      license_no,
      years_experience,
      is_available,
      created_at,
      updated_at
    ) VALUES (
      v_staff_id,
      specialty_input,
      license_no_input,
      years_experience_input,
      TRUE,
      created_at_input,
      updated_at_input
    )
    RETURNING doctor_id INTO v_doctor_id;
  ELSE
    v_doctor_id := NULL;
  END IF;

  RETURN QUERY SELECT 
    v_user_id,
    v_staff_id,
    v_doctor_id,
    v_role_id,
    'Staff member created successfully';

EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT 
      NULL, NULL, NULL, NULL,
      'Error: User with this email already exists';
  WHEN others THEN
    RETURN QUERY SELECT 
      NULL, NULL, NULL, NULL,
      'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_staff_by_id (
  staff_id_input INTEGER,
  working_email_input VARCHAR(100),
  department_input VARCHAR(100) DEFAULT NULL,
  years_experience_input DATE DEFAULT CURRENT_DATE,
  specialty_input VARCHAR(100) DEFAULT NULL,
  updated_at_input DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  staff_id INTEGER,
  message TEXT
) AS $$
DECLARE
  v_staff_id INTEGER;
BEGIN
  UPDATE staff_members
  SET 
    working_email = working_email_input,
    department = department_input,
    years_experience = years_experience_input,
    specialty = specialty_input,
    updated_at = updated_at_input
  WHERE staff_id = staff_id_input
  RETURNING staff_id INTO v_staff_id;

  RETURN QUERY SELECT 
    v_staff_id,
    'Staff member updated successfully';

EXCEPTION
  WHEN others THEN
    RETURN QUERY SELECT 
      NULL,
      'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_staff_by_id(
  staff_id_input INTEGER
) RETURNS TABLE (staff_id INTEGER, message TEXT) AS $$
DECLARE
  v_staff_id INTEGER;
BEGIN
  UPDATE staff_members
  SET staff_status = 'inactive', -- Soft delete
      updated_at = NOW()
  WHERE staff_id = staff_id_input
  RETURNING staff_id INTO v_staff_id;
  RETURN QUERY SELECT 
  v_staff_id, 
  'Staff member deleted successfully';
EXCEPTION
  WHEN others THEN
    RETURN QUERY SELECT 
    NULL, 
    'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_staff_by_id(
    staff_id_input INTEGER DEFAULT NULL,
    working_email_input VARCHAR(100) DEFAULT NULL,
    department_input VARCHAR(100) DEFAULT NULL,
    years_experience_input INTEGER DEFAULT NULL,
    specialty_input VARCHAR(100) DEFAULT NULL,
    updated_at_input TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    staff_id INTEGER,
    user_id UUID,
    full_name TEXT,
    role_name VARCHAR(50),
    working_email VARCHAR(100),
    department VARCHAR(100),
    years_experience INTEGER,
    specialty VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.staff_id,
        au.full_name,
        ur.role_name,
        s.working_email,
        s.department,
        d.years_experience,
        d.specialty,
        s.updated_at,
        s.created_at
    FROM staff_members s
    JOIN app_users au ON s.user_id = au.user_id
    JOIN user_roles ur ON s.role_id = ur.role_id
    LEFT JOIN doctors d ON s.staff_id = d.doctor_id
    WHERE s.staff_status = 'active'
      AND (staff_id_input IS NULL OR s.staff_id = staff_id_input)
      AND (working_email_input IS NULL OR s.working_email = working_email_input)
      AND (department_input IS NULL OR s.department = department_input)
      AND (years_experience_input IS NULL OR d.years_experience = years_experience_input)
      AND (specialty_input IS NULL OR d.specialty = specialty_input)
      AND (updated_at_input IS NULL OR s.updated_at = updated_at_input);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            NULL::INTEGER,
            NULL::UUID,
            NULL::TEXT,
            NULL::VARCHAR(50),
            NULL::VARCHAR(100),
            NULL::VARCHAR(100),
            NULL::INTEGER,
            NULL::VARCHAR(100),
            NULL::TIMESTAMP WITH TIME ZONE,
            NULL::TIMESTAMP WITH TIME ZONE
        WHERE FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_health_record(
    user_id_input UUID,
    doctor_id_input INTEGER,
    visit_date_input TIMESTAMP WITH TIME ZONE,
    visit_type_input VARCHAR(50),
    symptoms_input TEXT DEFAULT NULL,
    diagnosis_input TEXT DEFAULT NULL,
    prescription_input TEXT DEFAULT NULL,
    follow_up_date_input TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    patient_name_input TEXT DEFAULT NULL,
    sex_biology_input VARCHAR(50) DEFAULT NULL,
    sex_identity_input VARCHAR(50) DEFAULT NULL,
    health_insurance_input VARCHAR(100) DEFAULT NULL,
    allergies_input TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    patient_id INTEGER,
    health_record_id INTEGER,
    message TEXT
)
AS $$
DECLARE
    v_user_id UUID;
    v_patient_id INTEGER;
    v_doctor_id INTEGER;
    v_health_record_id INTEGER;
BEGIN
    -- Verify user exists in app_users
    SELECT user_id INTO v_user_id
    FROM app_users
    WHERE user_id = user_id_input AND user_status = 'active';

    IF v_user_id IS NULL THEN
        RETURN QUERY
        SELECT
            NULL::UUID,
            NULL::INTEGER,
            NULL::INTEGER,
            'Error: User not found or inactive' AS message;
        RETURN;
    END IF;

    -- Verify doctor exists in doctors
    SELECT doctor_id INTO v_doctor_id
    FROM doctors
    WHERE doctor_id = doctor_id_input AND is_available = TRUE;

    IF v_doctor_id IS NULL THEN
        RETURN QUERY
        SELECT
            NULL::UUID,
            NULL::INTEGER,
            NULL::INTEGER,
            'Error: Doctor not found or unavailable' AS message;
        RETURN;
    END IF;

    -- Check if patient exists; create if not
    SELECT patient_id INTO v_patient_id
    FROM patients
    WHERE user_id = user_id_input;

    IF v_patient_id IS NULL THEN
        INSERT INTO patients (
            user_id,
            patient_name,
            sex_biology,
            sex_identity,
            health_insurance,
            allergies,
            created_at,
            updated_at
        )
        VALUES (
            user_id_input,
            COALESCE(patient_name_input, (SELECT full_name FROM app_users WHERE user_id = user_id_input)),
            sex_biology_input,
            sex_identity_input,
            health_insurance_input,
            allergies_input,
            NOW(),
            NOW()
        )
        RETURNING patient_id INTO v_patient_id;
    END IF;

    -- Create health record
    INSERT INTO health_records (
        patient_id,
        doctor_id,
        visit_date,
        visit_type,
        symptoms,
        diagnosis,
        prescription,
        follow_up_date,
        record_status,
        created_at,
        updated_at
    )
    VALUES (
        v_patient_id,
        v_doctor_id,
        visit_date_input,
        visit_type_input,
        symptoms_input,
        diagnosis_input,
        prescription_input,
        follow_up_date_input,
        'active',
        NOW(),
        NOW()
    )
    RETURNING health_record_id INTO v_health_record_id;

    -- Return result
    RETURN QUERY
    SELECT
        user_id_input,
        v_patient_id,
        v_health_record_id,
        'Health record created successfully' AS message;

EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY
        SELECT
            NULL::UUID,
            NULL::INTEGER,
            NULL::INTEGER,
            'Error: Unique constraint violation (e.g., email or patient data)' AS message;
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT
            NULL::UUID,
            NULL::INTEGER,
            NULL::INTEGER,
            'Error: ' || SQLERRM AS message;
END;
$$ LANGUAGE plpgsql;