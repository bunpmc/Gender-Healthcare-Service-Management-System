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