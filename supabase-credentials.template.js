/**
 * Supabase Credentials Template
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to 'supabase-credentials.js' (don't commit the copy!)
 * 2. Replace the placeholder values with your actual Supabase credentials
 * 3. Get your credentials from: https://supabase.com/dashboard → Your Project → Settings → API
 * 
 * SECURITY NOTES:
 * - supabase-credentials.js is in .gitignore and will never be committed
 * - Only use the anon key (public key), never the service role key
 * - The anon key is safe for client-side use with Row Level Security
 */

export const SUPABASE_CREDENTIALS = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'your-anon-key-here'
};

// Example with real format (replace with your actual values):
// export const SUPABASE_CREDENTIALS = {
//   url: 'https://abcdefghijk.supabase.co',
//   anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJl...'
// };