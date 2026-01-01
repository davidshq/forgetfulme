/**
 * @fileoverview Service initialization utility
 * @module utils/service-initializer
 * @description Provides common service initialization pattern for app pages
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ConfigManager from './config-manager.js';
import AuthStateManager from './auth-state-manager.js';
import SupabaseConfig from '../supabase-config.js';
import SupabaseService from '../supabase-service.js';
import AuthUI from '../auth-ui.js';
import ConfigUI from '../config-ui.js';

/**
 * Initialize common services for app pages
 * @param {Object} options - Service initialization options
 * @param {Function} options.onAuthSuccess - Callback for successful authentication
 * @param {boolean} [options.includeConfigUI=false] - Whether to include ConfigUI (for options page)
 * @returns {Object} Initialized services
 *
 * @example
 * const services = initializeServices({
 *   onAuthSuccess: () => this.onAuthSuccess(),
 *   includeConfigUI: true // for options page
 * });
 */
export function initializeServices(options = {}) {
  const { onAuthSuccess, includeConfigUI = false } = options;

  const configManager = new ConfigManager();
  const authStateManager = new AuthStateManager();
  const supabaseConfig = new SupabaseConfig();
  const supabaseService = new SupabaseService(supabaseConfig);
  const authUI = new AuthUI(supabaseConfig, onAuthSuccess, authStateManager);

  const services = {
    configManager,
    authStateManager,
    supabaseConfig,
    supabaseService,
    authUI,
  };

  if (includeConfigUI) {
    services.configUI = new ConfigUI(supabaseConfig);
  }

  return services;
}
