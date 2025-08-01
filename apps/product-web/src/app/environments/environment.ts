export const environment = {
  production: false,
  apiEndpoint: "https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1",
  // Supabase Configuration
  supabaseUrl: "https://xzxxodxplyetecrsbxmc.supabase.co",
  supabaseStorageUrl:
    "https://xzxxodxplyetecrsbxmc.supabase.co/storage/v1/object/public/patient-uploads",
  // Service role key (for server-side operations)
  supabaseServiceKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eHhvZHhwbHlldGVjcnNieG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjM5NzE5NCwiZXhwIjoyMDUxOTczMTk0fQ.TDXlW3dIvvmYv5QKUsAy_vpU3U_x7BMQ1IdfEWmWtJQ",
  // Anon key (for client-side operations) - Get this from your Supabase dashboard
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eHhvZHhwbHlldGVjcnNieG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzOTcxOTQsImV4cCI6MjA1MTk3MzE5NH0.dAiDNh0YAUB_A2lm9F5GQw6uFJjlXUKK5rGZzBpCxQs",
  // Auth redirect URLs
  authCallbackUrl: "/auth/callback",

  // Helper function to get current origin
  getCurrentOrigin: () =>
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:4200",
};
