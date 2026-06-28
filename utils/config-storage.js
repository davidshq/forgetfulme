/**
 * @fileoverview Configuration storage utility
 * @module config-storage
 * @description Handles configuration storage operations
 */

import { DEFAULT_STATUS_TYPES } from './constants.js';

/**
 * Load all configuration from storage
 * @returns {Promise<Object>} Configuration object
 */
export async function loadAllConfig() {
  try {
    const result = await chrome.storage.sync.get([
      'supabaseConfig',
      'customStatusTypes',
      'auth_session',
    ]);

    return {
      supabase: result.supabaseConfig || null,
      preferences: {
        customStatusTypes: result.customStatusTypes || [
          ...DEFAULT_STATUS_TYPES,
        ],
      },
      auth: result.auth_session || null,
    };
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
}

/**
 * Save Supabase configuration to storage
 * @param {Object} supabaseConfig - Supabase configuration object
 */
export async function saveSupabaseConfig(supabaseConfig) {
  await chrome.storage.sync.set({
    supabaseConfig: supabaseConfig,
  });
}

/**
 * Save custom status types to storage
 * @param {Array} statusTypes - Array of status type strings
 */
export async function saveCustomStatusTypes(statusTypes) {
  await chrome.storage.sync.set({
    customStatusTypes: statusTypes,
  });
}

/**
 * Save authentication session to storage
 * @param {Object|null} session - Authentication session object
 */
export async function saveAuthSession(session) {
  await chrome.storage.sync.set({
    auth_session: session,
  });
}

/**
 * Clear authentication session from storage
 */
export async function clearAuthSession() {
  await chrome.storage.sync.remove(['auth_session']);
}

/**
 * Initialize default settings
 * @returns {Promise<Object>} Default settings object
 */
export async function initializeDefaultSettings() {
  const defaultSettings = {
    customStatusTypes: [...DEFAULT_STATUS_TYPES],
  };

  await chrome.storage.sync.set(defaultSettings);
  return defaultSettings;
}
