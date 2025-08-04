drop function if exists "public"."fetch_blogs"();

alter table "public"."otps" add column "email" text;

alter table "public"."otps" alter column "phone" drop not null;

CREATE UNIQUE INDEX unique_email_address ON public.otps USING btree (email);

alter table "public"."otps" add constraint "email_or_phone_required" CHECK (((email IS NOT NULL) OR (phone IS NOT NULL))) not valid;

alter table "public"."otps" validate constraint "email_or_phone_required";

alter table "public"."otps" add constraint "unique_email_address" UNIQUE using index "unique_email_address";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_period_tracking(p_patient_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_cycle_length integer, p_flow_intensity text, p_symptoms jsonb, p_period_description text, p_predictions jsonb, p_period_length integer)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  new_period_id uuid;
  existing_period_id uuid;
begin
  -- Check overlap: ép kiểu timestamp -> date
  select period_id into existing_period_id
  from public.period_tracking
  where patient_id = p_patient_id
    and daterange(start_date::date, end_date::date, '[]') && daterange(p_start_date::date, p_end_date::date, '[]')
  limit 1;

  if existing_period_id is not null then
    -- Update nếu overlap
    update public.period_tracking
    set 
      start_date = p_start_date,
      end_date = p_end_date,
      cycle_length = p_cycle_length,
      flow_intensity = p_flow_intensity,
      symptoms = p_symptoms,
      period_description = p_period_description,
      predictions = p_predictions,
      period_length = p_period_length,
      updated_at = now()
    where period_id = existing_period_id;

    return existing_period_id;
  else
    -- Insert nếu không overlap
    insert into public.period_tracking (
      patient_id,
      start_date,
      end_date,
      cycle_length,
      flow_intensity,
      symptoms,
      period_description,
      predictions,
      period_length
    )
    values (
      p_patient_id,
      p_start_date,
      p_end_date,
      p_cycle_length,
      p_flow_intensity,
      p_symptoms,
      p_period_description,
      p_predictions,
      p_period_length
    )
    returning period_id into new_period_id;

    return new_period_id;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.fetch_blog_id(input_blog_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
declare
  result jsonb;
begin
  -- Tăng view count
  update blog_posts
  set view_count = coalesce(view_count, 0) + 1
  where blog_id = input_blog_id;

  -- Lấy thông tin blog + bác sĩ
  select jsonb_build_object(
    'blog_id', b.blog_id,
    'blog_title', b.blog_title,
    'blog_content', b.blog_content,
    'excerpt', b.excerpt,
    'image_link', b.image_link,
    'blog_tags', b.blog_tags,
    'blog_status', b.blog_status,
    'created_at', b.created_at,
    'updated_at', b.updated_at,
    'doctor_details', jsonb_build_object(
      'id', s.staff_id,
      'fullname', s.full_name,
      'gender', s.gender,
      'img', s.image_link
    )
  )
  into result
  from blog_posts b
  left join staff_members s on b.doctor_id = s.staff_id
  where b.blog_id = input_blog_id;

  if result is null then
    raise exception 'Blog not found';
  end if;

  return result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_daily_revenue(target_date date)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM receipts
  WHERE created_at::date = target_date;

  RETURN total;
END;
---SELECT calculate_daily_revenue('2025-06-11');$function$
;

CREATE OR REPLACE FUNCTION public.count_appointments_by_day(target_date date)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$DECLARE
  appt_count INT;
BEGIN
  SELECT COUNT(*) INTO appt_count
  FROM appointments
  WHERE created_at::date = target_date;

  RETURN appt_count;
END;
--SELECT count_appointments_by_day('2025-06-11');$function$
;

CREATE OR REPLACE FUNCTION public.count_patients_by_month(target_year integer, target_month integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$DECLARE
  patient_count INT;
BEGIN
  SELECT COUNT(*) INTO patient_count
  FROM patients
  WHERE EXTRACT(YEAR FROM created_at) = target_year
    AND EXTRACT(MONTH FROM created_at) = target_month;

  RETURN patient_count;
END;
--SELECT count_patients_by_month(2025, 6);$function$
;

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

CREATE OR REPLACE FUNCTION public.get_staff_by_id(staff_id_input uuid DEFAULT NULL::uuid, full_name_input text DEFAULT NULL::text, department_input department_enum DEFAULT NULL::department_enum, specialty_input speciality_enum DEFAULT NULL::speciality_enum, working_email_input character varying DEFAULT NULL::character varying, years_experience_input integer DEFAULT NULL::integer, role staff_role_enum DEFAULT NULL::staff_role_enum)
 RETURNS TABLE(staff_id uuid, full_name text, role_input staff_role_enum, working_email character varying, department department_enum, years_experience integer, speciality speciality_enum, updated_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
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

CREATE OR REPLACE FUNCTION public.track_period_and_fertility(p_patient_id text, p_start_date date, p_end_date date DEFAULT NULL::date, p_symptoms text[] DEFAULT '{}'::text[], p_flow_intensity text DEFAULT 'medium'::text, p_period_description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
    v_period_id BIGINT;
    v_cycle_length INTEGER;
    v_previous_start_date DATE;
    v_predictions JSONB;
    v_ovulation_date DATE;
    v_fertile_start DATE;
    v_fertile_end DATE;
    v_next_period_date DATE;
BEGIN
    
    IF p_flow_intensity NOT IN ('light', 'medium', 'heavy') THEN
        p_flow_intensity := 'medium';
    END IF;
    
    -- Get the most recent period for this patient (before the current one)
    SELECT start_date INTO v_previous_start_date
    FROM period_tracking
    WHERE patient_id = p_patient_id 
      AND start_date < p_start_date
    ORDER BY start_date DESC
    LIMIT 1;
    
    -- Calculate cycle length if we have a previous period
    IF v_previous_start_date IS NOT NULL THEN
        v_cycle_length := p_start_date - v_previous_start_date;
    ELSE
        v_cycle_length := NULL; -- First period entry
    END IF;
    
    -- Calculate predictions based on cycle length or default 28 days
    DECLARE
        cycle_for_prediction INTEGER := COALESCE(v_cycle_length, 28);
    BEGIN
        -- Calculate ovulation date (typically 14 days before next period)
        v_ovulation_date := p_start_date + cycle_for_prediction - 14;
        
        -- Calculate fertile window (5 days before ovulation + ovulation day)
        v_fertile_start := v_ovulation_date - 5;
        v_fertile_end := v_ovulation_date;
        
        -- Calculate next expected period date
        v_next_period_date := p_start_date + cycle_for_prediction;
        
        -- Build predictions JSON
        v_predictions := jsonb_build_object(
            'cycle_length', cycle_for_prediction,
            'ovulation_date', v_ovulation_date,
            'fertile_window_start', v_fertile_start,
            'fertile_window_end', v_fertile_end,
            'next_period_date', v_next_period_date,
            'calculated_at', NOW()
        );
    END;
    
    -- Insert or update the period entry
    INSERT INTO period_tracking (
        patient_id,
        start_date,
        end_date,
        cycle_length,
        flow_intensity,
        symptoms,
        period_description,
        predictions,
        created_at,
        updated_at
    ) VALUES (
        p_patient_id,
        p_start_date,
        p_end_date,
        v_cycle_length,
        p_flow_intensity,
        p_symptoms,
        p_period_description,
        v_predictions,
        NOW(),
        NOW()
    )
    ON CONFLICT (patient_id, start_date) 
    DO UPDATE SET
        end_date = EXCLUDED.end_date,
        flow_intensity = EXCLUDED.flow_intensity,
        symptoms = EXCLUDED.symptoms,
        period_description = EXCLUDED.period_description,
        predictions = EXCLUDED.predictions,
        updated_at = NOW()
    RETURNING id INTO v_period_id;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Period data tracked successfully',
        'period_id', v_period_id::TEXT,
        'predictions', v_predictions
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error tracking period: ' || SQLERRM
        );
END;$function$
;


