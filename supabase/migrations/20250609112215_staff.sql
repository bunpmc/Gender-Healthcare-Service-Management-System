CREATE OR REPLACE FUNCTION create_staff_member(
  full_name_input TEXT,
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