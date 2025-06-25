-- INSERT INTO auth.users (id, email, phone, email_confirmed_at, phone_confirmed_at, raw_user_meta_data) VALUES
-- ('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', '+8434567890', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{"full_name": "John Doe"}'),
-- ('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', NULL, CURRENT_TIMESTAMP, NULL, '{"full_name": "Jane Smith"}'),
-- ('550e8400-e29b-41d4-a716-446655440006', NULL, '+8434567891', NULL, CURRENT_TIMESTAMP, '{"full_name": "Mary Johnson"}'),
-- ('550e8400-e29b-41d4-a716-446655440007', 'alex.lee@example.com', '+8434567893', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{"full_name": "Alex Lee"}'),
-- ('550e8400-e29b-41d4-a716-446655440003', 'alice.johnson@company.com', NULL, CURRENT_TIMESTAMP, NULL, '{"full_name": "Dr. Alice Johnson"}'),
-- ('550e8400-e29b-41d4-a716-446655440004', 'bob.wilson@company.com', NULL, CURRENT_TIMESTAMP, NULL, '{"full_name": "Dr. Bob Wilson"}'),
-- ('550e8400-e29b-41d4-a716-446655440005', 'emma.brown@company.com', NULL, CURRENT_TIMESTAMP, NULL, '{"full_name": "Emma Brown"}');

-- -- Insert sample data into patients
-- -- John: male, erectile dysfunction; Jane: female, PCOS; Mary: female, irregular periods; Alex: other, hormone therapy
-- INSERT INTO public.patients (id, full_name, phone, email, date_of_birth, gender, allergies, chronic_conditions, past_surgeries, vaccination_status, patient_status, created_at, updated_at) VALUES
-- ('550e8400-e29b-41d4-a716-446655440001', 'John Doe', '+8434567890', 'john.doe@example.com', '1985-03-15', 'male', '{"known_allergies": ["penicillin"]}', '{"conditions": ["erectile dysfunction", "hypertension"]}', '{"surgeries": ["vasectomy"]}', 'fully_vaccinated', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', '+8434567892', 'jane.smith@example.com', '1990-07-22', 'female', '{"known_allergies": []}', '{"conditions": ["polycystic ovary syndrome", "asthma"]}', '{"surgeries": []}', 'partially_vaccinated', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('550e8400-e29b-41d4-a716-446655440006', 'Mary Johnson', '+8434567891', 'mary.johnson@placeholder.com', '1978-11-10', 'female', '{"known_allergies": ["nuts"]}', '{"conditions": ["irregular menstrual cycles"]}', '{"surgeries": ["hysterectomy"]}', 'not_vaccinated', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('550e8400-e29b-41d4-a716-446655440007', 'Alex Lee', '+8434567893', 'alex.lee@example.com', '1995-04-05', 'other', '{"known_allergies": []}', '{"conditions": ["gender dysphoria", "on hormone replacement therapy"]}', '{"surgeries": ["top surgery"]}', 'fully_vaccinated', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- -- Insert sample data into staff_members
-- -- Alice: doctor, Bob: doctor, Emma: receptionist
-- INSERT INTO public.staff_members (staff_id, full_name, working_email, role, years_experience, hired_at, is_available, staff_status, created_at, updated_at) VALUES
-- ('550e8400-e29b-41d4-a716-446655440003', 'Dr. Alice Johnson', 'alice.johnson@company.com', 'doctor', 10, '2015-01-10', TRUE, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('550e8400-e29b-41d4-a716-446655440004', 'Dr. Bob Wilson', 'bob.wilson@company.com', 'doctor', 8, '2017-06-15', TRUE, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('550e8400-e29b-41d4-a716-446655440005', 'Emma Brown', 'emma.brown@company.com', 'receptionist', 3, '2020-03-01', TRUE, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- -- Insert sample data into doctor_details
-- INSERT INTO public.doctor_details (doctor_id, department, speciality, about_me, license_no) VALUES
-- ('550e8400-e29b-41d4-a716-446655440003', 'reproductive_health', 'reproductive_specialist', '{"bio": "Specialist in fertility treatments and transgender care"}', 'LIC12345'),
-- ('550e8400-e29b-41d4-a716-446655440004', 'urology', 'urologist', '{"bio": "Expert in urological care and sexual health"}', 'LIC67890');

-- -- Insert sample data into staff_schedules
-- INSERT INTO public.staff_schedules (schedule_id, staff_id, start_time, end_time, timetable) VALUES
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440003', '2025-06-11 09:00:00+00', '2025-06-11 17:00:00+00', '{"days": ["Monday", "Wednesday", "Friday"]}'),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440004', '2025-06-11 10:00:00+00', '2025-06-11 18:00:00+00', '{"days": ["Tuesday", "Thursday"]}'),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440005', '2025-06-11 08:00:00+00', '2025-06-11 16:00:00+00', '{"days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}');

-- -- Insert sample data into staff_certifications
-- INSERT INTO public.staff_certifications (certification_id, staff_id, certification_name, issue_date, expiry_date) VALUES
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440003', 'Board Certified Reproductive Specialist', '2016-05-20', '2026-05-20'),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440004', 'Urology Board Certification', '2018-09-15', NULL);

-- -- Insert sample data into staff_history
-- INSERT INTO public.staff_history (history_id, staff_id, changed_by, changed_at, field_name, old_value, new_value, change_reason) VALUES
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', CURRENT_TIMESTAMP, 'is_available', '{"value": false}', '{"value": true}', 'Returned from leave');

-- -- Insert sample data into receipts
-- INSERT INTO public.receipts (receipt_id, patient_id, amount, created_at) VALUES
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 150.00, CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440002', 200.00, CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440006', 100.00, CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440007', 180.00, CURRENT_TIMESTAMP);

-- -- Insert sample data into period_tracking
-- -- Jane: PCOS-related irregular cycles; Mary: post-hysterectomy monitoring
-- INSERT INTO public.period_tracking (period_id, patient_id, start_date, end_date, estimated_next_date, cycle_length, flow_intensity, symptoms, period_description, predictions, created_at, updated_at) VALUES
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440002', '2025-05-01 00:00:00+00', '2025-05-07 00:00:00+00', '2025-06-05 00:00:00+00', 35, 'heavy', '{"symptoms": ["severe cramps", "acne flare-up"]}', 'Irregular due to PCOS', '{"next_cycle_prediction": "irregular"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440006', '2025-05-10 00:00:00+00', NULL, NULL, NULL, NULL, '{"symptoms": ["post-surgical spotting"]}', 'Monitoring post-hysterectomy', '{"next_cycle_prediction": "none"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- -- Insert sample data into service_categories
-- INSERT INTO public.service_categories (category_id, category_name, category_description) VALUES
-- (uuid_generate_v4(), 'Reproductive Health', 'Services related to reproductive health and fertility'),
-- (uuid_generate_v4(), 'Urology', 'Services related to urinary tract and male reproductive system'),
-- (uuid_generate_v4(), 'Transgender Care', 'Services for transgender health and hormone therapy');

-- -- Insert sample data into medical_services
-- INSERT INTO public.medical_services (service_id, category_id, service_name, service_description, service_cost, duration_minutes, is_active) VALUES
-- (uuid_generate_v4(), (SELECT category_id FROM public.service_categories WHERE category_name = 'Reproductive Health'), 'Fertility Consultation', 'Initial consultation for fertility issues', 100.00, 30, TRUE),
-- (uuid_generate_v4(), (SELECT category_id FROM public.service_categories WHERE category_name = 'Urology'), 'Urology Checkup', 'Routine urology examination', 120.00, 45, TRUE),
-- (uuid_generate_v4(), (SELECT category_id FROM public.service_categories WHERE category_name = 'Transgender Care'), 'Hormone Therapy Consultation', 'Assessment for hormone replacement therapy', 150.00, 60, TRUE);

-- -- Insert sample data into blog_posts
-- INSERT INTO public.blog_posts (blog_id, doctor_id, blog_title, blog_content, excerpt, featured_image_url, blog_tags, published_at, blog_status, view_count, created_at, updated_at) VALUES
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440003', 'Understanding Hormone Therapy for Transgender Patients', 'Content about HRT...', 'Learn about hormone therapy options.', 'https://example.com/image1.jpg', '{"tags": ["transgender", "hormone therapy"]}', CURRENT_TIMESTAMP, 'published', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- -- Insert sample data into patient_reports
-- -- John: erectile dysfunction; Jane: PCOS symptoms; Mary: post-hysterectomy; Alex: HRT side effects
-- INSERT INTO public.patient_reports (report_id, patient_id, report_content, report_description, staff_id, report_status, created_at, updated_at) VALUES
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', 'Patient reported difficulty maintaining erections.', 'Sexual health assessment', '550e8400-e29b-41d4-a716-446655440004', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440002', 'Patient reported heavy bleeding and severe cramps.', 'PCOS-related menstrual issues', '550e8400-e29b-41d4-a716-446655440003', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440006', 'Patient reported spotting post-hysterectomy.', 'Post-surgical follow-up', '550e8400-e29b-41d4-a716-446655440003', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440007', 'Patient reported mood swings and fatigue on HRT.', 'Hormone therapy side effects', '550e8400-e29b-41d4-a716-446655440003', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- -- Insert sample data into appointments
-- -- Ensure phone and email match patients table
-- INSERT INTO public.appointments (appointment_id, patient_id, phone, email, visit_type, appointment_status, created_at, updated_at) VALUES
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', '+8434567890', 'john.doe@example.com', 'consultation', 'pending', '2025-06-11 10:00:00+00', CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440002', '+8434567892', 'jane.smith@example.com', 'follow-up', 'in_progress', '2025-06-11 11:00:00+00', CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440006', '+8434567891', 'mary.johnson@placeholder.com', 'routine', 'pending', '2025-06-11 12:00:00+00', CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440007', '+8434567893', 'alex.lee@example.com', 'consultation', 'pending', '2025-06-11 13:00:00+00', CURRENT_TIMESTAMP);

-- -- Insert sample data into notifications
-- INSERT INTO public.notifications (notification_id, appointment_id, staff_id, notification_type, sent_at) VALUES
-- (uuid_generate_v4(), (SELECT appointment_id FROM public.appointments WHERE patient_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1), '550e8400-e29b-41d4-a716-446655440004', 'new_appointment', CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), (SELECT appointment_id FROM public.appointments WHERE patient_id = '550e8400-e29b-41d4-a716-446655440002' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', 'appointment_reminder', CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), (SELECT appointment_id FROM public.appointments WHERE patient_id = '550e8400-e29b-41d4-a716-446655440006' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', 'new_appointment', CURRENT_TIMESTAMP),
-- (uuid_generate_v4(), (SELECT appointment_id FROM public.appointments WHERE patient_id = '550e8400-e29b-41d4-a716-446655440007' LIMIT 1), '550e8400-e29b-41d4-a716-446655440005', 'new_appointment', CURRENT_TIMESTAMP);