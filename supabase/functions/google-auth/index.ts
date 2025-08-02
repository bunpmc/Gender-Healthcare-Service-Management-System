import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Verify Google access token and get user info
async function verifyGoogleToken(accessToken) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
    );
    if (!response.ok) {
      throw new Error("Invalid Google token");
    }
    const userInfo = await response.json();
    // Verify it's a Gmail address
    if (!userInfo.email || !userInfo.email.endsWith("@gmail.com")) {
      throw new Error("Only Gmail addresses are allowed");
    }
    return userInfo;
  } catch (error) {
    console.error("Google token verification error:", error);
    throw error;
  }
}
serve(async (req) => {
  try {
    const { accessToken, idToken, userInfo } = await req.json();
    // Validate input
    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error: "Access token is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
    // Verify Google token and get user info
    let verifiedUserInfo;
    try {
      verifiedUserInfo = await verifyGoogleToken(accessToken);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid Google authentication token: " + error.message,
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin
      .listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({
          error: "Failed to check user existence",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
    const existingUser = existingUsers.users.find((user) =>
      user.email === verifiedUserInfo.email
    );
    if (existingUser) {
      // User exists - sign them in
      console.log("Existing user found:", verifiedUserInfo.email);
      // Update user metadata with Google info
      await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          google_id: verifiedUserInfo.id,
          picture: verifiedUserInfo.picture,
          given_name: verifiedUserInfo.given_name,
          family_name: verifiedUserInfo.family_name,
          last_google_signin: new Date().toISOString(),
        },
      });
      // Generate a session for the existing user
      const { data: sessionData, error: _sessionError } = await supabase.auth
        .admin.generateLink({
          type: "magiclink",
          email: verifiedUserInfo.email,
          options: {
            redirectTo: undefined,
          },
        });
      if (_sessionError) {
        console.error("Session generation error:", _sessionError);
        return new Response(
          JSON.stringify({
            error: "Failed to create session",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }
      // Get user profile
      const { data: patientProfile, error: _profileError } = await supabase
        .from("patients").select("*").eq("user_id", existingUser.id).single();
      return new Response(
        JSON.stringify({
          success: true,
          message: "Sign-in successful",
          user: existingUser,
          session: sessionData,
          profile: patientProfile || null,
          action: "signin",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } else {
      // User doesn't exist - create new account
      console.log("Creating new user:", verifiedUserInfo.email);
      const { data: newUser, error: createError } = await supabase.auth.admin
        .createUser({
          email: verifiedUserInfo.email,
          email_confirm: true,
          user_metadata: {
            full_name: verifiedUserInfo.name,
            given_name: verifiedUserInfo.given_name,
            family_name: verifiedUserInfo.family_name,
            picture: verifiedUserInfo.picture,
            google_id: verifiedUserInfo.id,
            email_verified: verifiedUserInfo.verified_email,
            auth_provider: "google",
            created_via: "google_oauth",
          },
        });
      if (createError) {
        console.error("User creation error:", createError);
        return new Response(
          JSON.stringify({
            error: createError.message || "Failed to create user account",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }
      // Create patient profile
      const { data: patientProfile, error: _profileError } = await supabase
        .from("patients").insert({
          user_id: newUser.user.id,
          email: verifiedUserInfo.email,
          full_name: verifiedUserInfo.name,
          image_link: verifiedUserInfo.picture,
          patient_status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).select().single();
      if (_profileError) {
        console.error("Profile creation error:", _profileError);
        // Don't fail the signup if profile creation fails, but log it
      }
      // Generate session for new user
      const { data: sessionData, error: _sessionError } = await supabase.auth
        .admin.generateLink({
          type: "magiclink",
          email: verifiedUserInfo.email,
          options: {
            redirectTo: undefined,
          },
        });
      return new Response(
        JSON.stringify({
          success: true,
          message: "Account created and signed in successfully",
          user: newUser.user,
          session: sessionData,
          profile: patientProfile || null,
          action: "signup",
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
