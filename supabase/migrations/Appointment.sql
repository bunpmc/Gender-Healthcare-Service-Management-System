CREATE OR REPLACE FUNCTION calculate_daily_revenue(
  target_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM receipts
  WHERE created_at::date = target_date;

  RETURN total;
END;
$$ LANGUAGE plpgsql;
----
CREATE OR REPLACE FUNCTION count_appointments_by_day(
  target_date DATE
)
RETURNS INT AS $$
DECLARE
  appt_count INT;
BEGIN
  SELECT COUNT(*) INTO appt_count
  FROM appointments
  WHERE created_at::date = target_date;

  RETURN appt_count;
END;
$$ LANGUAGE plpgsql;
-------
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
-------
CREATE OR REPLACE FUNCTION filter_appointments_by_patient_day_status_type(
  p_patient_id UUID DEFAULT NULL,
  p_target_date DATE DEFAULT NULL,
  p_status process_status DEFAULT NULL,
  p_visit_type visit_type_enum DEFAULT NULL
)
RETURNS TABLE (
  appointment_id UUID,
  patient_id UUID,
  phone TEXT,
  email VARCHAR,
  visit_type visit_type_enum,
  appointment_status process_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.*
  FROM appointments a
  WHERE
    (p_patient_id IS NULL OR a.patient_id = p_patient_id) AND
    (p_target_date IS NULL OR a.created_at::date = p_target_date) AND
    (p_status IS NULL OR a.appointment_status = p_status) AND
    (p_visit_type IS NULL OR a.visit_type = p_visit_type);
END;
$$ LANGUAGE plpgsql;