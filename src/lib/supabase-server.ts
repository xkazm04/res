import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role for API routes
// This should only be used in server-side code (API routes, server components)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Use service role key if available, otherwise fall back to anon key
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('Missing Supabase key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
