// Main entry point for bookmark management modules
// Wires together UI, state, and event modules

import * as UI from './ui/render.js';
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
        displayBookmarks: params =>
          UI.displayBookmarks({
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
    tags: BookmarkTransformer.normalizeTags(existingBookmark.tags),
    created_at: existingBookmark.created_at,
  };

  // Create the edit form content
  const editFormContent = document.createElement('div');
  editFormContent.className = 'edit-form-content';

  // Bookmark info section
  const infoSection = UIComponents.createSection(
    'Bookmark Info',
    'info-section'
  );
  infoSection.innerHTML = `
    <div class="bookmark-info">
      <p><strong>Title:</strong> ${dbBookmark.title}</p>
      <p><strong>URL:</strong> <a href="${dbBookmark.url}" target="_blank">${dbBookmark.url}</a></p>
      <p><strong>Current Status:</strong> ${formatStatus(dbBookmark.read_status)}</p>
      <p><strong>Current Tags:</strong> ${dbBookmark.tags ? dbBookmark.tags.join(', ') : 'None'}</p>
      <p><strong>Created:</strong> ${formatTime(new Date(dbBookmark.created_at).getTime())}</p>
    </div>
  `;
  editFormContent.appendChild(infoSection);

  // Status options
  const statusOptions = [
    { value: 'read', text: 'Read' },
    { value: 'good-reference', text: 'Good Reference' },
    { value: 'low-value', text: 'Low Value' },
    { value: 'revisit-later', text: 'Revisit Later' },
  ];
  statusOptions.forEach(option => {
    if (option.value === dbBookmark.read_status) {
      option.selected = true;
    }
  });

  // Create form
  const editForm = UIComponents.createForm(
    'editBookmarkForm',
    async e => {
      e.preventDefault();

      // Extract form data directly from the modal form
      const formData = new FormData(e.target);
      const status = formData.get('edit-read-status') || 'read';
      const tags = formData.get('edit-tags') || '';

      const updateData = {
        read_status: status,
        tags: tags.trim()
          ? tags
              .trim()
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0)
          : [],
        updated_at: new Date().toISOString(),
      };

      try {
        UIComponents.closeModal(modal);
        await supabaseService.updateBookmark(dbBookmark.id, updateData);
        UIMessages.success('Bookmark updated successfully!', appContainer);
        await loadAllBookmarks(); // Refresh the list after update
      } catch (error) {
        const errorResult = ErrorHandler.handle(
          error,
          'bookmark-management.updateBookmark'
        );
        UIMessages.error(errorResult.userMessage, appContainer);
      }
    },
    [
      {
        type: 'select',
        id: 'edit-read-status',
        label: 'Update Status:',
        options: {
          options: statusOptions,
        },
      },
      {
        type: 'text',
        id: 'edit-tags',
        label: 'Update Tags (comma separated):',
        options: {
          placeholder: 'research, tutorial, important',
          value: dbBookmark.tags ? dbBookmark.tags.join(', ') : '',
        },
      },
    ],
    {
      submitText: 'Update Bookmark',
    }
  );
  editFormContent.appendChild(editForm);

  // Create modal with edit form
  const modal = UIComponents.createModal({
    title: 'Edit Bookmark',
    content: editFormContent,
    className: 'edit-bookmark-modal',
    showClose: true,
  });

  // Add modal to DOM and show it
  document.body.appendChild(modal);
  UIComponents.showModal(modal);
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
