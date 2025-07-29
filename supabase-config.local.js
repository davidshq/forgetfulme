/**
 * Local Supabase Configuration for Development
 * 
 * This file loads credentials from a separate file that's not in source control.
 * 
 * SETUP:
 * 1. Copy supabase-credentials.template.js to supabase-credentials.js
 * 2. Add your actual Supabase credentials to supabase-credentials.js
 * 3. The Options page configuration will still take precedence over this
 */

// Import credentials from the separate file
import { SUPABASE_CREDENTIALS } from './supabase-credentials.js';

export const SUPABASE_CONFIG = {
  url: SUPABASE_CREDENTIALS?.url || 'https://your-project-id.supabase.co',
  anonKey: SUPABASE_CREDENTIALS?.anonKey || 'your-anon-key-here',
  
  // Optional: Service configuration
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Disable for Chrome extension
    },
  }
};

// Default configuration template for reference
export const CONFIG_TEMPLATE = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
};

/**
 * Validate that configuration has been set up
 * @returns {boolean} True if configuration looks valid
 */
export function isConfigured() {
  return SUPABASE_CONFIG.url !== 'https://your-project-id.supabase.co' &&
         SUPABASE_CONFIG.anonKey !== 'your-anon-key-here' &&
         SUPABASE_CONFIG.url.includes('.supabase.co') &&
         SUPABASE_CONFIG.anonKey.startsWith('eyJ');
}

/**
 * Get configuration for the extension
 * @returns {Object} Configuration object
 */
export function getConfig() {
  if (!isConfigured()) {
    console.warn('Supabase configuration not set up. Using placeholder values.');
    console.warn('Please update supabase-config.local.js with your actual credentials.');
  }
  
  return SUPABASE_CONFIG;
}