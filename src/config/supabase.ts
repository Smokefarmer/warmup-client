import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable automatic refresh to prevent unnecessary API calls
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL on page load
    detectSessionInUrl: true
  }
});

// Auth configuration
export const authConfig = {
  // Disable sign up (registration) - users can only be added via dashboard
  signUp: false,
  // Enable sign in
  signIn: true,
  // Redirect URLs (adjust these based on your domain)
  redirectTo: `${window.location.origin}/`,
  // Session timeout (optional)
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

export default supabase;
