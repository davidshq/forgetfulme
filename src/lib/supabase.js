/**
 * Supabase client wrapper for Chrome extension
 * 
 * This assumes the Supabase UMD bundle has been loaded via script tag
 * in the HTML files, making window.supabase available globally.
 */

// Export the createClient function from the global supabase object
export const createClient = window.supabase.createClient;