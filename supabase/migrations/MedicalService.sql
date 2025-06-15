CREATE OR REPLACE FUNCTION update_medical_service(
  p_service_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_service_name TEXT DEFAULT NULL,
  p_service_description TEXT DEFAULT NULL,
  p_service_cost NUMERIC DEFAULT NULL,
  p_duration_minutes INT DEFAULT NULL
  
)
RETURNS BOOLEAN AS $$

BEGIN
  UPDATE medical_services
  SET
    category_id = COALESCE(p_category_id, category_id),
    service_name = COALESCE(p_service_name, service_name),
    service_description = COALESCE(p_service_description, service_description),
    service_cost = COALESCE(p_service_cost, service_cost),
    duration_minutes = COALESCE(p_duration_minutes, duration_minutes)
    
    

  WHERE service_id = p_service_id and is_active = false;

  RETURN FOUND;  
END;
$$ LANGUAGE plpgsql;
---
CREATE OR REPLACE FUNCTION toggle_medical_services_status(
  p_service_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_status BOOLEAN;
BEGIN
  SELECT is_active INTO current_status
  FROM medical_services
  WHERE service_id = p_service_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;


  UPDATE medical_services
  SET is_active = NOT current_status
  WHERE service_id = p_service_id;

    RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error toggling service status: %', SQLERRM;
    RETURN FALSE;

END;
$$ LANGUAGE plpgsql;
---- 
CREATE OR REPLACE FUNCTION create_medical_service(
 
  p_category_id UUID ,
  p_service_name TEXT ,
  p_service_description TEXT DEFAULT NULL,
  p_service_cost NUMERIC DEFAULT NULL,
  p_duration_minutes INT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
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
    TRUE,            
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting medical service: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
