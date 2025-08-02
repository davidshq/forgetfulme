/**
 * @fileoverview Unit tests for OptionsController
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { OptionsController } from '../../../src/controllers/OptionsController.js';

// Mock services
const createMockConfigService = () => ({
  getSupabaseConfig: vi.fn().mockResolvedValue({
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key'
  }),
  setSupabaseConfig: vi.fn().mockResolvedValue(),
  testSupabaseConnection: vi.fn().mockResolvedValue(true),
  getStatusTypes: vi.fn().mockResolvedValue([
    { id: 'read', name: 'Read', color: '#4ade80', icon: '✓', is_default: true },
    { id: 'reference', name: 'Reference', color: '#3b82f6', icon: '⭐', is_default: false }
  ]),
  addStatusType: vi.fn().mockResolvedValue(),
  updateStatusType: vi.fn().mockResolvedValue(),
  removeStatusType: vi.fn().mockResolvedValue(),
  resetStatusTypesToDefaults: vi.fn().mockResolvedValue(),
  getUserPreferences: vi.fn().mockResolvedValue({
    autoSync: true,
    showNotifications: true,
    compactView: false,
    itemsPerPage: 25,
    sortBy: 'created_at',
    sortOrder: 'desc'
  }),
  updateUserPreferences: vi.fn().mockResolvedValue(),
  resetUserPreferences: vi.fn().mockResolvedValue()
});

const createMockAuthService = () => ({
  isAuthenticated: vi.fn().mockReturnValue(true)
});

const createMockBookmarkService = () => ({
  exportBookmarks: vi.fn().mockResolvedValue(JSON.stringify({ bookmarks: [] })),
  importBookmarks: vi.fn().mockResolvedValue({
    imported: 5,
    failed: 1,
    errors: [{ bookmark: 'test.com', error: 'Invalid URL' }]
  })
});

const createMockStorageService = () => ({
  getStorageUsage: vi.fn().mockResolvedValue({
    sync: { used: 1024, quota: 102400, percentUsed: 1 },
    local: { used: 2048, quota: 5242880, percentUsed: 0.04 }
  }),
  clearCache: vi.fn().mockResolvedValue(),
  clearBookmarkCache: vi.fn().mockResolvedValue()
});

const createMockValidationService = () => ({
  validateEmail: vi.fn().mockReturnValue(true),
  validateUrl: vi.fn().mockReturnValue(true)
});

const createMockErrorService = () => ({
  handle: vi.fn().mockReturnValue({
    code: 'GENERIC_ERROR',
    message: 'An error occurred',
    severity: 'error'
  })
});

// Mock DOM setup
const setupDOM = () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Options</title></head>
      <body>
        <div id="message-area"></div>
        
        <!-- Navigation -->
        <nav>
          <button id="nav-database" class="nav-button active">Database</button>
          <button id="nav-status-types" class="nav-button">Status Types</button>
          <button id="nav-preferences" class="nav-button">Preferences</button>
          <button id="nav-import-export" class="nav-button">Import/Export</button>
        </nav>
        
        <!-- Database Section -->
        <section id="database-section" class="options-section">
          <form id="database-form">
            <input name="supabaseUrl" type="url" />
            <input name="supabaseAnonKey" type="text" />
            <button id="test-connection" type="button">Test Connection</button>
            <button id="save-database" type="submit">Save Configuration</button>
          </form>
          <div id="connection-status" class="connection-status" style="display: none;">
            <span id="connection-result"></span>
          </div>
        </section>
        
        <!-- Status Types Section -->
        <section id="status-types-section" class="options-section" style="display: none;">
          <form id="add-status-form">
            <input name="id" type="text" />
            <input name="name" type="text" />
            <input name="color" type="color" />
            <input name="icon" type="text" />
            <button id="add-status" type="submit">Add Status Type</button>
          </form>
          <div id="status-types-list"></div>
          <button id="reset-status-types" type="button">Reset to Defaults</button>
        </section>
        
        <!-- Preferences Section -->
        <section id="preferences-section" class="options-section" style="display: none;">
          <form id="preferences-form">
            <input id="auto-sync" name="autoSync" type="checkbox" />
            <input id="show-notifications" name="showNotifications" type="checkbox" />
            <input id="compact-view" name="compactView" type="checkbox" />
            <select name="itemsPerPage">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <select name="sortBy">
              <option value="created_at">Created Date</option>
              <option value="title">Title</option>
            </select>
            <select name="sortOrder">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button id="save-preferences" type="submit">Save Preferences</button>
          </form>
          <button id="reset-preferences" type="button">Reset Preferences</button>
        </section>
        
        <!-- Import/Export Section -->
        <section id="import-export-section" class="options-section" style="display: none;">
          <form id="export-form">
            <select id="export-status-filter" name="statusFilter" multiple>
            </select>
            <input name="dateFrom" type="date" />
            <input name="dateTo" type="date" />
            <button id="export-bookmarks" type="submit">Export Bookmarks</button>
          </form>
          
          <form id="import-form">
            <input id="import-file" name="file" type="file" accept=".json" />
            <button id="import-bookmarks" type="submit">Import Bookmarks</button>
          </form>
          
          <div id="import-results" style="display: none;"></div>
          
          <div id="storage-info"></div>
          <button id="clear-cache" type="button">Clear Cache</button>
        </section>
        
        <!-- Edit Status Type Modal -->
        <dialog id="edit-status-modal" class="edit-status-modal">
          <form id="edit-status-form">
            <input type="text" id="status-name" name="name" required />
            <input type="color" id="status-color" name="color" required />
            <button type="button" id="cancel-status-edit">Cancel</button>
            <button type="submit" id="save-status-edit">Save Changes</button>
          </form>
        </dialog>
      </body>
    </html>
  `);

  global.window = dom.window;
  global.document = dom.window.document;
  global.URL = dom.window.URL;
  global.Blob = dom.window.Blob;
  global.FileReader = dom.window.FileReader;
  global.confirm = vi.fn().mockReturnValue(true);
  global.prompt = vi.fn();

  return dom;
};

describe('OptionsController', () => {
  let controller;
  let mockConfigService;
  let mockAuthService;
  let mockBookmarkService;
  let mockStorageService;
  let mockValidationService;
  let mockErrorService;
  let dom;

  beforeEach(() => {
    dom = setupDOM();
    mockConfigService = createMockConfigService();
    mockAuthService = createMockAuthService();
    mockBookmarkService = createMockBookmarkService();
    mockStorageService = createMockStorageService();
    mockValidationService = createMockValidationService();
    mockErrorService = createMockErrorService();

    controller = new OptionsController(
      mockConfigService,
      mockAuthService,
      mockBookmarkService,
      mockStorageService,
      mockValidationService,
      mockErrorService
    );
  });

  afterEach(() => {
    controller?.destroy();
    dom?.window.close();
  });

  describe('constructor', () => {
    it('should initialize with required services', () => {
      expect(controller.configService).toBe(mockConfigService);
      expect(controller.authService).toBe(mockAuthService);
      expect(controller.bookmarkService).toBe(mockBookmarkService);
      expect(controller.storageService).toBe(mockStorageService);
      expect(controller.validationService).toBe(mockValidationService);
      expect(controller.errorService).toBe(mockErrorService);
    });

    it('should initialize properties', () => {
      expect(controller.currentSection).toBe('database');
      expect(controller.statusTypes).toEqual([]);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await controller.initialize();

      expect(mockConfigService.getSupabaseConfig).toHaveBeenCalled();
      expect(mockConfigService.getStatusTypes).toHaveBeenCalled();
      expect(mockConfigService.getUserPreferences).toHaveBeenCalled();
      expect(mockStorageService.getStorageUsage).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockConfigService.getSupabaseConfig.mockRejectedValue(error);

      await controller.initialize();

      expect(mockErrorService.handle).toHaveBeenCalledWith(error, 'OptionsController.loadDatabaseConfig');
    });
  });

  describe('showSection', () => {
    it('should show specified section and update navigation', () => {
      controller.showSection('status-types');

      const statusTypesSection = document.getElementById('status-types-section');
      const databaseSection = document.getElementById('database-section');
      const navStatusTypes = document.getElementById('nav-status-types');
      const navDatabase = document.getElementById('nav-database');

      // The hide() function uses 'hidden' class, not style.display
      expect(statusTypesSection.classList.contains('hidden')).toBe(false);
      expect(databaseSection.classList.contains('hidden')).toBe(true);
      expect(navStatusTypes.classList.contains('active')).toBe(true);
      expect(navDatabase.classList.contains('active')).toBe(false);
      expect(controller.currentSection).toBe('status-types');
    });
  });

  describe('database configuration', () => {
    beforeEach(() => {
      const form = document.getElementById('database-form');
      form.elements.supabaseUrl.value = 'https://test.supabase.co';
      form.elements.supabaseAnonKey.value = 'test-anon-key';
    });

    describe('loadDatabaseConfig', () => {
      it('should load and populate configuration', async () => {
        await controller.loadDatabaseConfig();

        const form = document.getElementById('database-form');
        expect(form.elements.supabaseUrl.value).toBe('https://test.supabase.co');
        expect(form.elements.supabaseAnonKey.value).toBe('test-anon-key');
      });
    });

    describe('handleSaveDatabaseConfig', () => {
      it('should save valid configuration', async () => {
        await controller.handleSaveDatabaseConfig();

        expect(mockConfigService.setSupabaseConfig).toHaveBeenCalledWith({
          supabaseUrl: 'https://test.supabase.co',
          supabaseAnonKey: 'test-anon-key'
        });
      });

      it('should show error for missing fields', async () => {
        document.getElementById('database-form').elements.supabaseUrl.value = '';

        await controller.handleSaveDatabaseConfig();

        expect(mockConfigService.setSupabaseConfig).not.toHaveBeenCalled();
      });
    });

    describe('handleTestConnection', () => {
      it('should test connection successfully', async () => {
        mockConfigService.testSupabaseConnection.mockResolvedValue(true);

        await controller.handleTestConnection();

        expect(mockConfigService.testSupabaseConnection).toHaveBeenCalledWith({
          supabaseUrl: 'https://test.supabase.co',
          supabaseAnonKey: 'test-anon-key'
        });

        const connectionStatus = document.getElementById('connection-status');
        expect(connectionStatus.style.display).not.toBe('none');
      });

      it('should handle connection failure', async () => {
        mockConfigService.testSupabaseConnection.mockResolvedValue(false);

        await controller.handleTestConnection();

        const connectionStatus = document.getElementById('connection-status');
        expect(connectionStatus.classList.contains('error')).toBe(true);
      });
    });
  });

  describe('status types management', () => {
    beforeEach(() => {
      const form = document.getElementById('add-status-form');
      form.elements.id.value = 'custom';
      form.elements.name.value = 'Custom Status';
      form.elements.color.value = '#ff0000';
      form.elements.icon.value = '🔥';
    });

    describe('loadStatusTypes', () => {
      it('should load and render status types', async () => {
        await controller.loadStatusTypes();

        expect(controller.statusTypes).toHaveLength(2);
        expect(mockConfigService.getStatusTypes).toHaveBeenCalled();
      });
    });

    describe('handleAddStatusType', () => {
      it('should add new status type', async () => {
        await controller.handleAddStatusType();

        expect(mockConfigService.addStatusType).toHaveBeenCalledWith({
          id: 'custom',
          name: 'Custom Status',
          color: '#ff0000',
          icon: '🔥',
          is_default: false
        });
      });

      it('should show error for missing fields', async () => {
        document.getElementById('add-status-form').elements.name.value = '';

        await controller.handleAddStatusType();

        expect(mockConfigService.addStatusType).not.toHaveBeenCalled();
      });
    });

    describe('handleEditStatusType', () => {
      it('should show edit modal for existing status type', async () => {
        controller.statusTypes = [
          { id: 'test', name: 'Test', color: '#000000' }
        ];
        
        // Mock showModal method
        const modal = document.getElementById('edit-status-modal');
        modal.showModal = vi.fn();

        await controller.handleEditStatusType('test');

        // Verify modal is configured and shown
        expect(modal.showModal).toHaveBeenCalled();
        expect(modal.dataset.statusId).toBe('test');
        
        // Verify form is populated
        const nameInput = document.getElementById('status-name');
        const colorInput = document.getElementById('status-color');
        expect(nameInput.value).toBe('Test');
        expect(colorInput.value).toBe('#000000');
      });

      it('should not show modal for non-existent status type', async () => {
        controller.statusTypes = [
          { id: 'test', name: 'Test', color: '#000000' }
        ];
        
        const modal = document.getElementById('edit-status-modal');
        modal.showModal = vi.fn();

        await controller.handleEditStatusType('nonexistent');

        expect(modal.showModal).not.toHaveBeenCalled();
      });
    });

    describe('handleSaveStatusEdit', () => {
      it('should save status type changes', async () => {
        // Set up modal with status ID
        const modal = document.getElementById('edit-status-modal');
        modal.dataset.statusId = 'test';
        
        // Set up form data
        const nameInput = document.getElementById('status-name');
        const colorInput = document.getElementById('status-color');
        nameInput.value = 'New Name';
        colorInput.value = '#ffffff';

        await controller.handleSaveStatusEdit();

        expect(mockConfigService.updateStatusType).toHaveBeenCalledWith('test', {
          name: 'New Name',
          color: '#ffffff'
        });
      });

      it('should not save when required fields are missing', async () => {
        const modal = document.getElementById('edit-status-modal');
        modal.dataset.statusId = 'test';
        
        // Leave name empty
        const nameInput = document.getElementById('status-name');
        const colorInput = document.getElementById('status-color');
        nameInput.value = '';
        colorInput.value = '#ffffff';

        await controller.handleSaveStatusEdit();

        expect(mockConfigService.updateStatusType).not.toHaveBeenCalled();
      });

      it('should not save when no status ID is set', async () => {
        const modal = document.getElementById('edit-status-modal');
        delete modal.dataset.statusId;
        
        const nameInput = document.getElementById('status-name');
        const colorInput = document.getElementById('status-color');
        nameInput.value = 'Test Name';
        colorInput.value = '#ffffff';

        await controller.handleSaveStatusEdit();

        expect(mockConfigService.updateStatusType).not.toHaveBeenCalled();
      });
    });

    describe('handleDeleteStatusType', () => {
      it('should delete status type after confirmation', async () => {
        controller.statusTypes = [{ id: 'test', name: 'Test' }];
        global.confirm.mockReturnValue(true);

        await controller.handleDeleteStatusType('test');

        expect(mockConfigService.removeStatusType).toHaveBeenCalledWith('test');
      });

      it('should not delete without confirmation', async () => {
        controller.statusTypes = [{ id: 'test', name: 'Test' }];
        global.confirm.mockReturnValue(false);

        await controller.handleDeleteStatusType('test');

        expect(mockConfigService.removeStatusType).not.toHaveBeenCalled();
      });
    });

    describe('handleResetStatusTypes', () => {
      it('should reset status types after confirmation', async () => {
        global.confirm.mockReturnValue(true);

        await controller.handleResetStatusTypes();

        expect(mockConfigService.resetStatusTypesToDefaults).toHaveBeenCalled();
      });
    });
  });

  describe('preferences management', () => {
    describe('loadPreferences', () => {
      it('should load and populate preferences', async () => {
        await controller.loadPreferences();

        const form = document.getElementById('preferences-form');
        expect(document.getElementById('auto-sync').checked).toBe(true);
        expect(document.getElementById('show-notifications').checked).toBe(true);
        expect(document.getElementById('compact-view').checked).toBe(false);
      });
    });

    describe('handleSavePreferences', () => {
      it('should save preferences with correct types', async () => {
        const form = document.getElementById('preferences-form');
        document.getElementById('auto-sync').checked = true;
        form.elements.itemsPerPage.value = '50';

        await controller.handleSavePreferences();

        expect(mockConfigService.updateUserPreferences).toHaveBeenCalledWith(
          expect.objectContaining({
            autoSync: true,
            itemsPerPage: 50
          })
        );
      });
    });

    describe('handleResetPreferences', () => {
      it('should reset preferences after confirmation', async () => {
        global.confirm.mockReturnValue(true);

        await controller.handleResetPreferences();

        expect(mockConfigService.resetUserPreferences).toHaveBeenCalled();
      });
    });
  });

  describe('import/export functionality', () => {
    describe('handleExportBookmarks', () => {
      it('should export bookmarks when authenticated', async () => {
        mockAuthService.isAuthenticated.mockReturnValue(true);

        // Mock DOM elements for export
        const exportForm = document.getElementById('export-form');
        exportForm.elements.dateFrom.value = '2023-01-01';
        exportForm.elements.dateTo.value = '2023-12-31';

        await controller.handleExportBookmarks();

        expect(mockBookmarkService.exportBookmarks).toHaveBeenCalledWith({
          dateFrom: new Date('2023-01-01'),
          dateTo: new Date('2023-12-31')
        });
      });

      it('should show error when not authenticated', async () => {
        mockAuthService.isAuthenticated.mockReturnValue(false);

        await controller.handleExportBookmarks();

        expect(mockBookmarkService.exportBookmarks).not.toHaveBeenCalled();
      });
    });

    describe('handleImportBookmarks', () => {
      it('should import bookmarks when authenticated', async () => {
        mockAuthService.isAuthenticated.mockReturnValue(true);

        // Mock file input
        const fileInput = document.getElementById('import-file');
        const mockFile = new File(['{"bookmarks": []}'], 'test.json', { type: 'application/json' });
        Object.defineProperty(fileInput, 'files', {
          value: [mockFile],
          writable: false
        });

        // Mock FileReader
        const mockFileReader = {
          onload: null,
          onerror: null,
          readAsText: vi.fn().mockImplementation(function() {
            this.onload({ target: { result: '{"bookmarks": []}' } });
          })
        };
        global.FileReader = vi.fn(() => mockFileReader);

        await controller.handleImportBookmarks();

        expect(mockBookmarkService.importBookmarks).toHaveBeenCalledWith('{"bookmarks": []}');
      });

      it('should show error when no file selected', async () => {
        mockAuthService.isAuthenticated.mockReturnValue(true);

        const fileInput = document.getElementById('import-file');
        Object.defineProperty(fileInput, 'files', {
          value: [],
          writable: false
        });

        await controller.handleImportBookmarks();

        expect(mockBookmarkService.importBookmarks).not.toHaveBeenCalled();
      });
    });

    describe('showImportResults', () => {
      it('should display import results', () => {
        const results = {
          imported: 5,
          failed: 1,
          errors: [{ bookmark: 'test.com', error: 'Invalid URL' }]
        };

        controller.showImportResults(results);

        const resultsDiv = document.getElementById('import-results');
        expect(resultsDiv.style.display).not.toBe('none');
        expect(resultsDiv.innerHTML).toContain('Successfully imported');
        expect(resultsDiv.innerHTML).toContain('Failed:');
      });
    });
  });

  describe('storage management', () => {
    describe('loadStorageUsage', () => {
      it('should load and display storage usage', async () => {
        await controller.loadStorageUsage();

        const storageInfo = document.getElementById('storage-info');
        expect(storageInfo.innerHTML).toContain('Sync Storage');
        expect(storageInfo.innerHTML).toContain('Local Storage');
      });
    });

    describe('handleClearCache', () => {
      it('should clear cache after confirmation', async () => {
        global.confirm.mockReturnValue(true);

        await controller.handleClearCache();

        expect(mockStorageService.clearCache).toHaveBeenCalled();
        expect(mockStorageService.clearBookmarkCache).toHaveBeenCalled();
      });

      it('should not clear cache without confirmation', async () => {
        global.confirm.mockReturnValue(false);

        await controller.handleClearCache();

        expect(mockStorageService.clearCache).not.toHaveBeenCalled();
      });
    });
  });

  describe('utility methods', () => {
    describe('formatBytes', () => {
      it('should format bytes correctly', () => {
        expect(controller.formatBytes(0)).toBe('0 B');
        expect(controller.formatBytes(1024)).toBe('1 KB');
        expect(controller.formatBytes(1048576)).toBe('1 MB');
        expect(controller.formatBytes(1073741824)).toBe('1 GB');
      });

      it('should handle decimal values', () => {
        expect(controller.formatBytes(1536)).toBe('1.5 KB');
        expect(controller.formatBytes(2097152)).toBe('2 MB');
      });
    });

    describe('updateStatusTypeSelects', () => {
      it('should update all status select elements', () => {
        controller.statusTypes = [
          { id: 'read', name: 'Read' },
          { id: 'reference', name: 'Reference' }
        ];

        controller.updateStatusTypeSelects();

        const exportSelect = document.getElementById('export-status-filter');
        expect(exportSelect.children.length).toBe(2);
      });
    });

    describe('createStatusTypeItem', () => {
      it('should create status type item with edit/delete buttons', () => {
        const statusType = {
          id: 'test',
          name: 'Test Status',
          color: '#ff0000',
          is_default: false
        };

        const item = controller.createStatusTypeItem(statusType);

        expect(item.classList.contains('status-type-item')).toBe(true);
        expect(item.dataset.statusId).toBe('test');
        expect(item.querySelector('.edit-status')).toBeTruthy();
        expect(item.querySelector('.delete-status')).toBeTruthy();
      });

      it('should create default status type item without edit/delete buttons', () => {
        const statusType = {
          id: 'read',
          name: 'Read',
          color: '#4ade80',
          is_default: true
        };

        const item = controller.createStatusTypeItem(statusType);

        expect(item.querySelector('.edit-status')).toBeNull();
        expect(item.querySelector('.delete-status')).toBeNull();
        expect(item.querySelector('.default-label')).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('should handle database configuration errors', async () => {
      const error = new Error('Configuration error');
      mockConfigService.setSupabaseConfig.mockRejectedValue(error);

      const form = document.getElementById('database-form');
      form.elements.supabaseUrl.value = 'https://test.supabase.co';
      form.elements.supabaseAnonKey.value = 'test-key';

      await controller.handleSaveDatabaseConfig();

      expect(mockErrorService.handle).toHaveBeenCalledWith(
        error,
        'OptionsController.handleSaveDatabaseConfig'
      );
    });

    it('should handle status type operation errors', async () => {
      const error = new Error('Status type error');
      mockConfigService.addStatusType.mockRejectedValue(error);

      const form = document.getElementById('add-status-form');
      form.elements.id.value = 'test';
      form.elements.name.value = 'Test';
      form.elements.color.value = '#000000';
      form.elements.icon.value = '✓';

      await controller.handleAddStatusType();

      expect(mockErrorService.handle).toHaveBeenCalledWith(
        error,
        'OptionsController.handleAddStatusType'
      );
    });
  });
});