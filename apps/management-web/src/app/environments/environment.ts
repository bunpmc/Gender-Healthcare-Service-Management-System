export const environment = {
  production: false,
  supabaseUrl: (globalThis as any).ENV?.SUPABASE_URL || 'https://xzxxodxplyetecrsbxmc.supabase.co',
  supabaseKey: (globalThis as any).ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eHhvZHhwbHlldGVjcnNieG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTE2MjAsImV4cCI6MjA2NTE4NzYyMH0.O60A63ihSaQ_2qbLozpU04yy7ZB5h8BUZqEvWWCLnf0',
  apiEndpoint: (globalThis as any).ENV?.API_ENDPOINT || 'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1',
  mockEndpoint: (globalThis as any).ENV?.MOCK_ENDPOINT || 'https://e848c397-890a-4aea-b840-a054fa9ff65f.mock.pstmn.io',
  authorization: (globalThis as any).ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eHhvZHhwbHlldGVjcnNieG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTE2MjAsImV4cCI6MjA2NTE4NzYyMH0.O60A63ihSaQ_2qbLozpU04yy7ZB5h8BUZqEvWWCLnf0',
};
