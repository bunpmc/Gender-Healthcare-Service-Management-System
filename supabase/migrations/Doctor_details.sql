CREATE OR REPLACE FUNCTION create_doctor_detail(
    p_doctor_id UUID,
    p_department department_enum,
    p_speciality speciality_enum,
    p_about_me JSON,
    p_license_no VARCHAR,
    p_bio TEXT,
    p_slogan TEXT,
    p_educations JSON,
    p_certifications JSON
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO doctor_details (
        doctor_id,
        department,
        speciality,
        about_me,
        license_no,
        bio,
        slogan,
        educations,
        certifications
    )
    VALUES (
        p_doctor_id,
        p_department,
        p_speciality,
        p_about_me,
        p_license_no,
        p_bio,
        p_slogan,
        p_educations,
        p_certifications
    );
END;
$$ LANGUAGE plpgsql;
------
