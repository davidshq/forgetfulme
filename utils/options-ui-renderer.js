/**
 * @fileoverview Options page UI renderer
 * @module options-ui-renderer
 * @description Handles UI rendering for the options page
 */

import UIComponents from './ui-components.js';

/**
 * Render main interface for options page
 * @param {HTMLElement} appContainer - Container element
 * @param {Object} callbacks - Callback functions
 * @returns {Object} References to created elements
 */
export function renderMainInterface(appContainer, callbacks) {
  // Create main container
  const mainContainer = UIComponents.createContainer('ForgetfulMe Settings', '', 'main-container');

  // Create config card
  const configCard = UIComponents.createCard(
    'Supabase Configuration',
    '<div id="config-status-container"></div>',
    '',
    'config-card',
  );
  mainContainer.appendChild(configCard);

  // Create stats card
  const statsGrid = UIComponents.createGrid(
    [
      { text: 'Total Entries:', className: 'stat-item' },
      { text: 'Status Types:', className: 'stat-item' },
      { text: 'Most Used Status:', className: 'stat-item' },
    ],
    { className: 'stats-grid' },
  );

  // Add stat values safely
  const statItems = statsGrid.querySelectorAll('.grid-item');
  if (statItems.length >= 3) {
    statItems[0].innerHTML =
      '<span class="stat-label">Total Entries:</span><span id="total-entries" class="stat-value">-</span>';
    statItems[1].innerHTML =
      '<span class="stat-label">Status Types:</span><span id="status-types-count" class="stat-value">-</span>';
    statItems[2].innerHTML =
      '<span class="stat-label">Most Used Status:</span><span id="most-used-status" class="stat-value">-</span>';
  }

  const statsCard = UIComponents.createCard('Statistics', statsGrid.outerHTML, '', 'stats-card');
  mainContainer.appendChild(statsCard);

  // Create status types card
  const statusCard = createStatusTypesCard(callbacks);
  mainContainer.appendChild(statusCard);

  // Create data management card
  const dataCard = createDataManagementCard(callbacks);
  mainContainer.appendChild(dataCard);

  // Create bookmark management card
  const bookmarkCard = createBookmarkManagementCard(callbacks);
  mainContainer.appendChild(bookmarkCard);

  // Assemble the interface
  appContainer.innerHTML = '';
  appContainer.appendChild(mainContainer);

  return {
    configStatusContainer: UIComponents.DOM.getElement('config-status-container'),
  };
}

/**
 * Create status types card
 * @param {Object} callbacks - Callback functions
 * @returns {HTMLElement} Status types card
 */
function createStatusTypesCard(callbacks) {
  const addStatusContainer = document.createElement('div');
  addStatusContainer.className = 'add-status';

  const addStatusForm = UIComponents.createForm(
    'add-status-form',
    e => {
      e.preventDefault();
      callbacks.addCustomStatus();
    },
    [
      {
        type: 'text',
        id: 'new-status-name',
        label: 'Status Name:',
        options: {
          placeholder: 'e.g., Important, Reference',
          required: true,
        },
      },
      {
        type: 'text',
        id: 'new-status-description',
        label: 'Description:',
        options: {
          placeholder: 'Brief description of this status',
        },
      },
    ],
    {
      submitText: 'Add Status',
      className: 'add-status-form',
    },
  );

  addStatusContainer.appendChild(addStatusForm);

  const statusListContainer = document.createElement('div');
  statusListContainer.id = 'status-list-container';
  statusListContainer.className = 'status-list';

  addStatusContainer.appendChild(statusListContainer);

  return UIComponents.createCard(
    'Custom Status Types',
    addStatusContainer.outerHTML,
    '',
    'status-card',
  );
}

/**
 * Create data management card
 * @param {Object} callbacks - Callback functions
 * @returns {HTMLElement} Data management card
 */
function createDataManagementCard(callbacks) {
  const dataActions = [
    {
      text: 'Export All Data',
      onClick: () => callbacks.exportAllData(),
      className: 'secondary',
    },
    {
      text: 'Import Data',
      onClick: () => callbacks.importData(),
      className: 'secondary',
    },
    {
      text: 'Clear All Data',
      onClick: () => callbacks.clearAllData(),
      className: 'contrast',
    },
  ];

  return UIComponents.createCardWithActions(
    'Data Management',
    '<p>Export your bookmarks to JSON format, import data from a backup, or clear all stored data.</p>',
    dataActions,
    'data-card',
  );
}

/**
 * Create bookmark management card
 * @param {Object} callbacks - Callback functions
 * @returns {HTMLElement} Bookmark management card
 */
function createBookmarkManagementCard(callbacks) {
  const manageBookmarksBtn = UIComponents.createButton(
    '📚 Manage Bookmarks',
    () => callbacks.openBookmarkManagement(),
    'secondary',
    {
      id: 'manage-bookmarks-btn',
      title: 'Open bookmark management interface',
    },
  );

  return UIComponents.createCard(
    'Bookmark Management',
    '<p>Access the full bookmark management interface to search, filter, and manage your bookmarks.</p>',
    manageBookmarksBtn.outerHTML,
    'bookmark-card',
  );
}
