/**
 * @fileoverview Options controller for the ForgetfulMe extension
 */

import { BaseController } from './BaseController.js';
import { $, $$, show, hide, setFormData, clearElement } from '../utils/dom.js';

/**
 * Controller for the options page
 */
export class OptionsController extends BaseController {
  /**
   * @param {ConfigService} configService - Configuration service
   * @param {AuthService} authService - Authentication service
   * @param {BookmarkService} bookmarkService - Bookmark service
   * @param {StorageService} storageService - Storage service
   * @param {ValidationService} validationService - Validation service
   * @param {ErrorService} errorService - Error handling service
   */
  constructor(
    configService,
    authService,
    bookmarkService,
    storageService,
    validationService,
    errorService
  ) {
    super(errorService);
    this.configService = configService;
    this.authService = authService;
    this.bookmarkService = bookmarkService;
    this.storageService = storageService;
    this.validationService = validationService;

    this.currentSection = 'database';
    this.statusTypes = [];
  }

  /**
   * Initialize the options controller
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Set up navigation
      this.setupNavigation();

      // Set up event listeners
      this.setupEventListeners();

      // Load initial data
      await this.loadInitialData();

      // Show default section
      this.showSection('database');
    } catch (error) {
      this.handleError(error, 'OptionsController.initialize');
    }
  }

  /**
   * Set up navigation event listeners
   */
  setupNavigation() {
    const navButtons = $$('.nav-button');
    navButtons.forEach(button => {
      this.addEventListener(button, 'click', () => {
        const sectionId = button.id.replace('nav-', '');
        this.showSection(sectionId);
      });
    });
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Database configuration
    this.addEventListener($('#database-form'), 'submit', e => {
      e.preventDefault();
      this.handleSaveDatabaseConfig();
    });

    this.addEventListener($('#test-connection'), 'click', () => {
      this.handleTestConnection();
    });

    // Status types
    this.addEventListener($('#add-status-form'), 'submit', e => {
      e.preventDefault();
      this.handleAddStatusType();
    });

    this.addEventListener($('#reset-status-types'), 'click', () => {
      this.handleResetStatusTypes();
    });

    // Status type list event delegation
    this.addEventListener($('#status-types-list'), 'click', e => {
      if (e.target.matches('.edit-status')) {
        const statusId = e.target.dataset.statusId;
        this.handleEditStatusType(statusId);
      } else if (e.target.matches('.delete-status')) {
        const statusId = e.target.dataset.statusId;
        this.handleDeleteStatusType(statusId);
      }
    });

    // Preferences
    this.addEventListener($('#preferences-form'), 'submit', e => {
      e.preventDefault();
      this.handleSavePreferences();
    });

    this.addEventListener($('#reset-preferences'), 'click', () => {
      this.handleResetPreferences();
    });

    // Import/Export
    this.addEventListener($('#export-form'), 'submit', e => {
      e.preventDefault();
      this.handleExportBookmarks();
    });

    this.addEventListener($('#import-form'), 'submit', e => {
      e.preventDefault();
      this.handleImportBookmarks();
    });

    this.addEventListener($('#clear-cache'), 'click', () => {
      this.handleClearCache();
    });

    // Edit status modal event listeners
    this.addEventListener($('#close-status-modal'), 'click', () => {
      this.closeEditStatusModal();
    });

    this.addEventListener($('#cancel-status-edit'), 'click', () => {
      this.closeEditStatusModal();
    });

    this.addEventListener($('#edit-status-form'), 'submit', e => {
      e.preventDefault();
      this.handleSaveStatusEdit();
    });

    // Close modal on backdrop click
    this.addEventListener($('#edit-status-modal'), 'click', e => {
      if (e.target === e.currentTarget) {
        this.closeEditStatusModal();
      }
    });
  }

  /**
   * Load initial data for all sections
   */
  async loadInitialData() {
    await Promise.all([
      this.loadDatabaseConfig(),
      this.loadStatusTypes(),
      this.loadPreferences(),
      this.loadStorageUsage()
    ]);
  }

  /**
   * Show specific section and update navigation
   * @param {string} sectionId - Section to show
   */
  showSection(sectionId) {
    // Update navigation
    $$('.nav-button').forEach(button => {
      if (button.id === `nav-${sectionId}`) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // Show/hide sections
    $$('.options-section').forEach(section => {
      if (section.id === `${sectionId}-section`) {
        show(section);
      } else {
        hide(section);
      }
    });

    this.currentSection = sectionId;

    // Load section-specific data
    this.loadSectionData(sectionId);
  }

  /**
   * Load section-specific data
   * @param {string} sectionId - Section ID
   */
  async loadSectionData(sectionId) {
    switch (sectionId) {
      case 'status-types':
        await this.loadStatusTypes();
        break;
      case 'preferences':
        await this.loadPreferences();
        break;
      case 'import-export':
        await this.loadStorageUsage();
        await this.loadExportOptions();
        break;
    }
  }

  /**
   * Load database configuration
   */
  async loadDatabaseConfig() {
    try {
      const config = await this.configService.getSupabaseConfig();
      const form = $('#database-form');

      if (config && form) {
        setFormData(form, {
          supabaseUrl: config.supabaseUrl || '',
          supabaseAnonKey: config.supabaseAnonKey || ''
        });
      }
    } catch (error) {
      this.handleError(error, 'OptionsController.loadDatabaseConfig');
    }
  }

  /**
   * Handle save database configuration
   */
  async handleSaveDatabaseConfig() {
    const form = $('#database-form');
    const formData = this.getFormData(form);

    if (!formData.supabaseUrl || !formData.supabaseAnonKey) {
      this.showError('Please enter both Supabase URL and anonymous key');
      return;
    }

    await this.safeExecute(
      async () => {
        await this.configService.setSupabaseConfig({
          supabaseUrl: formData.supabaseUrl,
          supabaseAnonKey: formData.supabaseAnonKey
        });

        this.showSuccess('Database configuration saved successfully');
        this.showConnectionStatus('Database connection successful', 'success');
      },
      'OptionsController.handleSaveDatabaseConfig',
      '#save-database',
      'Saving...'
    );
  }

  /**
   * Handle test connection
   */
  async handleTestConnection() {
    const form = $('#database-form');
    const formData = this.getFormData(form);

    if (!formData.supabaseUrl || !formData.supabaseAnonKey) {
      this.showError('Please enter both Supabase URL and anonymous key');
      return;
    }

    await this.safeExecute(
      async () => {
        const isValid = await this.configService.testSupabaseConnection({
          supabaseUrl: formData.supabaseUrl,
          supabaseAnonKey: formData.supabaseAnonKey
        });

        if (isValid) {
          this.showConnectionStatus(
            'Connection successful! You can save this configuration.',
            'success'
          );
        } else {
          this.showConnectionStatus('Connection failed. Please check your URL and key.', 'error');
        }
      },
      'OptionsController.handleTestConnection',
      '#test-connection',
      'Testing...'
    );
  }

  /**
   * Show connection status
   * @param {string} message - Status message
   * @param {string} type - Status type ('success' or 'error')
   */
  showConnectionStatus(message, type) {
    const statusElement = $('#connection-status');
    const resultElement = $('#connection-result');

    if (statusElement && resultElement) {
      resultElement.textContent = message;
      statusElement.className = `connection-status ${type}`;
      show(statusElement);

      // Auto-hide after 10 seconds
      setTimeout(() => {
        hide(statusElement);
      }, 10000);
    }
  }

  /**
   * Load status types
   */
  async loadStatusTypes() {
    try {
      this.statusTypes = await this.configService.getStatusTypes();
      this.renderStatusTypesList();
      this.updateStatusTypeSelects();
    } catch (error) {
      this.handleError(error, 'OptionsController.loadStatusTypes');
    }
  }

  /**
   * Render status types list
   */
  renderStatusTypesList() {
    const container = $('#status-types-list');
    if (!container) return;

    clearElement(container);

    this.statusTypes.forEach(statusType => {
      const item = this.createStatusTypeItem(statusType);
      container.appendChild(item);
    });
  }

  /**
   * Create status type item element
   * @param {Object} statusType - Status type data
   * @returns {Element} Status type item element
   */
  createStatusTypeItem(statusType) {
    const item = document.createElement('div');
    item.className = 'status-type-item';
    item.dataset.statusId = statusType.id;

    // Status info section
    const info = document.createElement('div');
    info.className = 'status-type-info';

    // Preview
    const preview = document.createElement('div');
    preview.className = 'status-type-preview';
    preview.style.backgroundColor = statusType.color;
    // Create status dot and name safely
    const statusDot = document.createElement('span');
    statusDot.className = 'status-dot';
    statusDot.style.backgroundColor = 'white';

    const statusName = document.createElement('span');
    statusName.textContent = statusType.name;

    preview.appendChild(statusDot);
    preview.appendChild(statusName);

    // Details
    const details = document.createElement('div');
    details.className = 'status-type-details';

    const name = document.createElement('h4');
    name.className = 'status-type-name';
    name.textContent = statusType.name;

    const id = document.createElement('p');
    id.className = 'status-type-id';
    id.textContent = `ID: ${statusType.id}${statusType.is_default ? ' (default)' : ''}`;

    details.appendChild(name);
    details.appendChild(id);

    info.appendChild(preview);
    info.appendChild(details);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'status-type-actions';

    if (!statusType.is_default) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'secondary edit-status';
      editBtn.textContent = 'Edit';
      editBtn.dataset.statusId = statusType.id;

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'secondary outline delete-status';
      deleteBtn.textContent = 'Delete';
      deleteBtn.dataset.statusId = statusType.id;

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
    } else {
      const defaultLabel = document.createElement('span');
      defaultLabel.className = 'default-label';
      defaultLabel.textContent = 'Default';
      actions.appendChild(defaultLabel);
    }

    item.appendChild(info);
    item.appendChild(actions);

    return item;
  }

  /**
   * Update status type select elements
   */
  updateStatusTypeSelects() {
    const selects = $$(
      'select[name="statusFilter"], #default-status, #bulk-status-update, #edit-status'
    );

    selects.forEach(select => {
      if (!select) return;

      // Store current value
      const currentValue = select.value;

      // Clear non-default options
      Array.from(select.options).forEach(option => {
        if (option.value !== '' && option.value !== 'all') {
          option.remove();
        }
      });

      // Add status type options
      this.statusTypes.forEach(statusType => {
        const option = document.createElement('option');
        option.value = statusType.id;
        option.textContent = statusType.name;
        select.appendChild(option);
      });

      // Restore value if still valid
      if (currentValue && this.statusTypes.some(s => s.id === currentValue)) {
        select.value = currentValue;
      }
    });
  }

  /**
   * Handle add status type
   */
  async handleAddStatusType() {
    const form = $('#add-status-form');
    const formData = this.getFormData(form);

    if (!formData.id || !formData.name || !formData.color || !formData.icon) {
      this.showError('Please fill in all fields');
      return;
    }

    await this.safeExecute(
      async () => {
        await this.configService.addStatusType({
          id: formData.id,
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
          is_default: false
        });

        this.showSuccess('Status type added successfully');
        this.resetForm(form);
        await this.loadStatusTypes();
      },
      'OptionsController.handleAddStatusType',
      '#add-status',
      'Adding...'
    );
  }

  /**
   * Handle edit status type
   * @param {string} statusId - Status ID to edit
   */
  async handleEditStatusType(statusId) {
    const statusType = this.statusTypes.find(s => s.id === statusId);
    if (!statusType) return;

    this.showEditStatusModal(statusType);
  }

  /**
   * Handle delete status type
   * @param {string} statusId - Status ID to delete
   */
  async handleDeleteStatusType(statusId) {
    const statusType = this.statusTypes.find(s => s.id === statusId);
    if (!statusType) return;

    try {
      const confirmed = confirm(
        `Are you sure you want to delete the "${statusType.name}" status type?`
      );
      if (!confirmed) return;
    } catch (error) {
      this.handleError(error, 'OptionsController.handleDeleteStatusType');
      return;
    }

    await this.safeExecute(async () => {
      await this.configService.removeStatusType(statusId);
      this.showSuccess('Status type deleted successfully');
      await this.loadStatusTypes();
    }, 'OptionsController.handleDeleteStatusType');
  }

  /**
   * Handle reset status types
   */
  async handleResetStatusTypes() {
    try {
      const confirmed = confirm(
        'Are you sure you want to reset all status types to defaults? This will remove any custom status types.'
      );
      if (!confirmed) return;
    } catch (error) {
      this.handleError(error, 'OptionsController.handleResetStatusTypes');
      return;
    }

    await this.safeExecute(async () => {
      await this.configService.resetStatusTypesToDefaults();
      this.showSuccess('Status types reset to defaults');
      await this.loadStatusTypes();
    }, 'OptionsController.handleResetStatusTypes');
  }

  /**
   * Load preferences
   */
  async loadPreferences() {
    try {
      const preferences = await this.configService.getUserPreferences();
      const form = $('#preferences-form');

      if (form && preferences) {
        setFormData(form, preferences);
      }
    } catch (error) {
      this.handleError(error, 'OptionsController.loadPreferences');
    }
  }

  /**
   * Handle save preferences
   */
  async handleSavePreferences() {
    const form = $('#preferences-form');
    const formData = this.getFormData(form);

    // Convert checkbox values
    formData.autoSync = $('#auto-sync').checked;
    formData.showNotifications = $('#show-notifications').checked;
    formData.compactView = $('#compact-view').checked;
    formData.itemsPerPage = parseInt(formData.itemsPerPage, 10);

    await this.safeExecute(
      async () => {
        await this.configService.updateUserPreferences(formData);
        this.showSuccess('Preferences saved successfully');
      },
      'OptionsController.handleSavePreferences',
      '#save-preferences',
      'Saving...'
    );
  }

  /**
   * Handle reset preferences
   */
  async handleResetPreferences() {
    try {
      const confirmed = confirm('Are you sure you want to reset all preferences to defaults?');
      if (!confirmed) return;
    } catch (error) {
      this.handleError(error, 'OptionsController.handleResetPreferences');
      return;
    }

    await this.safeExecute(async () => {
      await this.configService.resetUserPreferences();
      this.showSuccess('Preferences reset to defaults');
      await this.loadPreferences();
    }, 'OptionsController.handleResetPreferences');
  }

  /**
   * Load export options
   */
  async loadExportOptions() {
    try {
      const statusSelect = $('#export-status-filter');
      if (statusSelect && this.statusTypes.length > 0) {
        // Clear existing options
        clearElement(statusSelect);

        // Add status options
        this.statusTypes.forEach(statusType => {
          const option = document.createElement('option');
          option.value = statusType.id;
          option.textContent = statusType.name;
          statusSelect.appendChild(option);
        });
      }
    } catch (error) {
      this.handleError(error, 'OptionsController.loadExportOptions');
    }
  }

  /**
   * Handle export bookmarks
   */
  async handleExportBookmarks() {
    if (!this.authService.isAuthenticated()) {
      this.showError('Please sign in to export bookmarks');
      return;
    }

    const form = $('#export-form');
    const formData = this.getFormData(form);

    // Build export options
    const exportOptions = {};

    if (formData.statusFilter) {
      const selectedStatuses = Array.from($('#export-status-filter').selectedOptions).map(
        opt => opt.value
      );
      if (selectedStatuses.length > 0) {
        exportOptions.statuses = selectedStatuses;
      }
    }

    if (formData.dateFrom) {
      exportOptions.dateFrom = new Date(formData.dateFrom);
    }

    if (formData.dateTo) {
      exportOptions.dateTo = new Date(formData.dateTo);
    }

    await this.safeExecute(
      async () => {
        const jsonData = await this.bookmarkService.exportBookmarks(exportOptions);

        // Create download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `forgetfulme-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showSuccess('Bookmarks exported successfully');
      },
      'OptionsController.handleExportBookmarks',
      '#export-bookmarks',
      'Exporting...'
    );
  }

  /**
   * Handle import bookmarks
   */
  async handleImportBookmarks() {
    if (!this.authService.isAuthenticated()) {
      this.showError('Please sign in to import bookmarks');
      return;
    }

    const fileInput = $('#import-file');
    const file = fileInput.files[0];

    if (!file) {
      this.showError('Please select a file to import');
      return;
    }

    await this.safeExecute(
      async () => {
        // Read file content
        const content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        // Import bookmarks
        const results = await this.bookmarkService.importBookmarks(content);

        // Show results
        this.showImportResults(results);

        // Reset form
        this.resetForm($('#import-form'));
      },
      'OptionsController.handleImportBookmarks',
      '#import-bookmarks',
      'Importing...'
    );
  }

  /**
   * Show import results
   * @param {Object} results - Import results
   */
  showImportResults(results) {
    const resultsDiv = $('#import-results');
    if (!resultsDiv) return;

    // Clear previous results
    clearElement(resultsDiv);

    // Create header
    const header = document.createElement('h4');
    header.textContent = 'Import Results';
    resultsDiv.appendChild(header);

    // Create success paragraph
    const successPara = document.createElement('p');
    const successStrong = document.createElement('strong');
    successStrong.textContent = 'Successfully imported: ';
    successPara.appendChild(successStrong);
    successPara.appendChild(document.createTextNode(`${results.imported} bookmarks`));
    resultsDiv.appendChild(successPara);

    // Create failed paragraph
    const failedPara = document.createElement('p');
    const failedStrong = document.createElement('strong');
    failedStrong.textContent = 'Failed: ';
    failedPara.appendChild(failedStrong);
    failedPara.appendChild(document.createTextNode(`${results.failed} bookmarks`));
    resultsDiv.appendChild(failedPara);

    // Create error details if any
    if (results.errors.length > 0) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = `View Errors (${results.errors.length})`;
      details.appendChild(summary);

      const errorList = document.createElement('ul');
      results.errors.forEach(error => {
        const listItem = document.createElement('li');
        listItem.textContent = `${error.bookmark}: ${error.error}`;
        errorList.appendChild(listItem);
      });
      details.appendChild(errorList);
      resultsDiv.appendChild(details);
    }
    show(resultsDiv);

    this.showSuccess(
      `Import completed: ${results.imported} bookmarks imported, ${results.failed} failed`
    );
  }

  /**
   * Load storage usage information
   */
  async loadStorageUsage() {
    try {
      const usage = await this.storageService.getStorageUsage();
      const storageInfo = $('#storage-info');

      if (storageInfo && usage) {
        // Clear previous content
        clearElement(storageInfo);

        // Create sync storage bar
        const syncBar = this.createStorageBar('Sync Storage', usage.sync);
        storageInfo.appendChild(syncBar);

        // Create local storage bar
        const localBar = this.createStorageBar('Local Storage', usage.local);
        storageInfo.appendChild(localBar);
      }
    } catch (error) {
      this.handleError(error, 'OptionsController.loadStorageUsage');
    }
  }

  /**
   * Create a storage bar element
   * @param {string} label - Storage type label
   * @param {Object} usage - Usage data with percentUsed, used, quota
   * @returns {Element} Storage bar element
   */
  createStorageBar(label, usage) {
    const container = document.createElement('div');
    container.className = 'storage-bar';

    // Label
    const labelSpan = document.createElement('span');
    labelSpan.className = 'storage-bar-label';
    labelSpan.textContent = `${label}:`;
    container.appendChild(labelSpan);

    // Progress bar
    const progressDiv = document.createElement('div');
    progressDiv.className = 'storage-bar-progress';

    const fillDiv = document.createElement('div');
    fillDiv.className = 'storage-bar-fill';
    fillDiv.style.width = `${usage.percentUsed}%`;

    progressDiv.appendChild(fillDiv);
    container.appendChild(progressDiv);

    // Text
    const textSpan = document.createElement('span');
    textSpan.className = 'storage-bar-text';
    textSpan.textContent = `${this.formatBytes(usage.used)} / ${this.formatBytes(usage.quota)}`;
    container.appendChild(textSpan);

    return container;
  }

  /**
   * Handle clear cache
   */
  async handleClearCache() {
    try {
      const confirmed = confirm(
        'Are you sure you want to clear the cache? This will remove locally cached data.'
      );
      if (!confirmed) return;
    } catch (error) {
      this.handleError(error, 'OptionsController.handleClearCache');
      return;
    }

    await this.safeExecute(async () => {
      this.storageService.clearCache();
      await this.storageService.clearBookmarkCache();

      this.showSuccess('Cache cleared successfully');
      await this.loadStorageUsage();
    }, 'OptionsController.handleClearCache');
  }

  /**
   * Show edit status modal
   * @param {Object} statusType - Status type to edit
   */
  showEditStatusModal(statusType) {
    const modal = $('#edit-status-modal');
    const form = $('#edit-status-form');

    if (!modal || !form) return;

    // Populate form fields
    const nameInput = $('#status-name');
    const colorInput = $('#status-color');

    if (nameInput) nameInput.value = statusType.name;
    if (colorInput) colorInput.value = statusType.color;

    // Store the status ID for later use
    modal.dataset.statusId = statusType.id;

    // Show modal
    modal.showModal();
  }

  /**
   * Close edit status modal
   */
  closeEditStatusModal() {
    const modal = $('#edit-status-modal');
    if (modal) {
      modal.close();
      delete modal.dataset.statusId;
    }
  }

  /**
   * Handle save status edit
   */
  async handleSaveStatusEdit() {
    const modal = $('#edit-status-modal');
    const statusId = modal?.dataset.statusId;

    if (!statusId) return;

    const form = $('#edit-status-form');
    const formData = new FormData(form);

    const name = formData.get('name')?.trim();
    const color = formData.get('color');

    if (!name || !color) {
      this.showError('Please fill in all fields');
      return;
    }

    await this.safeExecute(async () => {
      await this.configService.updateStatusType(statusId, {
        name,
        color
      });

      this.showSuccess('Status type updated successfully');
      await this.loadStatusTypes();
      this.closeEditStatusModal();
    }, 'OptionsController.handleSaveStatusEdit');
  }

  /**
   * Format bytes for display
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
