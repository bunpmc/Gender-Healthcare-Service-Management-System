CREATE OR REPLACE FUNCTION "public"."add_doctor"("p_doctor_id" "uuid", "p_license_no" character varying) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
  INSERT INTO doctor_details(doctor_id, license_no)
  VALUES (p_doctor_id, p_license_no);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
 --select from add_doctor (doctor_uuid , license_no)$$;


CREATE OR REPLACE FUNCTION "public"."check_doctor_verified"("p_doctor_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  doctor_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM doctor_details WHERE doctor_id = p_doctor_id) INTO doctor_exists;
  RETURN doctor_exists;
END;
$$;


CREATE OR REPLACE FUNCTION "public"."create_doctor_certificate"("p_staff_id" "uuid", "p_certification_name" "text", "p_issue_date" "date", "p_expiry_date" "date") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO doctor_certifications (
    staff_id,
    certification_name,
    issue_date,
    expiry_date
  ) VALUES (
    p_staff_id,
    p_certification_name,
    p_issue_date,
    p_expiry_date
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


CREATE OR REPLACE FUNCTION "public"."create_health_histories"("p_health_record_id" "uuid", "p_patient_id" "uuid", "p_changed_by" "uuid", "p_changed_at" timestamp with time zone, "p_field_name" "text", "p_old_value" "jsonb", "p_new_value" "jsonb", "p_change_reason" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
  INSERT INTO health_record_histories (
  health_record_id ,
  patient_id ,
  changed_by ,
  changed_at ,
  field_name ,
  old_value ,
  new_value ,
  change_reason 
  ) VALUES (
  
    p_health_record_id ,
  p_patient_id ,
  p_changed_by ,
  P_changed_at ,
  p_field_name ,
  p_old_value ,
  p_new_value ,
  p_change_reason 
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting medical service: %', SQLERRM;
    RETURN FALSE;
END;
  --'4af11612-9a99-4875-ae11-22c3c04df6b3',  -- p_health_record_id
  --'59f432b0-4219-4057-97dd-0eaf87e17c32',  -- p_patient_id
  --'d12b196f-5a94-4330-81a3-5af9fa6a7fbc',  -- p_changed_by
  --NOW(),                                   -- p_changed_at
  --'diagnosis',                             -- p_field_name
  -- '"Cảm cúm"'::jsonb,                  -- p_old_value
  --  '"Viêm họng"'::jsonb,             -- p_new_value
 -- 'Bệnh nhân quay lại tái khám, chẩn đoán mới.'  -- p_change_reason




CREATE OR REPLACE FUNCTION "public"."create_health_record"("p_patient_id" "uuid", "p_visit_date" "date", "p_doctor_id" "uuid", "p_visit_type_id" "uuid", "p_symptoms" "text", "p_diagnosis" "text", "p_prescription" "jsonb" DEFAULT NULL::"jsonb", "p_follow_up_date" "date" DEFAULT NULL::"date", "p_receipt_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
  INSERT INTO health_records (

    patient_id,
    visit_date,
    doctor_id,
    visit_type_id,
    symptoms,
    diagnosis,
    prescription,
    follow_up_date,
    receipt_id,
    record_status,
    created_at,
    updated_at
  ) VALUES (
  
    p_patient_id,
    p_visit_date,
    p_doctor_id,
    p_visit_type_id,
    p_symptoms,
    p_diagnosis,
    p_prescription,
    p_follow_up_date,
    p_receipt_id,
    'draft'::record_status,  -- Ép kiểu ENUM đúng cách
    NOW(),
    NOW()
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO debug_logs(message)
    VALUES('Error inserting visit type: ' || SQLERRM);
    RETURN FALSE;
END;
  --'59f432b0-4219-4057-97dd-0eaf87e17c32', --uuid patient
  --'2025-06-09',
  --'d12b196f-5a94-4330-81a3-5af9fa6a7fbc', --uuid doctor
  --'afbda376-1bd2-4ae4-be4d-ae741f35a4c7',-- visittypeuuid type
  ---'Sốt nhẹ',
 -- 'Cảm cúm',
 -- NULL,
 -- NULL,
 -- '9026afbc-95dc-4f0f-bde6-bb49bbf80fdd' uuid receipts




CREATE OR REPLACE FUNCTION "public"."create_health_record_service"("p_health_record_id" "uuid", "p_service_id" "uuid", "p_unit_cost" numeric, "p_quantity" integer, "p_service_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO health_record_services (

    health_record_id,
    service_id,
    unit_cost,
    quantity,
    service_notes
  ) VALUES (
   
    p_health_record_id,
    p_service_id,
    p_unit_cost,
    p_quantity,
    p_service_notes
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting medical service: %', SQLERRM;
    RETURN FALSE;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."create_medical_service"("p_category_id" "uuid", "p_service_name" "text", "p_service_description" "text", "p_service_cost" numeric, "p_duration_minutes" integer, "p_is_active" boolean DEFAULT true) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
  INSERT INTO medical_services (
    
    category_id,
    service_name,
    service_description,
    service_cost,
    duration_minutes,
    is_active
  ) VALUES (
   
    p_category_id,
    p_service_name,
    p_service_description,
    p_service_cost,
    p_duration_minutes,
    p_is_active
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting medical service: %', SQLERRM;
    RETURN FALSE;
END;
 -- '79a2c5ed-900a-412c-a3ca-7b4a01c07e4f',  -- category_id
  --'Khám tổng quát',
 -- 250000,            -- cost
 -- 30,                -- thời gian 30 phút
 -- TRUE




CREATE OR REPLACE FUNCTION "public"."create_patient"("p_id" "uuid", "p_name" "text", "p_allergies" "jsonb" DEFAULT NULL::"jsonb", "p_chronic_conditions" "jsonb" DEFAULT NULL::"jsonb", "p_past_surgeries" "jsonb" DEFAULT NULL::"jsonb", "p_vaccination_status" "jsonb" DEFAULT NULL::"jsonb", "p_patient_status" "public"."patient_status" DEFAULT 'in_treatment'::"public"."patient_status") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  INSERT INTO patients (
    id,
    name,
    allergies,
    chronic_conditions,
    past_surgeries,
    vaccination_status,
    patient_status,       
    created_at,
    updated_at
  )
  VALUES (
    p_id,
    p_name,
    p_allergies,
    p_chronic_conditions,
    p_past_surgeries,
    p_vaccination_status,
    p_patient_status,       
    NOW(),
    NOW()
  );

  RETURN p_id;
END;
  --'59f432b0-4219-4057-97dd-0eaf87e17c32',
  --'Nguyễn Văn A',
  --'[ "kháng sinh", "latex" ]'::jsonb,
  --'[ "HIV", "viêm gan B" ]'::jsonb,
  --'[ "phẫu thuật bao quy đầu" ]'::jsonb,
  --'{ "HPV": "đã tiêm", "HIV": "chưa tiêm" }'::jsonb
  --




CREATE OR REPLACE FUNCTION "public"."create_patient_report"("p_patient_id" "uuid", "p_report_content" "text", "p_report_description" "text", "p_staff_id" "uuid", "p_created_at" timestamp with time zone, "p_updated_at" timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
  INSERT INTO patient_reports (
   patient_id ,
  report_content ,
  report_description ,
  staff_id ,
  report_status ,
  created_at ,
  updated_at 
  ) VALUES (
  
    p_patient_id ,
  p_report_content ,
  p_report_description ,
  p_staff_id ,
  'pending'::report_status,
  p_created_at ,
  p_updated_at 
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting medical service: %', SQLERRM;
    RETURN FALSE;
END;
   -- '59f432b0-4219-4057-97dd-0eaf87e17c32'::uuid,
   -- 'This is a test report content',
   -- 'Test report description',
    --'d12b196f-5a94-4330-81a3-5af9fa6a7fbc'::uuid,
    --NOW(),
    --NOW()
  --);$$;




CREATE OR REPLACE FUNCTION "public"."create_period_tracking"("p_patient_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_estimated_next_date" timestamp with time zone, "p_cycle_length" integer, "p_flow_intensity" "text", "p_symptoms" "jsonb", "p_period_description" "text", "p_predictions" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO period_tracking (
    patient_id,
    start_date,
    end_date,
    estimated_next_date,
    cycle_length,
    flow_intensity,
    symptoms,
    period_description,
    predictions,
    created_at,
    updated_at
  )
  VALUES (
    p_patient_id,
    p_start_date,
    p_end_date,
    p_estimated_next_date,
    p_cycle_length,
    p_flow_intensity,
    p_symptoms,
    p_period_description,
    p_predictions,
    NOW(),
    NOW()
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."create_receipts"("p_patient_id" "uuid", "p_amount" numeric) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
insert into receipts(
  patient_id,
  amount,
  created_at
)   values (
  p_patient_id,
  p_amount,
  NOW()
);
return true;
exception 
when others then
return false;
end;$$;




CREATE OR REPLACE FUNCTION "public"."create_service_category"("p_category_name" "text", "p_category_description" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
  INSERT INTO service_categories (
    category_name,
    category_description
  )
  VALUES (
    p_category_name,
    p_category_description
    
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting service category: %', SQLERRM;
    RETURN FALSE;
END;




CREATE OR REPLACE FUNCTION "public"."create_staff_schedule"("p_staff_id" "uuid", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_recurring" boolean, "p_recurrence_rule" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
  INSERT INTO staff_schedules (
    staff_id,
    start_time,
    end_time,
    is_recurring,
    recurrence_rule
  )
  VALUES (
  p_staff_id,
  p_start_time,
  p_end_time,
  p_is_recurring,
  p_recurrence_rule
    
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting service category: %', SQLERRM;
    RETURN FALSE;
END;
 -- '2025-06-10 12:00:00+07',             -- end_time
 -- 'FREQ=WEEKLY;BYDAY=MO,WE,FR'          -- recurrence_rule (ví dụ: mỗi tuần vào thứ 2, 4, 6)








CREATE OR REPLACE FUNCTION "public"."create_visit_type"("p_type_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN 
  INSERT INTO visit_types(type_name)
  VALUES (p_type_name);

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO debug_logs(message)
    VALUES('Error inserting visit type: ' || SQLERRM);
    RETURN FALSE;
END;


CREATE OR REPLACE FUNCTION "public"."delete_draft_blog_by_id"("p_blog_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM blog_posts
  WHERE blog_id = p_blog_id AND blog_status = 'draft';

  RETURN FOUND; -- true nếu có blog bị xóa, false nếu không thỏa điều kiện
END;
$$;






CREATE OR REPLACE FUNCTION "public"."increment_blog_view_count"("p_blog_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$-- viewcount tang moi khi click vao xem
BEGIN
    UPDATE blog_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE blog_id = p_blog_id;
END;




CREATE OR REPLACE FUNCTION "public"."insert_blog_post"("p_doctor_id" "uuid", "p_blog_title" "text", "p_blog_content" "text", "p_excerpt" "text", "p_featured_image_url" "text", "p_blog_tags" "jsonb", "p_published_at" timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO blog_posts (
        doctor_id,
        blog_title,
        blog_content,
        excerpt,
        featured_image_url,
        blog_tags,               -- cột này phải có kiểu jsonb trong table
        published_at,
        blog_status,
        view_count,
        created_at,
        updated_at
    ) VALUES (
        p_doctor_id,
        p_blog_title,
        p_blog_content,
        p_excerpt,
        p_featured_image_url,
        p_blog_tags,
        p_published_at,
        'draft',
        0,
        NOW(),
        NOW()
    );

    RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."read_all_blog"() RETURNS TABLE("blog_id" "uuid", "doctor_id" "uuid", "blog_title" "text", "blog_content" "text", "excerpt" "text", "featured_image_url" "text", "blog_tags" "jsonb", "published_at" timestamp with time zone, "blog_status" "public"."blog_status", "view_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.blog_id,
    b.doctor_id,
    b.blog_title,
    b.blog_content,
    b.excerpt,
    b.featured_image_url,
    b.blog_tags,
    b.published_at,
    b.blog_status,
    b.view_count,
    b.created_at,
    b.updated_at
  FROM blog_posts b
  ORDER BY b.published_at DESC NULLS LAST, b.created_at DESC;
END;
$$;


E OR REPLACE FUNCTION "public"."read_all_patient"() RETURNS TABLE("id" "uuid", "name" "text", "allergies" "jsonb", "chronic_conditions" "jsonb", "past_surgeries" "jsonb", "vaccination_status" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "patient_status" "public"."patient_status")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.allergies,
    p.chronic_conditions, 
    p.past_surgeries,
    p.vaccination_status,
    p.created_at,
    p.updated_at,
    p.patient_status
  FROM patients p
  ORDER BY created_at DESC;
END;
$$;


EATE OR REPLACE FUNCTION "public"."search_blog_by_tags"("p_tags" "text"[]) RETURNS TABLE("blog_id" "uuid", "doctor_id" "uuid", "blog_title" "text", "blog_content" "text", "excerpt" "text", "featured_image_url" "text", "blog_tags" "jsonb", "published_at" timestamp with time zone, "blog_status" "public"."blog_status", "view_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.blog_id,
    b.doctor_id,
    b.blog_title,
    b.blog_content,
    b.excerpt,
    b.featured_image_url,
    b.blog_tags,
    b.published_at,
    b.blog_status,
    b.view_count,
    b.created_at,
    b.updated_at
  FROM blog_posts b
  WHERE EXISTS (
    SELECT 1
    FROM unnest(p_tags) AS tag
    WHERE b.blog_tags ? tag
  )
  ORDER BY b.published_at DESC NULLS LAST, b.created_at DESC;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."search_blogs_by_doctor_id"("p_doctor_id" "uuid") RETURNS TABLE("blog_id" "uuid", "doctor_id" "uuid", "blog_title" "text", "blog_content" "text", "excerpt" "text", "featured_image_url" "text", "blog_tags" "jsonb", "published_at" timestamp with time zone, "blog_status" "public"."blog_status", "view_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.blog_id,
    b.doctor_id,
    b.blog_title,
    b.blog_content,
    b.excerpt,
    b.featured_image_url,
    b.blog_tags,
    b.published_at,
    b.blog_status,    
    b.view_count,
    b.created_at,
    b.updated_at
  FROM blog_posts b
  WHERE b.doctor_id = p_doctor_id AND b.blog_status = 'published'
  ORDER BY b.published_at DESC NULLS LAST, b.created_at DESC;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."search_patient_by_name"("p_name" "text") RETURNS TABLE("id" "uuid", "name" "text", "allergies" "jsonb", "chronic_conditions" "jsonb", "past_surgeries" "jsonb", "vaccination_status" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.name,
    pt.allergies,
    pt.chronic_conditions,
    pt.past_surgeries,
    pt.vaccination_status,
    pt.created_at,
    pt.updated_at
  FROM patients pt
  WHERE pt.name ILIKE '%' || p_name || '%'
  ORDER BY pt.name ASC;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."toggle_patient_status"("p_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$DECLARE
  current_status patient_status;
BEGIN

  SELECT patient_status INTO current_status
  FROM patients
  WHERE id = p_id;


  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;


  UPDATE patients
  SET patient_status = CASE 
                         WHEN current_status = 'in_treatment' THEN 'completed'::patient_status
                         ELSE 'in_treatment'::patient_status
                       END,
      updated_at = NOW()
  WHERE id = p_id;
  --SELECT toggle_patient_status('59f432b0-4219-4057-97dd-0eaf87e17c32');

  RETURN TRUE;
END;$$;




CREATE OR REPLACE FUNCTION "public"."toggle_staff_status"("p_staff_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_status staff_status;
BEGIN
  SELECT staff_status INTO current_status
  FROM staff_members
  WHERE staff_id = p_staff_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE staff_members
  SET staff_status = CASE 
                       WHEN current_status = 'active' THEN 'inactive'::staff_status
                       ELSE 'active'::staff_status
                     END,
      updated_at = NOW()
  WHERE staff_id = p_staff_id;

  RETURN TRUE;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."update_blog_status"("p_blog_id" "uuid", "p_status" "public"."blog_status") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE blog_posts
  SET blog_status = p_status,
      updated_at = NOW()
  WHERE blog_id = p_blog_id;

  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."update_blog_whole_content"("p_doctor_id" "uuid", "p_blog_id" "uuid", "p_blog_title" "text", "p_blog_content" "text", "p_excerpt" "text", "p_featured_image_url" "text", "p_blog_tags" "jsonb", "p_published_at" timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
  UPDATE blog_posts
  SET 
    blog_title = p_blog_title,
    blog_content = p_blog_content,
    excerpt = p_excerpt,
    featured_image_url = p_featured_image_url,
    blog_tags = p_blog_tags,
    published_at = p_published_at,
    blog_status = 'draft',       
    updated_at = NOW()
  WHERE blog_id = p_blog_id
    AND doctor_id = p_doctor_id
    AND blog_status = 'draft';     -- Chỉ update khi blog_status là draft

  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;$$;




CREATE OR REPLACE FUNCTION "public"."update_patient"("p_id" "uuid", "p_allergies" "jsonb" DEFAULT NULL::"jsonb", "p_chronic_conditions" "jsonb" DEFAULT NULL::"jsonb", "p_past_surgeries" "jsonb" DEFAULT NULL::"jsonb", "p_vaccination_status" "jsonb" DEFAULT NULL::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$BEGIN
  UPDATE patients
  SET
    allergies = COALESCE(p_allergies, allergies),
    chronic_conditions = COALESCE(p_chronic_conditions, chronic_conditions),
    past_surgeries = COALESCE(p_past_surgeries, past_surgeries),
    vaccination_status = COALESCE(p_vaccination_status, vaccination_status),
    updated_at = NOW()
  WHERE id = p_id;

  RETURN FOUND; -- true nếu có dòng bị ảnh hưởng, false nếu không
END;
  --'59f432b0-4219-4057-97dd-0eaf87e17c32',   UUID bệnh nhân
  --NULL,                                    allergies không cập nhật
  --'[ "HIV" ]'::jsonb,        -- cập nhật chronic_conditions
  --NULL,                                     past_surgeries không cập nhật
  --'{ "HPV": "chưa tiêm", "HIV": "chưa tiêm" }'::jsonb  cập nhật vaccination_status







CREATE OR REPLACE FUNCTION "public"."view_blogs_by_doctor_id"("p_doctor_id" "uuid") 
RETURNS TABLE("blog_title" "text", "blog_content" "text", "excerpt" "text", "featured_image_url" "text", "blog_tags" "jsonb", "published_at" timestamp with time zone, "blog_status" "public"."blog_status", "view_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.blog_title,
    b.blog_content,
    b.excerpt,
    b.featured_image_url,
    b.blog_tags,
    b.published_at,
    b.blog_status,
    b.view_count
  FROM blog_posts b
  WHERE b.doctor_id = p_doctor_id
  ORDER BY b.published_at DESC NULLS LAST, b.created_at DESC;
END;
$$;
