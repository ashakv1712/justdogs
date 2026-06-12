import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase.d';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// createBrowserClient is a singleton — calling it again with the same URL/key
// returns the same instance, staying in sync with the server-side cookie storage.
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth state change listener
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    // Token refresh failed — sign out to clear cookies then redirect
    supabase.auth.signOut().finally(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?message=session_expired';
      }
    });
  } else if (event === 'SIGNED_OUT') {
    // Cookies are cleared automatically by Supabase on sign out
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
});

export type SupabaseClient = typeof supabase;
