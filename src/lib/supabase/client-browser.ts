import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase.d';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Singleton — same instance as client.ts when called with the same URL/key.
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    maxAge: 60 * 60 * 24 * 400,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'jsdog-app@1.0.0',
    },
  },
});

export type SupabaseClient = typeof supabase;
