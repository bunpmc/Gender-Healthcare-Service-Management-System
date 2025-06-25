import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function createErrorResponse(error, status = 400, details = null) {
  const response = {
    error,
  };
  if (details) response.details = details;
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createErrorResponse("Server configuration error", 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    const body = await req.json();
    const { email, fullName, message, phone, schedule } = body;
    if (!fullName || !message || !schedule) {
      return createErrorResponse(
        "Missing required fields: fullName, message, schedule, phone",
        400,
      );
    }
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return createErrorResponse("Invalid email format", 400);
      }
    }
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return createErrorResponse(
        "Invalid phone number format (e.g., +8434567890)",
        400,
      );
    }
    if (isNaN(new Date(schedule).getTime())) {
      return createErrorResponse("Invalid schedule date format ISO8601", 400);
    }
    let patientId;
    if (email) {
      const { data: patient_email, error: patientError } = await supabase.from(
        "patients",
      ).select("id").eq("email", email).maybeSingle();
      //PGRST116: no row return
      if (patientError && patientError.code !== "PGRST116") {
        console.log(
          "Email query error:",
          patientError.code,
          patientError.message,
        );
        return createErrorResponse(
          "Failed to check existing patient with email",
          500,
          patientError.message,
        );
      }
      if (patient_email) {
        patientId = patient_email.id;
      }
    }
    const { data: patient, error: phoneError } = await supabase.from("patients")
      .select("id").eq("phone", phone).maybeSingle();
    if (phoneError && phoneError.code !== "PGRST116") {
      console.log("Phone query error:", phoneError.code, phoneError.message);
      return createErrorResponse(phoneError.message, 500, phoneError.message);
    }
    if (patient) {
      patientId = patient.id;
    }
    if (!patientId) {
      const userId = crypto.randomUUID();
      const { data: authUser, error: authError } = await supabase.auth.admin
        .createUser({
          email: email || `${phone}@placeholder.com`,
          phone: phone,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            full_name: fullName,
          },
        });
      if (authError) {
        console.log("Auth user creation error:", authError.message);
        return createErrorResponse(authError.message, 500, authError.message);
      }
      const patientData = {
        id: authUser.user.id,
        full_name: fullName,
        phone: phone,
        email: email || `${phone}@placeholder.com`,
        date_of_birth: "1970-01-01",
        gender: "other",
        allergies: {
          known_allergies: [],
        },
        chronic_conditions: {
          conditions: [],
        },
        past_surgeries: {
          surgeries: [],
        },
        vaccination_status: "not_vaccinated",
        patient_status: "active",
        created_at: new Date().toISOString(),
      };
      const { data: newPatient, error: createPatientError } = await supabase
        .from("patients").insert(patientData).select("id").single();
      if (createPatientError) {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return createErrorResponse(
          createPatientError.message,
          500,
          createPatientError.message,
        );
      }
      patientId = newPatient.id;
    }
    const { data: newAppointment, error: appointmentError } = await supabase
      .from("appointments").insert({
        appointment_id: crypto.randomUUID(),
        patient_id: patientId,
        phone: phone,
        email: email || `${phone}@placeholder.com`,
        visit_type: "consultation",
        appointment_status: "pending",
        created_at: new Date(schedule).toISOString(),
      }).select(`
        appointment_id,
        patient_id,
        visit_type,
        appointment_status,
        created_at,
        patients (
          full_name,
          date_of_birth,
          gender
        )
      `).single();
    if (appointmentError) {
      console.log(
        "Appointment insert error:",
        appointmentError.code,
        appointmentError.message,
      );
      return createErrorResponse(
        appointmentError.message,
        500,
        appointmentError.message,
      );
    }
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const { data: staffSchedules, error: scheduleError } = await supabase.from(
      "staff_schedules",
    ).select(`
        staff_id,
        start_time,
        end_time,
        timetable,
        staff_members (
          full_name,
          working_email,
          role        )
      `).gte("start_time", now.toISOString()).lte(
      "end_time",
      endTime.toISOString(),
    );
    if (scheduleError) {
      return createErrorResponse(
        scheduleError.message,
        500,
        scheduleError.message,
      );
    }
    if (!staffSchedules || staffSchedules.length === 0) {
      return createSuccessResponse({
        success: true,
        message: "Appointment created, but no staff available to notify",
      });
    }
    const notifications = [];
    const relevantStaff = staffSchedules // .filter((schedule)=>schedule.staff_members?.working_email?.endsWith("@company.gmail.com"))
      .filter((schedule) =>
        schedule.staff_members?.role === "receptionist" ||
        schedule.staff_members?.role === "doctor"
      );
    if (relevantStaff.length === 0) {
      return createSuccessResponse({
        success: true,
        message: "Appointment created, but no eligible staff to notify",
      });
    }
    for (const schedule of relevantStaff) {
      notifications.push({
        appointment_id: newAppointment.appointment_id,
        staff_id: schedule.staff_id,
        notification_type: "new_appointment",
        sent_at: new Date().toISOString(),
      });
    }
    if (notifications.length > 0) {
      const { error: logError } = await supabase.from("notifications").insert(
        notifications,
      );
      if (logError) {
        console.log(
          "Notification insert error:",
          logError.code,
          logError.message,
        );
        return createErrorResponse(
          "Failed to log notifications",
          500,
          logError.message,
        );
      }
    }
    return createSuccessResponse({
      success: true,
      message:
        `Appointment created and notified ${notifications.length} staff members`,
      data: {
        appointment: newAppointment,
        notifications,
      },
    });
  } catch (error) {
    console.log("Global error:", error.message);
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
