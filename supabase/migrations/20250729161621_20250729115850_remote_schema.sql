set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.filter_appointments_by_patient_day_status_type(p_patient_id uuid DEFAULT NULL::uuid, p_target_date date DEFAULT NULL::date, p_status process_status DEFAULT NULL::process_status, p_visit_type visit_type_enum DEFAULT NULL::visit_type_enum)
 RETURNS TABLE(appointment_id uuid, patient_id uuid, phone text, email character varying, visit_type visit_type_enum, appointment_status process_status, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN QUERY
  SELECT a.*
  FROM appointments a
  WHERE
    (p_patient_id IS NULL OR a.patient_id = p_patient_id) AND
    (p_target_date IS NULL OR a.created_at::date = p_target_date) AND
    (p_status IS NULL OR a.appointment_status = p_status) AND
    (p_visit_type IS NULL OR a.visit_type = p_visit_type);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.filter_services(p_category_id uuid)
 RETURNS TABLE(service_id uuid, category_id uuid, category_name text, service_name text, service_cost numeric, duration_minutes integer, image_link text, service_description json, excerpt text)
 LANGUAGE plpgsql
AS $function$BEGIN
    RETURN QUERY
    SELECT 
        ms.service_id,
        ms.category_id,
        sc.category_name,
        ms.service_name,
        ms.service_cost,
        ms.duration_minutes,
        ms.image_link,
        ms.service_description,
        ms.excerpt
    FROM 
        medical_services ms
    JOIN 
        service_categories sc ON ms.category_id = sc.category_id
    WHERE
        ms.is_active = TRUE
        AND ms.category_id = p_category_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_slots(p_doctor_id uuid, p_slot_date date, p_start_time time without time zone, p_end_time time without time zone, p_slot_id uuid)
 RETURNS TABLE(slot_id uuid, doctor_slot_id uuid, slot_date date, slot_time time without time zone, doctor_id uuid, appointments_count integer, max_appointments integer)
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN QUERY
  SELECT 
    ds.slot_id,
    dsa.doctor_slot_id,
    ds.slot_date,
    ds.slot_time,
    dsa.doctor_id,
    dsa.appointments_count,
    dsa.max_appointments
  FROM public.slots ds
  JOIN public.doctor_slot_assignments dsa ON ds.slot_id = dsa.slot_id
  WHERE dsa.doctor_id = p_doctor_id
     AND ds.slot_date = p_slot_date
    -- AND ds.slot_time >= p_start_time
    -- AND ds.slot_time <= p_end_time
    AND ds.is_active = TRUE
    AND dsa.appointments_count < dsa.max_appointments
     AND (p_slot_id IS NULL OR dsa.slot_id = p_slot_id)
  ORDER BY ds.slot_time ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_confirm_appointment(p_appointment_id uuid)
 RETURNS record
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_apt RECORD;
    v_slot_id uuid;
BEGIN
    -- VALIDATION PART
    SELECT *
    INTO v_apt
    FROM appointments
    WHERE appointment_id = p_appointment_id
      AND appointment_status != 'confirmed'::process_status;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment does not exist or is confirmed.';
    END IF;

    SELECT slot_id
    INTO v_slot_id
    FROM doctor_slot_assignments
    WHERE slot_id = v_apt.slot_id
      AND appointments_count < max_appointments;
    -- Slot with appointments_count = 1 will be considered as full

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot does not exist or is full.';
    END IF;

    -- UPDATE PART
    UPDATE appointments
    SET appointment_status = 'confirmed'::process_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE appointment_id = p_appointment_id;

    UPDATE doctor_slot_assignments
    SET appointments_count = appointments_count + 1
    WHERE slot_id = v_slot_id
      AND doctor_id = v_apt.doctor_id;
      
    RETURN v_appointment_id;
END;
$function$
;


