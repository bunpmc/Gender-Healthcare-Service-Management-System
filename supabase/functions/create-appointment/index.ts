import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { connect } from "https://deno.land/x/redis@v0.29.4/mod.ts";
import nodemailer from "npm:nodemailer";

function createErrorResponse(error, status = 400, details = null) {
  const response = {
    error,
    details
  };
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
// Initialize Redis client
// const redisConfig = {
//   hostname: "redis-16115.c232.us-east-1-2.ec2.redns.redis-cloud.com",
//   port: 16115,
//   password: "TTscija9E5nQS9xCyypEjeA2xfhdibSE"
// };
const redisConfig = {
  hostname: Deno.env.get("REDIS_HOST"),
  port: Number(Deno.env.get("REDIS_PORT")),
  password: Deno.env.get("REDIS_PASSWORD")
};
let redis = null;
try {
  redis = await connect(redisConfig);
  console.log(JSON.stringify({
    level: "info",
    message: "Connected to Redis",
    details: {
      hostname: redisConfig.hostname,
      port: redisConfig.port
    }
  }));
} catch (error) {
  console.log(JSON.stringify({
    level: "error",
    message: "Failed to connect to Redis",
    details: error.message
  }));
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400"
      }
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
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return createErrorResponse("Invalid JSON in request body", 400, error.message);
    }
    const { email, fullName, message, phone, schedule, gender = "other", date_of_birth, doctor_id, preferred_date, preferred_time, preferred_slot_id, visit_type = "consultation" } = body;
    // Validation
    if (!fullName || !message || !schedule || !phone || !date_of_birth) {
      return createErrorResponse("Missing required fields: fullName, message, schedule, date_of_birth, phone", 400);
    }
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return createErrorResponse("Invalid email format", 400);
      }
    }
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return createErrorResponse("Invalid phone number format (e.g., +8434567890)", 400);
    }
    if (preferred_time) {
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d:00$/;
      if (!timeRegex.test(preferred_time)) {
        return createErrorResponse("Invalid preferred_time format (e.g., 09:00:00)", 400);
      }
    }
    try {
      const dob = new Date(date_of_birth);
      if (isNaN(dob.getTime()) || dob > new Date()) {
        return createErrorResponse("Invalid date_of_birth: must be a valid date in the past", 400);
      }
    } catch  {
      return createErrorResponse("Invalid date_of_birth format", 400);
    }
    // Schedule time ranges
    const scheduleTimeRanges = {
      Morning: {
        start: "08:00:00",
        end: "12:00:00"
      },
      Afternoon: {
        start: "13:00:00",
        end: "17:00:00"
      },
      Evening: {
        start: "18:00:00",
        end: "22:00:00"
      }
    };
    const timeRange = scheduleTimeRanges[schedule];
    if (!timeRange) {
      return createErrorResponse("Invalid schedule value. Use: Morning, Afternoon, or Evening", 400);
    }
    const now = new Date();
    const offsetMs = 7 * 60 * 60 * 1000; // +07:00 offset
    const targetDate = preferred_date ? new Date(preferred_date).toISOString().split("T")[0] : new Date(now.getTime() + offsetMs).toISOString().split("T")[0];
    if (!doctor_id) {
      return createErrorResponse("Doctor selection is required. Please choose a doctor for your appointment.", 400, {
        schedule,
        date: targetDate,
        time_range: timeRange,
        suggestion: "Please select a doctor from the available doctors list"
      });
    }
    let selectedSlot = null;
    let bookedSlotInfo = null;

    const { data: doctor, error: doctorError } = await supabase.from("doctor_details").select("doctor_id").eq("doctor_id", doctor_id).single();
    if (doctorError || !doctor) {
      console.log(JSON.stringify({
        level: "error",
        message: "Doctor validation error",
        details: doctorError?.message
      }));
      return createErrorResponse("Invalid doctor selection. Please choose a valid doctor.", 400, {
        doctor_id,
        suggestion: "Please select a doctor from the available doctors list"
      });
    }
 
    // Fetch available slots
    console.log(JSON.stringify({
      level: "info",
      message: "Calling get_available_slots",
      params: {
        p_doctor_id: doctor_id,
        p_slot_date: targetDate,
        p_start_time: timeRange.start,
        p_end_time: timeRange.end,
        p_slot_id: preferred_slot_id || null
      }
    }));
    const { data: availableSlots, error: slotCheckError } = await supabase.rpc("get_available_slots", {
      p_doctor_id: doctor_id,
      p_slot_date: targetDate,
      p_start_time: timeRange.start,
      p_end_time: timeRange.end,
      p_slot_id: preferred_slot_id || null
    });
    if (slotCheckError) {
      console.log(JSON.stringify({
        level: "error",
        message: "Slot check error",
        details: slotCheckError.message
      }));
      return createErrorResponse("Failed to check doctor availability", 500, slotCheckError.message);
    }
    if (!availableSlots || availableSlots.length === 0) {
      console.log(JSON.stringify({
        level: "warn",
        message: "No available slots found for doctor",
        details: {
          doctor_id,
          targetDate,
          schedule
        }
      }));
      return createErrorResponse(`The selected doctor is not available for ${schedule} schedule on ${targetDate}. Please choose a different doctor, date, or time.`, 400, {
        doctor_id,
        schedule,
        date: targetDate,
        time_range: timeRange,
        available_slots: 0,
        suggestion: "Try selecting a different doctor, date, or time schedule (Morning/Afternoon/Evening)"
      });
    }
    // Require specific time selection
    if (!preferred_slot_id && !preferred_time) {
      return createErrorResponse("Time slot selection is required. Please choose a specific time for your appointment.", 400, {
        doctor_id,
        schedule,
        date: targetDate,
        available_slots: availableSlots.map((slot)=>({
            slot_id: slot.doctor_slot_id,
            time: slot.slot_time,
            date: slot.slot_date
          })),
        suggestion: "Choose from the available time slots listed above"
      });
    }
    // Select slot based on preferences
    if (preferred_slot_id) {
      selectedSlot = availableSlots.find((slot)=>slot.doctor_slot_id === preferred_slot_id);
      if (!selectedSlot) {
        return createErrorResponse("The selected time slot is no longer available. Please choose a different time.", 400, {
          preferred_slot_id,
          doctor_id,
          available_slots: availableSlots.map((slot)=>({
              slot_id: slot.doctor_slot_id,
              time: slot.slot_time,
              date: slot.slot_date
            })),
          suggestion: "Choose from the available time slots listed above"
        });
      }
    } else if (preferred_time) {
      selectedSlot = availableSlots.find((slot)=>slot.slot_time === preferred_time);
      if (!selectedSlot) {
        return createErrorResponse(`The preferred time ${preferred_time} is not available. Please choose a different time.`, 400, {
          preferred_time,
          doctor_id,
          schedule,
          available_slots: availableSlots.map((slot)=>({
              slot_id: slot.doctor_slot_id,
              time: slot.slot_time,
              date: slot.slot_date
            })),
          suggestion: "Choose from the available time slots listed above"
        });
      }
    }
    console.log(JSON.stringify({
      level: "info",
      message: "Selected slot",
      details: selectedSlot
    }));
    // Book the selected slot
    const { data: bookResult, error: bookError } = await supabase.rpc("book_appointment_slot", {
      p_slot_id: selectedSlot.doctor_slot_id
    });
    if (bookError || !bookResult) {
      console.log(JSON.stringify({
        level: "error",
        message: "Slot booking error",
        details: bookError?.message
      }));
      return createErrorResponse("Failed to book the appointment slot", 500, bookError?.message);
    }
    // Verify slot booking
    const { data: bookedSlot, error: verifyError } = await supabase.from("doctor_slot_assignments").select("appointments_count, max_appointments").eq("doctor_slot_id", selectedSlot.doctor_slot_id).single();
    if (verifyError || !bookedSlot) {
      console.log(JSON.stringify({
        level: "error",
        message: "Slot verification failed",
        details: verifyError?.message || "Slot not found"
      }));
      return createErrorResponse("Failed to verify booked slot", 500, verifyError?.message || "Slot not found");
    }
    if (bookedSlot.appointments_count >= bookedSlot.max_appointments) {
      return createErrorResponse("Slot is already full", 400, "This slot has reached the maximum number of appointments");
    }
    bookedSlotInfo = {
      doctor_slot_id: selectedSlot.doctor_slot_id,
      slot_date: selectedSlot.slot_date,
      slot_time: selectedSlot.slot_time,
      doctor_id: selectedSlot.doctor_id,
      schedule
    };
    // Patient/Guest Logic
    let patientId = null;
    let newAppointment = null;
    if (email) {
      const { data: patient_email, error: patientError } = await supabase.from("patients").select("id").eq("email", email).maybeSingle();
      if (patientError && patientError.code !== "PGRST116") {
        console.log(JSON.stringify({
          level: "error",
          message: "Email query error",
          details: {
            code: patientError.code,
            message: patientError.message
          }
        }));
        return createErrorResponse("Failed to check existing patient with email", 500, patientError.message);
      }
      if (patient_email) {
        patientId = patient_email.id;
      }
    }
    if (!patientId) {
      const { data: patient, error: phoneError } = await supabase.from("patients").select("id").eq("phone", phone).maybeSingle();
      if (phoneError && phoneError.code !== "PGRST116") {
        console.log(JSON.stringify({
          level: "error",
          message: "Phone query error",
          details: {
            code: phoneError.code,
            message: phoneError.message
          }
        }));
        return createErrorResponse("Failed to check existing patient with phone", 500, phoneError.message);
      }
      if (patient) {
        patientId = patient.id;
      }
    }
    const guestId = crypto.randomUUID();
    if (!patientId) {
      const { data: existingGuest, error: guestCheckError } = await supabase.from("guests").select("guest_id").eq("phone", phone).maybeSingle();
      if (guestCheckError && guestCheckError.code !== "PGRST116") {
        console.log(JSON.stringify({
          level: "error",
          message: "Guest check error",
          details: guestCheckError.message
        }));
        await supabase.rpc("cancel_appointment_slot", {
          p_slot_id: selectedSlot.doctor_slot_id
        });
        return createErrorResponse("Failed to check existing guest", 500, guestCheckError.message);
      }
      if (existingGuest) {
        guestId = existingGuest.guest_id;
      } else {
        const { error: guestError } = await supabase.from("guests").insert({
          guest_id: guestId,
          email: email || `${phone}@placeholder.com`,
          phone,
          gender,
          date_of_birth,
          created_at: new Date().toISOString(),
          full_name: fullName
        });
        if (guestError) {
          console.log(JSON.stringify({
            level: "error",
            message: "Guest creation error",
            details: guestError.message
          }));
          await supabase.rpc("cancel_appointment_slot", {
            p_slot_id: selectedSlot.doctor_slot_id
          });
          return createErrorResponse("Failed to create guest", 500, guestError.message);
        }
      }
      // Create Guest Appointment
      const { data, error: appointmentError } = await supabase.from("guest_appointments").insert({
        guest_appointment_id: crypto.randomUUID(),
        guest_id: guestId,
        phone,
        email: email || `${phone}@placeholder.com`,
        message,
        visit_type,
        schedule,
        appointment_status: "pending",
        doctor_id: doctor_id,
        slot_id: selectedSlot.doctor_slot_id,
        appointment_date: bookedSlotInfo.slot_date,
        appointment_time: bookedSlotInfo.slot_time,
        preferred_date: preferred_date || null,
        preferred_time: preferred_time || null,
        created_at: new Date().toISOString()
      }).select(`
        guest_appointment_id,
        guest_id,
        visit_type,
        appointment_status,
        schedule,
        message,
        doctor_id,
        slot_id,
        appointment_date,
        appointment_time,
        preferred_date,
        preferred_time,
        created_at
      `).single();
      if (appointmentError) {
        console.log(JSON.stringify({
          level: "error",
          message: "Guest appointment insert error",
          details: {
            code: appointmentError.code,
            message: appointmentError.message
          }
        }));
        await supabase.rpc("cancel_appointment_slot", {
          p_slot_id: selectedSlot.doctor_slot_id
        });
        return createErrorResponse("Failed to create guest appointment", 500, appointmentError.message);
      }
      newAppointment = data;
    } else {
      // Create Patient Appointment
      const { data, error: appointmentError } = await supabase.from("appointments").insert({
        appointment_id: crypto.randomUUID(),
        patient_id: patientId,
        phone,
        email: email || `${phone}@placeholder.com`,
        message,
        visit_type,
        schedule,
        appointment_status: "pending",
        doctor_id: doctor_id,
        slot_id: selectedSlot.doctor_slot_id,
        appointment_date: bookedSlotInfo.slot_date,
        appointment_time: bookedSlotInfo.slot_time,
        preferred_date: preferred_date || null,
        preferred_time: preferred_time || null,
        created_at: new Date().toISOString()
      }).select(`
        appointment_id,
        patient_id,
        visit_type,
        appointment_status,
        schedule,
        message,
        doctor_id,
        slot_id,
        appointment_date,
        appointment_time,
        preferred_date,
        preferred_time,
        created_at,
        patients (
          full_name,
          date_of_birth,
          gender
        )
      `).single();
      if (appointmentError) {
        console.log(JSON.stringify({
          level: "error",
          message: "Patient appointment insert error",
          details: {
            code: appointmentError.code,
            message: appointmentError.message
          }
        }));
        await supabase.rpc("cancel_appointment_slot", {
          p_slot_id: selectedSlot.doctor_slot_id
        });
        return createErrorResponse("Failed to create patient appointment", 500, appointmentError.message);
      }
      newAppointment = data;
    }
    // Fetch staff schedules for notifications
    const { data: staffSchedules, error: scheduleError } = await supabase.from("staff_schedules").select(`
      staff_id,
      start_time,
      end_time,
      timetable,
      staff_members (
        full_name,
        working_email,
        role
      )
    `);
    if (scheduleError) {
      console.log(JSON.stringify({
        level: "error",
        message: "Staff schedule error",
        details: scheduleError.message
      }));
      return createErrorResponse("Failed to fetch staff schedules", 500, scheduleError.message);
    }
    if (!staffSchedules || staffSchedules.length === 0) {
      return createSuccessResponse({
        success: true,
        message: "Appointment created, but no staff available to notify",
        data: {
          appointment: newAppointment,
          slot_info: bookedSlotInfo
        }
      });
    }
    const relevantStaff = staffSchedules.filter((schedule)=>{
      const isRelevantRole = schedule.staff_members?.role?.toLowerCase() === "receptionist" || schedule.staff_members?.role?.toLowerCase() === "doctor";
      if (!isRelevantRole) return false;
      const appointmentDateTime = new Date(`${bookedSlotInfo.slot_date}T${bookedSlotInfo.slot_time}+07:00`);
      const startTime = new Date(schedule.start_time);
      const endTime = new Date(schedule.end_time);
      return appointmentDateTime >= startTime && appointmentDateTime <= endTime;
    });
    if (relevantStaff.length === 0) {
      return createSuccessResponse({
        success: true,
        message: "Appointment created, but no eligible staff to notify on the specified date",
        data: {
          appointment: newAppointment,
          slot_info: bookedSlotInfo
        }
      });
    }
    // Redis and Email Notification Logic
    if (redis) {
      const isGuest = !!newAppointment.guest_appointment_id;
      const notificationChannel = "appointment_notifications";
      const notifications = relevantStaff.map((schedule)=>({
          staff_id: schedule.staff_id,
          notification_type: "new_appointment",
          sent_at: new Date().toISOString(),
          appointment_id: isGuest ? newAppointment.guest_appointment_id : newAppointment.appointment_id,
          appointment_details: {
            appointment_date: bookedSlotInfo.slot_date,
            appointment_time: bookedSlotInfo.slot_time,
            doctor_id: bookedSlotInfo.doctor_id,
            schedule,
            visit_type,
            patient_name: isGuest ? fullName : newAppointment.patients?.full_name,
            patient_email: email || `${phone}@placeholder.com`,
            patient_phone: phone
          },
          staff_details: {
            staff_email: schedule.staff_members.working_email,
            staff_name: schedule.staff_members.full_name,
            staff_role: schedule.staff_members.role
          }
        }));
      // Nodemailer setup
      const transporter = nodemailer.createTransport({
        host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
        port: parseInt(Deno.env.get("SMTP_PORT")) || 587,
        secure: false,
        auth: {
          user: Deno.env.get("SMTP_USER"),
          pass: Deno.env.get("SMTP_PASS")
        }
      });
      // Notification handling
      try {
        const results = await Promise.allSettled(notifications.map(async (notification)=>{
          try {
            // Publish to Redis
            await redis.publish(notificationChannel, JSON.stringify(notification));
            console.log(JSON.stringify({
              level: "info",
              message: "Published notification to Redis",
              details: {
                channel: notificationChannel,
                staff_id: notification.staff_id,
                appointment_id: notification.appointment_id
              }
            }));
            // Staff Email
            const staffMailOptions = {
              from: Deno.env.get("SMTP_FROM_EMAIL") || "no-reply@yourdomain.com",
              to: notification.staff_details.staff_email,
              subject: `New Appointment Notification #${notification.appointment_id}`,
              html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .header { background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
                    .content { padding: 20px; }
                    .content h2 { color: #333333; }
                    .content p { color: #555555; line-height: 1.6; }
                    .details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
                    .details p { margin: 5px 0; }
                    .footer { text-align: center; padding: 10px; color: #999999; font-size: 12px; }
                    .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>New Appointment Notification</h1>
                    </div>
                    <div class="content">
                      <h2>Appointment Details</h2>
                      <p>Dear ${notification.staff_details.staff_name || 'Staff'},</p>
                      <p>A new appointment has been scheduled. Please review the details below:</p>
                      <div class="details">
                        <p><strong>Appointment ID:</strong> ${notification.appointment_id}</p>
                        <p><strong>Patient Name:</strong> ${notification.appointment_details.patient_name || 'N/A'}</p>
                        <p><strong>Date:</strong> ${new Date(notification.appointment_details.appointment_date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${notification.appointment_details.appointment_time}</p>
                        <p><strong>Doctor ID:</strong> ${notification.appointment_details.doctor_id}</p>
                        <p><strong>Visit Type:</strong> ${notification.appointment_details.visit_type}</p>
                        <p><strong>Schedule:</strong> ${notification.appointment_details.schedule}</p>
                        <p><strong>Patient Email:</strong> ${notification.appointment_details.patient_email}</p>
                        <p><strong>Patient Phone:</strong> ${notification.appointment_details.patient_phone}</p>
                        <p><strong>Staff Role:</strong> ${notification.staff_details.staff_role}</p>
                        <p><strong>Sent At:</strong> ${new Date(notification.sent_at).toLocaleString()}</p>
                      </div>
                      <p>Please log in to the system to view more details or take further action.</p>
                      <a href="https://your-system-url.com" class="button">View Appointment</a>
                    </div>
                    <div class="footer">
                      <p>© ${new Date().getFullYear()} Your Clinic Name. All rights reserved.</p>
                    </div>
                  </div>
                </body>
                </html>
              `
            };
            await transporter.sendMail(staffMailOptions);
            console.log(JSON.stringify({
              level: "info",
              message: "Staff email notification sent",
              details: {
                to: notification.staff_details.staff_email,
                appointment_id: notification.appointment_id
              }
            }));
            // Customer Email (if valid email provided)
            if (notification.appointment_details.patient_email !== `${phone}@placeholder.com`) {
              const customerMailOptions = {
                from: Deno.env.get("SMTP_FROM_EMAIL") || "no-reply@yourdomain.com",
                to: notification.appointment_details.patient_email,
                subject: `Your Appointment Confirmation #${notification.appointment_id}`,
                html: `
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                      .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                      .header { background-color: #28a745; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
                      .content { padding: 20px; }
                      .content h2 { color: #333333; }
                      .content p { color: #555555; line-height: 1.6; }
                      .details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
                      .details p { margin: 5px 0; }
                      .footer { text-align: center; padding: 10px; color: #999999; font-size: 12px; }
                      .button { display: inline-block; padding: 10px 20px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>Appointment Confirmation</h1>
                      </div>
                      <div class="content">
                        <h2>Your Appointment Details</h2>
                        <p>Dear ${notification.appointment_details.patient_name || 'Valued Customer'},</p>
                        <p>Thank you for scheduling an appointment with us. Here are your appointment details:</p>
                        <div class="details">
                          <p><strong>Appointment ID:</strong> ${notification.appointment_id}</p>
                          <p><strong>Date:</strong> ${new Date(notification.appointment_details.appointment_date).toLocaleDateString()}</p>
                          <p><strong>Time:</strong> ${notification.appointment_details.appointment_time}</p>
                          <p><strong>Visit Type:</strong> ${notification.appointment_details.visit_type}</p>
                          <p><strong>Schedule:</strong> ${notification.appointment_details.schedule}</p>
                          <p><strong>Phone:</strong> ${notification.appointment_details.patient_phone}</p>
                        </div>
                        <p>Please arrive 10 minutes early and contact us if you need to reschedule.</p>
                        <a href="https://your-system-url.com" class="button">Manage Appointment</a>
                      </div>
                      <div class="footer">
                        <p>© ${new Date().getFullYear()} Your Clinic Name. All rights reserved.</p>
                      </div>
                    </div>
                  </body>
                  </html>
                `
              };
              await transporter.sendMail(customerMailOptions);
              console.log(JSON.stringify({
                level: "info",
                message: "Customer email notification sent",
                details: {
                  to: notification.appointment_details.patient_email,
                  appointment_id: notification.appointment_id
                }
              }));
            }
            return {
              success: true,
              staff_id: notification.staff_id
            };
          } catch (err) {
            console.error(JSON.stringify({
              level: "error",
              message: "Failed to send notification",
              details: {
                staff_id: notification.staff_id,
                error: err.message
              }
            }));
            return {
              success: false,
              staff_id: notification.staff_id,
              error: err.message
            };
          }
        }));
        const failed = results.filter((r)=>r.status === "fulfilled" && !r.value.success);
        const success = results.filter((r)=>r.status === "fulfilled" && r.value.success);
        return createSuccessResponse({
          success: true,
          message: `Appointment created. ${success.length} staff notified via Redis & Email, ${failed.length} failed.`,
          data: {
            appointment: newAppointment,
            slot_info: bookedSlotInfo,
            notifications: notifications.map((n)=>({
                staff_id: n.staff_id,
                staff_email: n.staff_details.staff_email,
                notification_type: n.notification_type,
                sent_at: n.sent_at,
                appointment_id: n.appointment_id
              })),
            failed_notifications: failed.map((f)=>({
                staff_id: f.value?.staff_id || "unknown",
                error: f.value?.error || "Unknown error"
              }))
          }
        });
      } catch (error) {
        console.error(JSON.stringify({
          level: "error",
          message: "Global error during notification handling",
          details: {
            error: error.message
          }
        }));
        return createErrorResponse("Failed to process notifications", 500, error.message);
      } finally{
        if (redis) {
          try {
            await redis.close();
            console.log(JSON.stringify({
              level: "info",
              message: "Redis connection closed"
            }));
          } catch (error) {
            console.log(JSON.stringify({
              level: "error",
              message: "Failed to close Redis connection",
              details: error.message
            }));
          }
        }
      }
    } else {
      return createSuccessResponse({
        success: true,
        message: "Appointment created, but Redis is not connected. No notifications sent.",
        data: {
          appointment: newAppointment,
          slot_info: bookedSlotInfo
        }
      });
    }
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      message: "Unexpected error in request handling",
      details: error.message
    }));
    return createErrorResponse("Unexpected server error", 500, error.message);
  }
});
