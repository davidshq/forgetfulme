/**
 * @fileoverview Unit tests for PopupController
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { PopupController } from '../../../src/controllers/PopupController.js';

// Mock services
const createMockAuthService = () => ({
  initialize: vi.fn().mockResolvedValue(true),
  isAuthenticated: vi.fn().mockReturnValue(true),
  getCurrentUser: vi.fn().mockReturnValue({ email: 'test@example.com' }),
  signIn: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
  signUp: vi.fn().mockResolvedValue({ requiresConfirmation: false, email: 'test@example.com' }),
  signOut: vi.fn().mockResolvedValue(),
  resetPassword: vi.fn().mockResolvedValue(),
  addAuthChangeListener: vi.fn().mockReturnValue(() => {})
});

const createMockBookmarkService = () => ({
  findBookmarkByUrl: vi.fn().mockResolvedValue(null),
  createBookmark: vi.fn().mockResolvedValue({ id: '1', url: 'https://example.com' }),
  updateBookmark: vi.fn().mockResolvedValue({ id: '1', url: 'https://example.com' }),
  deleteBookmark: vi.fn().mockResolvedValue(),
  getRecentBookmarks: vi.fn().mockResolvedValue([])
});

const createMockConfigService = () => ({
  isSupabaseConfigured: vi.fn().mockResolvedValue(true),
  getStatusTypes: vi.fn().mockResolvedValue([
    { id: 'read', name: 'Read', color: '#4ade80', icon: '✓', is_default: true },
    { id: 'reference', name: 'Good Reference', color: '#3b82f6', icon: '⭐', is_default: false }
  ]),
  getDefaultStatusType: vi.fn().mockResolvedValue({ id: 'read' })
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
      <head><title>Test</title></head>
      <body>
        <div id="message-area"></div>
        
        <!-- Loading section -->
        <div id="loading-section" style="display: none;">Loading...</div>
        
        <!-- Auth section -->
        <div id="auth-section" style="display: none;">
          <div id="config-required" style="display: none;">Config required</div>
          <div id="auth-tabs">
            <button id="signin-tab" class="active">Sign In</button>
            <button id="signup-tab">Sign Up</button>
          </div>
          <form id="signin-form">
            <input name="email" type="email" />
            <input name="password" type="password" />
            <button id="signin-submit" type="submit">Sign In</button>
          </form>
          <form id="signup-form" style="display: none;">
            <input name="email" type="email" />
            <input name="password" type="password" />
            <input name="confirm" type="password" />
            <button id="signup-submit" type="submit">Sign Up</button>
          </form>
          <a id="forgot-password" href="#">Forgot Password?</a>
        </div>
        
        <!-- Main section -->
        <div id="main-section" style="display: none;">
          <div id="user-info">
            <span id="user-email"></span>
            <button id="signout-btn">Sign Out</button>
            <button id="open-options">Options</button>
          </div>
          
          <div id="current-page">
            <h2 id="page-title"></h2>
            <p id="page-url"></p>
            <div id="bookmark-status"></div>
          </div>
          
          <form id="bookmark-form">
            <select id="bookmark-status-select" name="status">
              <option value="">Select status...</option>
            </select>
            <input name="tags" type="text" />
            <textarea name="notes"></textarea>
            <button id="save-bookmark" type="submit">Save Bookmark</button>
          </form>
          
          <button id="delete-bookmark" style="display: none;">Delete</button>
          
          <div id="recent-bookmarks">
            <ul id="recent-list"></ul>
            <button id="view-all">View All</button>
          </div>
        </div>
      </body>
    </html>
  `);

  global.window = dom.window;
  global.document = dom.window.document;
  global.chrome = {
    tabs: {
      query: vi.fn().mockResolvedValue([{ 
        title: 'Test Page', 
        url: 'https://example.com',
        active: true 
      }])
    },
    runtime: {
      openOptionsPage: vi.fn(),
      getURL: vi.fn().mockReturnValue('bookmark-manager.html')
    }
  };

  return dom;
};

describe('PopupController', () => {
  let controller;
  let mockAuthService;
  let mockBookmarkService;
  let mockConfigService;
  let mockErrorService;
  let dom;

  beforeEach(() => {
    dom = setupDOM();
    mockAuthService = createMockAuthService();
    mockBookmarkService = createMockBookmarkService();
    mockConfigService = createMockConfigService();
    mockErrorService = createMockErrorService();

    controller = new PopupController(
      mockAuthService,
      mockBookmarkService,
      mockConfigService,
      mockErrorService
    );
  });

  afterEach(() => {
    controller?.destroy();
    dom?.window.close();
  });

  describe('constructor', () => {
    it('should initialize with required services', () => {
      expect(controller.authService).toBe(mockAuthService);
      expect(controller.bookmarkService).toBe(mockBookmarkService);
      expect(controller.configService).toBe(mockConfigService);
      expect(controller.errorService).toBe(mockErrorService);
    });

    it('should initialize properties', () => {
      expect(controller.currentTab).toBeNull();
      expect(controller.currentBookmark).toBeNull();
      expect(controller.statusTypes).toEqual([]);
    });
  });

  describe('initialize', () => {
    it('should show main section when authenticated and configured', async () => {
      mockConfigService.isSupabaseConfigured.mockResolvedValue(true);
      mockAuthService.initialize.mockResolvedValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(true);

      await controller.initialize();

      const mainSection = document.getElementById('main-section');
      expect(mainSection.style.display).not.toBe('none');
      expect(mockConfigService.isSupabaseConfigured).toHaveBeenCalled();
      expect(mockAuthService.initialize).toHaveBeenCalled();
    });

    it('should show config required when not configured', async () => {
      mockConfigService.isSupabaseConfigured.mockResolvedValue(false);

      await controller.initialize();

      const configRequired = document.getElementById('config-required');
      expect(configRequired.style.display).not.toBe('none');
      expect(mockAuthService.initialize).not.toHaveBeenCalled();
    });

    it('should show auth section when not authenticated', async () => {
      mockConfigService.isSupabaseConfigured.mockResolvedValue(true);
      mockAuthService.initialize.mockResolvedValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(false);

      await controller.initialize();

      const authSection = document.getElementById('auth-section');
      expect(authSection.style.display).not.toBe('none');
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockConfigService.isSupabaseConfigured.mockRejectedValue(error);

      await controller.initialize();

      expect(mockErrorService.handle).toHaveBeenCalledWith(error, 'PopupController.initialize');
    });
  });

  describe('showSection', () => {
    it('should show specified section and hide others', () => {
      controller.showSection('main-section');

      const mainSection = document.getElementById('main-section');
      const authSection = document.getElementById('auth-section');
      const loadingSection = document.getElementById('loading-section');

      expect(mainSection.style.display).not.toBe('none');
      expect(authSection.style.display).toBe('none');
      expect(loadingSection.style.display).toBe('none');
    });
  });

  describe('getCurrentTabInfo', () => {
    it('should get current tab information', async () => {
      await controller.getCurrentTabInfo();

      expect(global.chrome.tabs.query).toHaveBeenCalledWith({ 
        active: true, 
        currentWindow: true 
      });
      expect(controller.currentTab).toEqual({
        title: 'Test Page',
        url: 'https://example.com',
        active: true
      });
    });

    it('should handle chrome API errors gracefully', async () => {
      const error = new Error('Chrome API error');
      global.chrome.tabs.query.mockRejectedValue(error);

      await controller.getCurrentTabInfo();

      expect(mockErrorService.handle).toHaveBeenCalledWith(
        error, 
        'PopupController.getCurrentTabInfo'
      );
    });
  });

  describe('loadStatusTypes', () => {
    it('should load and populate status types', async () => {
      const statusTypes = [
        { id: 'read', name: 'Read', color: '#4ade80' },
        { id: 'reference', name: 'Reference', color: '#3b82f6' }
      ];
      mockConfigService.getStatusTypes.mockResolvedValue(statusTypes);

      await controller.loadStatusTypes();

      expect(controller.statusTypes).toEqual(statusTypes);
      
      const select = document.getElementById('bookmark-status-select');
      expect(select.children.length).toBe(3); // Original option + 2 status types
    });

    it('should handle non-array status types', async () => {
      mockConfigService.getStatusTypes.mockResolvedValue(null);

      await controller.loadStatusTypes();

      expect(controller.statusTypes).toEqual([]);
    });
  });

  describe('authentication handlers', () => {
    beforeEach(() => {
      // Set up form data
      const signinForm = document.getElementById('signin-form');
      signinForm.elements.email.value = 'test@example.com';
      signinForm.elements.password.value = 'password123';

      const signupForm = document.getElementById('signup-form');
      signupForm.elements.email.value = 'test@example.com';
      signupForm.elements.password.value = 'password123';
      signupForm.elements.confirm.value = 'password123';
    });

    describe('handleSignIn', () => {
      it('should sign in with valid credentials', async () => {
        await controller.handleSignIn();

        expect(mockAuthService.signIn).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });

      it('should show error for missing credentials', async () => {
        document.getElementById('signin-form').elements.email.value = '';

        await controller.handleSignIn();

        expect(mockAuthService.signIn).not.toHaveBeenCalled();
      });
    });

    describe('handleSignUp', () => {
      it('should sign up with valid data', async () => {
        await controller.handleSignUp();

        expect(mockAuthService.signUp).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });

      it('should show error for password mismatch', async () => {
        document.getElementById('signup-form').elements.confirm.value = 'different';

        await controller.handleSignUp();

        expect(mockAuthService.signUp).not.toHaveBeenCalled();
      });

      it('should show error for short password', async () => {
        document.getElementById('signup-form').elements.password.value = '123';
        document.getElementById('signup-form').elements.confirm.value = '123';

        await controller.handleSignUp();

        expect(mockAuthService.signUp).not.toHaveBeenCalled();
      });
    });

    describe('handleSignOut', () => {
      it('should sign out successfully', async () => {
        await controller.handleSignOut();

        expect(mockAuthService.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('bookmark operations', () => {
    beforeEach(() => {
      controller.currentTab = { url: 'https://example.com', title: 'Test Page' };
      
      const form = document.getElementById('bookmark-form');
      form.elements.status.value = 'read';
      form.elements.tags.value = 'tag1, tag2';
      form.elements.notes.value = 'Test notes';
    });

    describe('loadCurrentPageBookmark', () => {
      it('should load existing bookmark', async () => {
        const existingBookmark = {
          id: '1',
          url: 'https://example.com',
          status: 'read',
          tags: ['tag1'],
          notes: 'Test notes'
        };
        mockBookmarkService.findBookmarkByUrl.mockResolvedValue(existingBookmark);

        await controller.loadCurrentPageBookmark();

        expect(controller.currentBookmark).toEqual(existingBookmark);
        expect(mockBookmarkService.findBookmarkByUrl).toHaveBeenCalledWith(
          'https://example.com'
        );
      });

      it('should handle new bookmark', async () => {
        mockBookmarkService.findBookmarkByUrl.mockResolvedValue(null);

        await controller.loadCurrentPageBookmark();

        expect(controller.currentBookmark).toBeNull();
        const statusElement = document.getElementById('bookmark-status');
        expect(statusElement.textContent).toBe('Not bookmarked');
      });
    });

    describe('handleSaveBookmark', () => {
      it('should create new bookmark', async () => {
        controller.currentBookmark = null;
        controller.currentTab = { url: 'https://example.com', title: 'Test Page' };

        await controller.handleSaveBookmark();

        expect(mockBookmarkService.createBookmark).toHaveBeenCalledWith({
          url: 'https://example.com',
          title: 'Test Page',
          status: 'read',
          tags: ['tag1', 'tag2'],
          notes: 'Test notes'
        });
      });

      it('should update existing bookmark', async () => {
        controller.currentBookmark = { id: '1' };
        controller.currentTab = { url: 'https://example.com', title: 'Test Page' };

        await controller.handleSaveBookmark();

        expect(mockBookmarkService.updateBookmark).toHaveBeenCalledWith('1', {
          url: 'https://example.com',
          title: 'Test Page',
          status: 'read',
          tags: ['tag1', 'tag2'],
          notes: 'Test notes'
        });
      });

      it('should show error for missing status', async () => {
        document.getElementById('bookmark-form').elements.status.value = '';

        await controller.handleSaveBookmark();

        expect(mockBookmarkService.createBookmark).not.toHaveBeenCalled();
      });
    });

    describe('handleDeleteBookmark', () => {
      it('should delete bookmark after confirmation', async () => {
        controller.currentBookmark = { id: '1' };
        global.confirm = vi.fn().mockReturnValue(true);

        await controller.handleDeleteBookmark();

        expect(mockBookmarkService.deleteBookmark).toHaveBeenCalledWith('1');
      });

      it('should not delete without confirmation', async () => {
        controller.currentBookmark = { id: '1' };
        global.confirm = vi.fn().mockReturnValue(false);

        await controller.handleDeleteBookmark();

        expect(mockBookmarkService.deleteBookmark).not.toHaveBeenCalled();
      });
    });
  });

  describe('loadRecentBookmarks', () => {
    it('should load and display recent bookmarks', async () => {
      const recentBookmarks = [
        {
          id: '1',
          title: 'Recent Page',
          url: 'https://recent.example.com',
          status: 'read',
          created_at: new Date().toISOString()
        }
      ];
      mockBookmarkService.getRecentBookmarks.mockResolvedValue(recentBookmarks);

      await controller.loadRecentBookmarks();

      expect(mockBookmarkService.getRecentBookmarks).toHaveBeenCalledWith(5);
      
      const recentList = document.getElementById('recent-list');
      expect(recentList.children.length).toBe(1);
    });

    it('should show empty state when no bookmarks', async () => {
      mockBookmarkService.getRecentBookmarks.mockResolvedValue([]);

      await controller.loadRecentBookmarks();

      const recentList = document.getElementById('recent-list');
      expect(recentList.innerHTML).toContain('No bookmarks yet');
    });
  });

  describe('formatUrl', () => {
    it('should format URL correctly', () => {
      const result = controller.formatUrl('https://www.example.com/path/to/page');
      expect(result).toBe('example.com/path/to/page');
    });

    it('should truncate long URLs', () => {
      const longUrl = 'https://example.com/very/long/path/that/should/be/truncated';
      const result = controller.formatUrl(longUrl);
      expect(result.length).toBeLessThanOrEqual(40);
      expect(result).toContain('...');
    });

    it('should handle invalid URLs', () => {
      const result = controller.formatUrl('not-a-url');
      expect(result).toBe('not-a-url');
    });
  });

  describe('openOptionsPage', () => {
    it('should open options page via Chrome API', () => {
      controller.openOptionsPage();
      expect(global.chrome.runtime.openOptionsPage).toHaveBeenCalled();
    });
  });

  describe('openBookmarkManager', () => {
    it('should open bookmark manager in new tab', () => {
      global.chrome.tabs = { create: vi.fn() };
      
      controller.openBookmarkManager();
      
      expect(global.chrome.tabs.create).toHaveBeenCalledWith({
        url: 'bookmark-manager.html'
      });
    });
  });

  describe('tab switching', () => {
    it('should switch to signup tab', () => {
      controller.setActiveAuthTab('signup');

      const signinTab = document.getElementById('signin-tab');
      const signupTab = document.getElementById('signup-tab');
      const signinForm = document.getElementById('signin-form');
      const signupForm = document.getElementById('signup-form');

      expect(signinTab.classList.contains('active')).toBe(false);
      expect(signupTab.classList.contains('active')).toBe(true);
      expect(signinForm.style.display).toBe('none');
      expect(signupForm.style.display).not.toBe('none');
    });

    it('should switch to signin tab', () => {
      controller.setActiveAuthTab('signin');

      const signinTab = document.getElementById('signin-tab');
      const signupTab = document.getElementById('signup-tab');
      const signinForm = document.getElementById('signin-form');
      const signupForm = document.getElementById('signup-form');

      expect(signinTab.classList.contains('active')).toBe(true);
      expect(signupTab.classList.contains('active')).toBe(false);
      expect(signinForm.style.display).not.toBe('none');
      expect(signupForm.style.display).toBe('none');
    });
  });

  describe('auth state changes', () => {
    it('should show main section when user signs in', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockReturnValue({ email: 'test@example.com' });

      await controller.handleAuthStateChange({ email: 'test@example.com' });

      const mainSection = document.getElementById('main-section');
      expect(mainSection.style.display).not.toBe('none');
    });

    it('should show auth section when user signs out', async () => {
      await controller.handleAuthStateChange(null);

      const authSection = document.getElementById('auth-section');
      expect(authSection.style.display).not.toBe('none');
    });
  });
});