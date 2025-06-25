CREATE OR REPLACE FUNCTION create_staff_member(
  user_id_input UUID,
  full_name_input TEXT,
  role_name_input staff_role_enum,
  working_email_input VARCHAR(100),
  department_input department_enum DEFAULT NULL,
  hire_date_input DATE DEFAULT CURRENT_DATE,
  specialty_input speciality_enum DEFAULT NULL,
  license_no_input VARCHAR(50) DEFAULT NULL,
  years_experience_input INTEGER DEFAULT NULL,
  created_at_input TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at_input TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS TABLE (
  staff_id UUID,
  doctor_id UUID,
  message TEXT
) AS $$
BEGIN 
  -- Insert staff
  INSERT INTO public.staff_members (
    staff_id,
    full_name,
    working_email,
    hire_date,
    role,
    years_experience,
    staff_status,
    is_available,
    created_at,
    updated_at
  ) VALUES (
    user_id_input,
    full_name_input,
    working_email_input,
    hire_date_input,
    role_name_input,
    years_experience_input,
    'active',
    TRUE,
    created_at_input,
    updated_at_input
  );

  IF role_name_input = 'doctor' THEN
    INSERT INTO doctor_details (
      doctor_id,
      department,
      speciality,
      license_no
    ) VALUES (
      user_id_input,
      department_input,
      specialty_input,
      license_no_input
    );
    RETURN QUERY SELECT 
      user_id_input,
      user_id_input,
      'Staff member (doctor) created successfully';
  ELSE
    RETURN QUERY SELECT 
      user_id_input,
      NULL,
      'Staff member created successfully';
  END IF;

EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT 
      NULL, NULL, 'Error: User with this email already exists';
  WHEN others THEN
    RETURN QUERY SELECT 
      NULL, NULL, 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_staff_by_id (
  staff_id_input UUID,
  full_name_input TEXT DEFAULT NULL,
  working_email_input VARCHAR(100) DEFAULT NULL,
  years_experience_input INTEGER DEFAULT NULL,
  role_input staff_role_enum DEFAULT NULL,
  updated_at_input TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) RETURNS TABLE (
  staff_id UUID,
  message TEXT
) AS $$
BEGIN
    UPDATE staff_members
    SET 
        full_name = COALESCE(full_name_input, full_name),
        working_email = working_email_input,
        years_experience = COALESCE(years_experience_input, years_experience),
        role = COALESCE(role_input, role),
        updated_at = updated_at_input
    WHERE staff_id = staff_id_input;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
        NULL, 
        'Error: Staff member not found';
    END IF;
    
    RETURN QUERY SELECT 
        staff_id_input, 
        'Staff member updated successfully';
EXCEPTION
  WHEN others THEN
    RETURN QUERY SELECT 
      NULL, 
      'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_staff_by_id(
  staff_id_input UUID
) RETURNS TABLE (staff_id UUID, message TEXT) AS $$
BEGIN
  UPDATE staff_members
  SET staff_status = 'inactive',
      updated_at = NOW()
  WHERE staff_id = staff_id_input;

  RETURN QUERY SELECT 
    staff_id_input, 
    'Staff member deleted successfully';

EXCEPTION
  WHEN others THEN
    RETURN QUERY SELECT 
      NULL, 
      'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_staff_by_id(
    staff_id_input UUID DEFAULT NULL,
    full_name_input TEXT DEFAULT NULL,
    department_input department_enum DEFAULT NULL,
    specialty_input speciality_enum DEFAULT NULL,
    working_email_input VARCHAR(100) DEFAULT NULL,
    years_experience_input INTEGER DEFAULT NULL,
    role staff_role_enum DEFAULT NULL
)
RETURNS TABLE (
    staff_id UUID,
    full_name TEXT,
    role_input staff_role_enum,
    working_email VARCHAR(100),
    department department_enum,
    years_experience INTEGER,
    speciality speciality_enum,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.staff_id,
        s.full_name,
        s.role,
        s.working_email,
        s.years_experience,
        d.speciality,
        d.department,
        s.updated_at,
        s.created_at
    FROM staff_members s
    LEFT JOIN doctor_details d ON s.staff_id = d.doctor_id
    WHERE s.staff_status = 'active'
      AND (staff_id_input IS NULL OR s.staff_id = staff_id_input)
      AND (full_name_input IS NULL OR s.full_name ILIKE '%' || full_name_input || '%')
      AND (working_email_input IS NULL OR s.working_email = working_email_input)
      AND (department_input IS NULL OR d.department = department_input)
      AND (years_experience_input IS NULL OR s.years_experience = years_experience_input)
      AND (specialty_input IS NULL OR d.speciality = specialty_input)
      AND (department_input IS NULL OR d.department = department_input)
      AND (role_input IS NULL OR s.role = role_input);
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            NULL::UUID,
            NULL::TEXT,
            NULL::role_enum,
            NULL::VARCHAR(100),
            NULL::department_enum,
            NULL::INTEGER,
            NULL::speciality_enum,
            NULL::TIMESTAMP WITH TIME ZONE,
            NULL::TIMESTAMP WITH TIME ZONE
        WHERE FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;