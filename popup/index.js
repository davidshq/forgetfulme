/**
 * @fileoverview Main entry point for the ForgetfulMe popup interface
 * @module popup/index
 * @description Initializes popup services, sets up context, and coordinates between UI, state, and event modules
 * @since 1.0.0
 * @author ForgetfulMe Team
 */

// Main entry point for modular popup
import * as ui from './ui/render.js';
import * as state from './state/bookmarks.js';
import * as authState from './state/auth.js';
import * as events from './events/handlers.js';

import UIComponents from '../utils/ui-components.js';
import AuthUI from '../auth-ui.js';
import { formatStatus, formatTime } from '../utils/formatters.js';
import UIMessages from '../utils/ui-messages.js';
import ErrorHandler from '../utils/error-handler.js';
import ConfigManager from '../utils/config-manager.js';
import BookmarkTransformer from '../utils/bookmark-transformer.js';
import SupabaseService from '../supabase-service.js';
import SupabaseConfig from '../supabase-config.js';

// Make UIComponents globally available for UIMessages
window.UIComponents = UIComponents;

/**
 * Context object to share state and services between popup modules
 * @namespace ctx
 * @description Central context object containing all shared services, utilities, and state
 * @property {UIComponents} UIComponents - UI component utilities
 * @property {UIMessages} UIMessages - Message display utilities  
 * @property {ErrorHandler} ErrorHandler - Error handling utilities
 * @property {ConfigManager|null} ConfigManager - Configuration management service
 * @property {BookmarkTransformer} BookmarkTransformer - Bookmark data transformation utilities
 * @property {SupabaseConfig|null} supabaseConfig - Supabase configuration service
 * @property {SupabaseService|null} supabaseService - Supabase data service
 * @property {AuthUI|null} authUI - Authentication UI component
 * @property {HTMLElement|null} appContainer - Main app container element
 * @property {string|null} currentBookmarkUrl - Currently active bookmark URL
 * @property {Function} formatStatus - Status formatting utility
 * @property {Function} formatTime - Time formatting utility
 * @property {Object} ui - UI rendering functions
 * @property {Object} state - State management functions
 * @property {Object} events - Event handling functions
 */
const ctx = {
  UIComponents,
  UIMessages,
  ErrorHandler,
  ConfigManager: null,
  BookmarkTransformer,
  supabaseConfig: null,
  supabaseService: null,
  authUI: null,
  appContainer: null,
  currentBookmarkUrl: null,
  formatStatus,
  formatTime,
  ui,
  state,
  events,
};

/**
 * Initialize the popup application when DOM is loaded
 * @async
 * @function
 * @description Sets up services, initializes context, and starts the popup application
 * @listens DOMContentLoaded
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Set up app container
  ctx.appContainer = UIComponents.DOM.getElement('main-content');
  // Set up core services
  ctx.ConfigManager = new ConfigManager();
  ctx.supabaseConfig = new SupabaseConfig();
  await ctx.supabaseConfig.initialize();
  ctx.supabaseService = new SupabaseService(ctx.supabaseConfig);
  // Optionally, initialize supabaseService if needed
  if (typeof ctx.supabaseService.initialize === 'function') {
    await ctx.supabaseService.initialize();
  }
  // Set up AuthUI instance
  ctx.authUI = new AuthUI(
    ctx.supabaseConfig /*, onAuthSuccess, authStateManager to be injected if needed */
  );
  // Wire up state and events modules to context
  ctx.state = {
    ...state,
    ...authState,
  };
  ctx.events = events;
  ctx.ui = ui;

  // Initialize state, show UI
  if (ctx.state && ctx.state.initializeAuthState) {
    await ctx.state.initializeAuthState(ctx);
  }
  if (ctx.ui && ctx.ui.showMainInterface) {
    ctx.ui.showMainInterface(ctx);
  }
});

export { ctx };
