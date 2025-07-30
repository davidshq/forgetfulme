/**
 * Supabase client for service worker context
 *
 * Service workers can't use window.supabase, so we need to load
 * the UMD bundle differently or import from node_modules.
 */

// Try to use dynamic import to load the node_modules version in service worker
let createClient;

try {
  // In service worker context, try to import from node modules
  const supabase = await import('../../node_modules/@supabase/supabase-js/dist/module/index.js');
  createClient = supabase.createClient;
} catch (error) {
  console.error('[ServiceWorker] Could not load Supabase client:', error);

  // Fallback: Create a stub that shows meaningful errors
  createClient = () => {
    throw new Error(
      'Supabase client not available in service worker context. Please configure the extension through the Options page first.'
    );
  };
}

export { createClient };
