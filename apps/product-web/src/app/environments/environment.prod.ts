export const environment = {
  production: true,

  // ========== SUPABASE CONFIGURATION ==========
  // 1. Supabase URL with functions endpoint
  supabaseUrl: 'https://xzxxodxplyetecrsbxmc.supabase.co',

  // 2. Storage bucket URL
  supabaseStorageUrl: 'https://xzxxodxplyetecrsbxmc.supabase.co/storage/v1/object/public/patient-uploads',

  // 3. Service role key (for server-side RPC operations) - UPDATED
  supabaseServiceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eHhvZHhwbHlldGVjcnNieG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTYxMTYyMCwiZXhwIjoyMDY1MTg3NjIwfQ.ZJZbbAmyma-ZFr4vDZiupkvNWMCzupOKsM_j3cakyII',

  // 4. Anon key (for client-side operations) - UPDATED
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eHhvZHhwbHlldGVjcnNieG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTE2MjAsImV4cCI6MjA2NTE4NzYyMH0.O60A63ihSaQ_2qbLozpU04yy7ZB5h8BUZqEvWWCLnf0',

  // ========== BACKWARD COMPATIBILITY ==========
  // Legacy properties for other services
  apiEndpoint: 'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eHhvZHhwbHlldGVjcnNieG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTYxMTYyMCwiZXhwIjoyMDY1MTg3NjIwfQ.ZJZbbAmyma-ZFr4vDZiupkvNWMCzupOKsM_j3cakyII',
  authCallbackUrl: '/auth/callback',
  getCurrentOrigin: () => typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200',
};
