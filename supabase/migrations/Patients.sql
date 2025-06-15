CREATE OR REPLACE FUNCTION count_patients_by_month(
  target_year INT,
  target_month INT
)
RETURNS INT AS $$
DECLARE
  patient_count INT;
BEGIN
  SELECT COUNT(*) INTO patient_count
  FROM patients
  WHERE EXTRACT(YEAR FROM created_at) = target_year
    AND EXTRACT(MONTH FROM created_at) = target_month;

  RETURN patient_count;
END;
$$ LANGUAGE plpgsql;
-------

---

--------------------
CREATE OR REPLACE FUNCTION search_patients_by_fields(
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  email VARCHAR,
  date_of_birth DATE,
  gender gender_enum,
  allergies json,
  chronic_conditions json,
  past_surgeries json,
  vaccination_status  vaccination_status_enum,
  patient_status patient_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  image_link text,
  bio text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.full_name, p.phone, p.email,
    p.date_of_birth, p.gender, p.allergies,
    p.chronic_conditions,
    p.past_surgeries,
    p.vaccination_status, p.patient_status, p.created_at,p.updated_at,p.image_link,p.bio
  FROM 
    patients p
  WHERE 
    (p_full_name IS NULL OR p.full_name ILIKE '%' || p_full_name || '%') AND
    (p_phone IS NULL OR p.phone ILIKE '%' || p_phone || '%') AND
    (p_email IS NULL OR p.email ILIKE '%' || p_email || '%');
END;
$$ LANGUAGE plpgsql;
-------------
CREATE OR REPLACE FUNCTION create_patient(
  p_full_name TEXT,
  p_phone TEXT,
  p_email VARCHAR,
  p_date_of_birth DATE,
  p_gender gender_enum,
  p_allergies JSON DEFAULT NULL,
  p_chronic_conditions JSON DEFAULT NULL,
  p_past_surgeries JSON DEFAULT NULL,
  p_vaccination_status vaccination_status_enum DEFAULT 'not_vaccinanted',
  p_patient_status patient_status DEFAULT 'active',
  p_image_link TEXT DEFAULT NULL,
  p_bio TEXT
)
RETURNS Boolean AS $$

BEGIN
  INSERT INTO patients (
    full_name, phone, email, date_of_birth, gender,
    allergies, chronic_conditions, past_surgeries,
    vaccination_status, patient_status, ,created_at, updated_at,image_link,bio
  )
  VALUES (
    p_full_name, p_phone, p_email, p_date_of_birth, p_gender,
    p_allergies, p_chronic_conditions, p_past_surgeries,
    p_vaccination_status, p_patient_status,  now(), now(),p_image_link,p_bio
  )
  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting medical service: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_patient(
  p_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_email VARCHAR,
  p_date_of_birth DATE,
  p_gender gender_enum,
  p_allergies JSON  ,
  p_chronic_conditions JSON  ,
  p_past_surgeries JSON  ,
  p_image_link TEXT  ,
  p_bio TEXT  ,
  p_vaccination_status vaccination_status_enum DEFAULT 'not_vaccinated',
  p_patient_status patient_status DEFAULT 'active'
  
)
RETURNS Boolean AS $$

BEGIN
  INSERT INTO patients (
    id,full_name, phone, email, date_of_birth, gender,
    allergies, chronic_conditions, past_surgeries,
    vaccination_status, patient_status, created_at, updated_at,image_link,bio
  )
  VALUES (
    p_id,p_full_name, p_phone, p_email, p_date_of_birth, p_gender,
    p_allergies, p_chronic_conditions, p_past_surgeries,
    p_vaccination_status, p_patient_status,  now(), now(),p_image_link,p_bio
  );
  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting medical service: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
-------------------------

CREATE OR REPLACE FUNCTION count_appointments_by_status(
  target_status process_status
)
RETURNS INT AS $$
DECLARE
  appt_count INT;
BEGIN
  SELECT COUNT(*) INTO appt_count
  FROM appointments
  WHERE process_status = target_status;

  RETURN appt_count;
END;
$$ LANGUAGE plpgsql;