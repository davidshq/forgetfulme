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

// Context object to share state/services between modules
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

window.addEventListener('DOMContentLoaded', async () => {
  // Set up app container
  ctx.appContainer = UIComponents.DOM.getElement('app');
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

  // Initialize state, bind events, show UI
  if (ctx.state && ctx.state.initializeAuthState) {
    await ctx.state.initializeAuthState(ctx);
  }
  if (ctx.events && ctx.events.bindEvents) {
    ctx.events.bindEvents(ctx);
  }
  if (ctx.ui && ctx.ui.showMainInterface) {
    ctx.ui.showMainInterface(ctx);
  }
});

export { ctx };
