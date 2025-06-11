CREATE OR REPLACE FUNCTION create_appointment(
    patient_id_input UUID,
    visit_type_input visit_type_enum,
    appointment_status_input process_status DEFAULT 'pending',
    created_at_input TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at_input TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) RETURNS TABLE (
    appointment_id UUID,
    message TEXT
) AS $$
DECLARE
    v_appointment_id UUID;
BEGIN
    INSERT INTO public.appointments (
        appointment_id,
        patient_id,
        visit_type,
        appointment_status,
        created_at,
        updated_at
    ) VALUES (
        uuid_generate_v4(),
        patient_id_input,
        visit_type_input,
        appointment_status_input,
        created_at_input,
        updated_at_input
    )
    RETURNING appointment_id INTO v_appointment_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 
        NULL, 
        'Error: Appointment not created';
    END IF;

    RETURN QUERY SELECT 
        v_appointment_id, 
        'Appointment created successfully';
EXCEPTION
  WHEN others THEN
    RETURN QUERY SELECT 
      NULL, 
      'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION change_status_appointment(
    appointment_id_input UUID,
    new_status_input process_status,
    updated_at_input TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) RETURNS TABLE (
    message TEXT
) AS $$
BEGIN
    UPDATE public.appointments
    SET 
        appointment_status = new_status_input,
        updated_at = updated_at_input
    WHERE appointment_id = appointment_id_input;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 
        'Error: Appointment not found';
    END IF;

    RETURN QUERY SELECT 
        'Appointment status updated successfully';
EXCEPTION
  WHEN others THEN
    RETURN QUERY SELECT 
      'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_appointment(
    appointment_id_input UUID
) RETURNS TABLE (
    message TEXT
) AS $$
BEGIN
    DELETE FROM public.appointments
    WHERE appointment_id = appointment_id_input;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 
        'Error: Appointment not found';
    END IF;

    RETURN QUERY SELECT 
        'Appointment deleted successfully';
EXCEPTION
  WHEN others THEN
    RETURN QUERY SELECT 
      'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;