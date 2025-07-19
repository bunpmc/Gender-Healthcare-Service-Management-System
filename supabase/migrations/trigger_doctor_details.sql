CREATE OR REPLACE FUNCTION auto_link_doctor_by_speciality()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO doctor_services (id, doctor_id, service_id, created_at)
  SELECT
    gen_random_uuid(),
    NEW.doctor_id,
    ms.service_id,
    NOW()
  FROM medical_services ms
  JOIN service_categories sc ON ms.category_id = sc.category_id
  WHERE ms.is_active = TRUE
    AND (
      (NEW.speciality = 'gynecologist' AND sc.category_name = 'Gynecology') OR
      (NEW.speciality = 'urologist' AND sc.category_name = 'Urology') OR
      (NEW.speciality = 'endocrinologist' AND sc.category_name = 'Lab Test') OR
      (NEW.speciality = 'reproductive_specialist' AND sc.category_name = 'Reproductive Health') OR
      (NEW.speciality = 'sexual_health_specialist' AND sc.category_name IN ('Sexual Health', 'Gender Support', 'Transgender Care'))
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---
create trigger trg_link_services_by_speciality
after INSERT on doctor_details for EACH row
execute FUNCTION auto_link_doctor_by_speciality ();