// Main entry point for bookmark management modules
// Wires together UI, state, and event modules

import * as UI from './ui/render.js';
import * as EditUI from './ui/edit.js';
import * as State from './state/init.js';
import * as Auth from './state/auth.js';
import * as Handlers from './events/handlers.js';
import * as Bulk from './events/bulk.js';

import UIComponents from '../utils/ui-components.js';
import AuthStateManager from '../utils/auth-state-manager.js';
import ErrorHandler from '../utils/error-handler.js';
import UIMessages from '../utils/ui-messages.js';
import BookmarkTransformer from '../utils/bookmark-transformer.js';
import SupabaseConfig from '../supabase-config.js';
import SupabaseService from '../supabase-service.js';
import { formatStatus, formatTime } from '../utils/formatters.js';

// App state
const authStateManager = new AuthStateManager();
const supabaseConfig = new SupabaseConfig();
const supabaseService = new SupabaseService(supabaseConfig);
let appContainer = null;

function showMainInterface() {
  UI.showMainInterface({
    UIComponents,
    appContainer,
    onSearch: e => {
      e.preventDefault();
      Handlers.searchBookmarks({
        UIComponents,
        supabaseService,
        BookmarkTransformer,
        appContainer,
        UIMessages,
        ErrorHandler,
        displayBookmarks: (params) => UI.displayBookmarks({
          ...params,
          updateBulkActions: Handlers.updateBulkActions,
          onEdit: bookmark => showEditInterface(bookmark),
          onDelete: (bookmarkId, bookmarkTitle) =>
            Handlers.deleteBookmark({
              supabaseService,
              appContainer,
              UIMessages,
              ErrorHandler,
              bookmarkId,
              bookmarkTitle,
              loadAllBookmarks,
            }),
          onOpen: url => Handlers.openBookmark({ url }),
        }),
      });
    },
    onSelectAll: () =>
      Handlers.toggleSelectAll({
        updateBulkActions: Handlers.updateBulkActions,
      }),
    onDeleteSelected: () =>
      Bulk.deleteSelectedBookmarks({
        supabaseService,
        appContainer,
        UIMessages,
        ErrorHandler,
      }),
    onExportSelected: () =>
      Bulk.exportSelectedBookmarks({
        supabaseService,
        BookmarkTransformer,
        appContainer,
        UIMessages,
        ErrorHandler,
      }),
    loadAllBookmarks: () => loadAllBookmarks(),
    bindBulkActions: () =>
      Handlers.bindBulkActions({
        onSelectAll: () =>
          Handlers.toggleSelectAll({
            updateBulkActions: Handlers.updateBulkActions,
          }),
        onDeleteSelected: () =>
          Bulk.deleteSelectedBookmarks({
            supabaseService,
            appContainer,
            UIMessages,
            ErrorHandler,
          }),
        onExportSelected: () =>
          Bulk.exportSelectedBookmarks({
            supabaseService,
            BookmarkTransformer,
            appContainer,
            UIMessages,
            ErrorHandler,
          }),
      }),
  });
}

function showSetupInterface() {
  UI.showSetupInterface({
    UIComponents,
    appContainer,
    openSettings: () => chrome.runtime.openOptionsPage(),
  });
}

function showAuthInterface() {
  UI.showAuthInterface({ appContainer });
}

function showEditInterface(existingBookmark) {
  // Convert UI format back to database format for edit interface
  const dbBookmark = {
    id: existingBookmark.id,
    url: existingBookmark.url,
    title: existingBookmark.title,
    description: existingBookmark.description,
    read_status: existingBookmark.status, // UI format uses 'status' instead of 'read_status'
    tags: existingBookmark.tags,
    created_at: existingBookmark.created_at,
  };
  
  EditUI.showEditInterface({
    existingBookmark: dbBookmark,
    UIComponents,
    appContainer,
    onBack: () => showMainInterface(),
    onUpdate: bookmarkId =>
      Handlers.updateBookmark({
        UIComponents,
        supabaseService,
        appContainer,
        UIMessages,
        ErrorHandler,
        bookmarkId,
        showMainInterface,
      }),
    formatStatus,
    formatTime,
  });
}

async function loadAllBookmarks() {
  try {
    const bookmarks = await supabaseService.getBookmarks({ limit: 100 });
    UI.displayBookmarks({
      bookmarks,
      BookmarkTransformer,
      appContainer,
      UIMessages,
      ErrorHandler,
      updateBulkActions: Handlers.updateBulkActions,
      onEdit: bookmark => showEditInterface(bookmark),
      onDelete: (bookmarkId, bookmarkTitle) =>
        Handlers.deleteBookmark({
          supabaseService,
          appContainer,
          UIMessages,
          UIComponents,
          ErrorHandler,
          bookmarkId,
          bookmarkTitle,
          loadAllBookmarks,
        }),
      onOpen: url => Handlers.openBookmark({ url }),
    });
  } catch (error) {
    const errorResult = ErrorHandler.handle(
      error,
      'bookmark-management.loadAllBookmarks'
    );
    UIMessages.error(errorResult.userMessage, appContainer);
  }
}

// App initialization
document.addEventListener('DOMContentLoaded', async () => {
  appContainer = UIComponents.DOM.getElement('app');
  if (!appContainer) {
    throw ErrorHandler.createError(
      'App container not found',
      ErrorHandler.ERROR_TYPES.UI,
      'bookmark-management.initializeElements'
    );
  }
  // Auth state management
  await Auth.initializeAuthState({
    authStateManager,
    handleAuthStateChange: session => {
      if (session) {
        showMainInterface();
      } else {
        showAuthInterface();
      }
    },
    ErrorHandler,
  });
  // Initial app load
  await State.initializeApp({
    supabaseConfig,
    supabaseService,
    authStateManager,
    appContainer,
    showSetupInterface,
    showMainInterface,
    showAuthInterface,
    ErrorHandler,
    UIMessages,
  });
});
