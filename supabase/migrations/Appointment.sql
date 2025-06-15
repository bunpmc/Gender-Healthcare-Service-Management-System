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