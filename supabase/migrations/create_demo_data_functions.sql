-- Create function to setup demo data for doctor
CREATE OR REPLACE FUNCTION setup_doctor_demo_data(doctor_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result_data JSON;
    slot_count INTEGER;
    appointment_count INTEGER;
    category_uuid UUID;
    patient_ids UUID[];
    slot_ids UUID[];
    i INTEGER;
BEGIN
    -- Get or create service category
    SELECT category_id INTO category_uuid 
    FROM service_categories 
    WHERE category_name = 'General Consultation' 
    LIMIT 1;
    
    IF category_uuid IS NULL THEN
        INSERT INTO service_categories (category_id, category_name, category_description)
        VALUES (gen_random_uuid(), 'General Consultation', 'General medical consultation')
        RETURNING category_id INTO category_uuid;
    END IF;

    -- Check if doctor has slots
    SELECT COUNT(*) INTO slot_count
    FROM doctor_slot_assignments dsa
    WHERE dsa.doctor_id = doctor_uuid;

    -- Create slots if none exist
    IF slot_count = 0 THEN
        -- Create 5 sample slots for next 5 days
        FOR i IN 0..4 LOOP
            INSERT INTO slots (slot_id, slot_date, slot_time, is_active)
            VALUES (
                gen_random_uuid(),
                CURRENT_DATE + (i || ' days')::INTERVAL,
                CASE 
                    WHEN i % 2 = 0 THEN '09:00:00'::TIME
                    ELSE '14:00:00'::TIME
                END,
                true
            );
        END LOOP;

        -- Assign slots to doctor
        INSERT INTO doctor_slot_assignments (doctor_slot_id, doctor_id, slot_id, max_appointments, appointments_count)
        SELECT 
            gen_random_uuid(),
            doctor_uuid,
            s.slot_id,
            3, -- max 3 appointments per slot
            0  -- initially 0 appointments
        FROM slots s
        WHERE s.slot_date >= CURRENT_DATE
        AND s.slot_date <= CURRENT_DATE + INTERVAL '4 days'
        AND NOT EXISTS (
            SELECT 1 FROM doctor_slot_assignments dsa2 
            WHERE dsa2.doctor_id = doctor_uuid AND dsa2.slot_id = s.slot_id
        );
    END IF;

    -- Get some existing patients for appointments
    SELECT ARRAY(
        SELECT p.id 
        FROM patients p 
        LIMIT 3
    ) INTO patient_ids;

    -- Get doctor's slot IDs
    SELECT ARRAY(
        SELECT dsa.doctor_slot_id
        FROM doctor_slot_assignments dsa
        WHERE dsa.doctor_id = doctor_uuid
        LIMIT 3
    ) INTO slot_ids;

    -- Create sample appointments if patients and slots exist
    IF array_length(patient_ids, 1) > 0 AND array_length(slot_ids, 1) > 0 THEN
        -- Create 2 confirmed appointments for today/tomorrow
        FOR i IN 1..LEAST(2, array_length(patient_ids, 1), array_length(slot_ids, 1)) LOOP
            INSERT INTO appointments (
                appointment_id,
                patient_id,
                doctor_id,
                slot_id,
                category_id,
                phone,
                email,
                visit_type,
                appointment_status,
                schedule,
                appointment_date,
                appointment_time,
                message
            )
            SELECT 
                gen_random_uuid(),
                patient_ids[i],
                doctor_uuid,
                slot_ids[i],
                category_uuid,
                p.phone,
                p.email,
                'consultation',
                'confirmed',
                'Morning',
                CURRENT_DATE + ((i-1) || ' days')::INTERVAL,
                '09:00:00'::TIME,
                'Demo appointment #' || i
            FROM patients p
            WHERE p.id = patient_ids[i]
            ON CONFLICT (appointment_id) DO NOTHING;
        END LOOP;

        -- Update slot appointment counts
        UPDATE doctor_slot_assignments
        SET appointments_count = (
            SELECT COUNT(*)
            FROM appointments a
            WHERE a.slot_id = doctor_slot_assignments.doctor_slot_id
        )
        WHERE doctor_id = doctor_uuid;
    END IF;

    -- Return result summary
    SELECT json_build_object(
        'success', true,
        'doctor_id', doctor_uuid,
        'slots_created', (
            SELECT COUNT(*) FROM doctor_slot_assignments 
            WHERE doctor_id = doctor_uuid
        ),
        'appointments_created', (
            SELECT COUNT(*) FROM appointments 
            WHERE doctor_id = doctor_uuid
        ),
        'message', 'Demo data setup completed successfully'
    ) INTO result_data;

    RETURN result_data;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to setup demo data'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_doctor_demo_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION setup_doctor_demo_data(UUID) TO anon;


-- Create function to reset demo data
CREATE OR REPLACE FUNCTION reset_doctor_demo_data(doctor_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result_data JSON;
BEGIN
    -- Delete appointments first (due to foreign key constraints)
    DELETE FROM appointments 
    WHERE doctor_id = doctor_uuid 
    AND message LIKE 'Demo appointment%';

    -- Delete doctor slot assignments
    DELETE FROM doctor_slot_assignments 
    WHERE doctor_id = doctor_uuid;

    -- Delete orphaned slots (slots not assigned to any doctor)
    DELETE FROM slots 
    WHERE slot_id NOT IN (
        SELECT DISTINCT slot_id 
        FROM doctor_slot_assignments 
        WHERE slot_id IS NOT NULL
    )
    AND slot_date >= CURRENT_DATE;

    SELECT json_build_object(
        'success', true,
        'doctor_id', doctor_uuid,
        'message', 'Demo data reset completed successfully'
    ) INTO result_data;

    RETURN result_data;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to reset demo data'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_doctor_demo_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_doctor_demo_data(UUID) TO anon;
