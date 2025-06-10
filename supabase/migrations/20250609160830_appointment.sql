CREATE OR REPLACE FUNCTION create_appointment(
    user_id_input UUID,
    appointment_time_input TIMESTAMP WITH TIME ZONE,
    appointment_type_input VARCHAR(50),
    appointment_notes_input TEXT DEFAULT NULL
) RETURNS TABLE (
    user_id UUID,
    appointment_id UUID,
    message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_appointment_id UUID;
BEGIN
    SELECT user_id INTO v_user_id
    FROM 
    WHERE user_id = user_id_input AND user_status = 'active';