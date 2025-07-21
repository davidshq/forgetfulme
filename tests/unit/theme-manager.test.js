/**
 * @fileoverview Theme Manager Tests for ForgetfulMe Extension
 * @module theme-manager.test
 * @description Unit tests for the ThemeManager class
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ThemeManager from '../../utils/theme-manager.js';

// Mock chrome.storage.sync
const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
};

global.chrome = {
  storage: {
    sync: mockStorage,
  },
};

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('ThemeManager', () => {
  let themeManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock matchMedia to return a MediaQueryList-like object
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQueryList);
    
    // Mock document.documentElement
    Object.defineProperty(document, 'documentElement', {
      value: {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      },
      writable: true,
    });

    themeManager = new ThemeManager();
  });

  afterEach(() => {
    // Clean up
    if (themeManager) {
      themeManager.listeners.clear();
    }
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(themeManager.manualTheme).toBe(null);
      expect(themeManager.initialized).toBe(false);
      expect(themeManager.listeners).toBeInstanceOf(Set);
      expect(themeManager.darkModeQuery).toBe(null);
    });
  });

  describe('initialize', () => {
    it('should initialize theme manager successfully', async () => {
      mockStorage.get.mockResolvedValue({ theme: null });

      await themeManager.initialize();

      expect(themeManager.initialized).toBe(true);
      expect(mockStorage.get).toHaveBeenCalledWith(['theme']);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should load existing theme setting from storage', async () => {
      mockStorage.get.mockResolvedValue({ theme: 'dark' });

      await themeManager.initialize();

      expect(themeManager.manualTheme).toBe('dark');
    });

    it('should not initialize twice', async () => {
      mockStorage.get.mockResolvedValue({ theme: null });

      await themeManager.initialize();
      await themeManager.initialize();

      expect(mockStorage.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('setTheme', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValue({ theme: null });
      await themeManager.initialize();
    });

    it('should set light theme', async () => {
      mockStorage.set.mockResolvedValue();

      await themeManager.setTheme('light');

      expect(mockStorage.set).toHaveBeenCalledWith({ theme: 'light' });
      expect(themeManager.manualTheme).toBe('light');
    });

    it('should set dark theme', async () => {
      mockStorage.set.mockResolvedValue();

      await themeManager.setTheme('dark');

      expect(mockStorage.set).toHaveBeenCalledWith({ theme: 'dark' });
      expect(themeManager.manualTheme).toBe('dark');
    });

    it('should set auto theme (null)', async () => {
      mockStorage.set.mockResolvedValue();

      await themeManager.setTheme(null);

      expect(mockStorage.set).toHaveBeenCalledWith({ theme: null });
      expect(themeManager.manualTheme).toBe(null);
    });

    it('should throw error for invalid theme', async () => {
      await expect(themeManager.setTheme('invalid')).rejects.toThrow(
        'Invalid theme: must be "light", "dark", or null for auto'
      );
    });
  });

  describe('getCurrentTheme', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValue({ theme: null });
      await themeManager.initialize();
    });

    it('should return manual theme when set', () => {
      themeManager.manualTheme = 'dark';
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should return system preference when no manual theme', () => {
      themeManager.manualTheme = null;
      themeManager.darkModeQuery = { matches: true };
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should return light when system preference is light', () => {
      themeManager.manualTheme = null;
      themeManager.darkModeQuery = { matches: false };
      expect(themeManager.getCurrentTheme()).toBe('light');
    });
  });

  describe('isUsingSystemPreference', () => {
    it('should return true when manual theme is null', () => {
      themeManager.manualTheme = null;
      expect(themeManager.isUsingSystemPreference()).toBe(true);
    });

    it('should return false when manual theme is set', () => {
      themeManager.manualTheme = 'dark';
      expect(themeManager.isUsingSystemPreference()).toBe(false);
    });
  });

  describe('getSystemPreferenceTheme', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValue({ theme: null });
      await themeManager.initialize();
    });

    it('should return dark when system preference is dark', () => {
      themeManager.darkModeQuery = { matches: true };
      expect(themeManager.getSystemPreferenceTheme()).toBe('dark');
    });

    it('should return light when system preference is light', () => {
      themeManager.darkModeQuery = { matches: false };
      expect(themeManager.getSystemPreferenceTheme()).toBe('light');
    });
  });

  describe('event listeners', () => {
    it('should add and remove listeners', () => {
      const callback = vi.fn();
      
      themeManager.addListener('themeChanged', callback);
      expect(themeManager.listeners.size).toBe(1);
      
      themeManager.removeListener('themeChanged', callback);
      expect(themeManager.listeners.size).toBe(0);
    });

    it('should notify listeners of events', () => {
      const callback = vi.fn();
      themeManager.addListener('themeChanged', callback);
      
      themeManager.notifyListeners('themeChanged', 'dark');
      
      expect(callback).toHaveBeenCalledWith('dark');
    });
  });

  describe('applyTheme', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValue({ theme: null });
      await themeManager.initialize();
    });

    it('should apply dark theme to document', () => {
      themeManager.manualTheme = 'dark';
      themeManager.applyTheme();
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-dark');
    });

    it('should apply light theme to document', () => {
      themeManager.manualTheme = 'light';
      themeManager.applyTheme();
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-light');
    });
  });
}); 