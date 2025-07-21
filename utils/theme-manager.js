/**
 * @fileoverview Theme Manager for ForgetfulMe Extension
 * @module theme-manager
 * @description Manages theme settings and provides manual override for system preferences
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Theme Manager for ForgetfulMe Extension
 * @class ThemeManager
 * @description Manages theme settings and provides manual override for system preferences
 *
 * @example
 * const themeManager = new ThemeManager();
 * await themeManager.initialize();
 * 
 * // Set manual theme
 * await themeManager.setTheme('dark');
 * 
 * // Get current theme
 * const currentTheme = themeManager.getCurrentTheme();
 */
class ThemeManager {
  /**
   * Initialize the theme manager
   * @constructor
   * @description Sets up the theme manager with initial state and listener management
   */
  constructor() {
    /** @type {string|null} Current theme setting ('light', 'dark', or null for auto) */
    this.manualTheme = null;
    /** @type {boolean} Whether the manager has been initialized */
    this.initialized = false;
    /** @type {Set} Set of event listeners */
    this.listeners = new Set();
    /** @type {MediaQueryList} System dark mode media query */
    this.darkModeQuery = null;
  }

  /**
   * Initialize the theme manager
   * @async
   * @description Loads theme settings and sets up system preference listener
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Load theme setting from storage
    await this.loadThemeSetting();

    // Set up system preference listener
    this.setupSystemPreferenceListener();

    // Apply current theme
    this.applyTheme();

    this.initialized = true;
    this.notifyListeners('initialized');
  }

  /**
   * Load theme setting from storage
   * @async
   * @description Loads the manual theme setting from chrome.storage.sync
   */
  async loadThemeSetting() {
    try {
      const result = await chrome.storage.sync.get(['theme']);
      this.manualTheme = result.theme || null;
    } catch (error) {
      console.warn('Failed to load theme setting:', error);
      this.manualTheme = null;
    }
  }

  /**
   * Save theme setting to storage
   * @async
   * @param {string|null} theme - Theme setting ('light', 'dark', or null for auto)
   * @description Saves the manual theme setting to chrome.storage.sync
   */
  async saveThemeSetting(theme) {
    try {
      await chrome.storage.sync.set({ theme });
      this.manualTheme = theme;
      this.applyTheme();
      this.notifyListeners('themeChanged', this.getCurrentTheme());
    } catch (error) {
      console.error('Failed to save theme setting:', error);
      throw error;
    }
  }

  /**
   * Set up system preference listener
   * @description Sets up a listener for system dark mode preference changes
   */
  setupSystemPreferenceListener() {
    this.darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    this.darkModeQuery.addEventListener('change', () => {
      // Only apply system preference if no manual theme is set
      if (this.manualTheme === null) {
        this.applyTheme();
        this.notifyListeners('themeChanged', this.getCurrentTheme());
      }
    });
  }

  /**
   * Get the current effective theme
   * @returns {string} Current theme ('light' or 'dark')
   * @description Returns the current theme, considering manual setting and system preference
   */
  getCurrentTheme() {
    // If manual theme is set, use it
    if (this.manualTheme) {
      return this.manualTheme;
    }

    // Otherwise, use system preference
    return this.darkModeQuery?.matches ? 'dark' : 'light';
  }

  /**
   * Apply the current theme to the document
   * @description Applies the current theme by setting data-theme attribute on document
   */
  applyTheme() {
    const currentTheme = this.getCurrentTheme();
    
    // Remove existing theme attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    
    // Apply current theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.classList.add(`theme-${currentTheme}`);
  }

  /**
   * Set manual theme
   * @async
   * @param {string|null} theme - Theme setting ('light', 'dark', or null for auto)
   * @description Sets a manual theme override
   */
  async setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark' && theme !== null) {
      throw new Error('Invalid theme: must be "light", "dark", or null for auto');
    }

    await this.saveThemeSetting(theme);
  }

  /**
   * Get manual theme setting
   * @returns {string|null} Manual theme setting or null for auto
   * @description Returns the current manual theme setting
   */
  getManualTheme() {
    return this.manualTheme;
  }

  /**
   * Check if system preference is being used
   * @returns {boolean} True if using system preference, false if manual theme is set
   * @description Returns whether the current theme is based on system preference
   */
  isUsingSystemPreference() {
    return this.manualTheme === null;
  }

  /**
   * Get system preference theme
   * @returns {string} System preference theme ('light' or 'dark')
   * @description Returns the current system preference theme
   */
  getSystemPreferenceTheme() {
    return this.darkModeQuery?.matches ? 'dark' : 'light';
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @description Adds an event listener for theme changes
   */
  addListener(event, callback) {
    this.listeners.add({ event, callback });
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @description Removes an event listener
   */
  removeListener(event, callback) {
    for (const listener of this.listeners) {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
        break;
      }
    }
  }

  /**
   * Notify listeners of an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @description Notifies all listeners of an event
   */
  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch (error) {
          console.error('Error in theme manager listener:', error);
        }
      }
    }
  }

  /**
   * Ensure the manager is initialized
   * @async
   * @description Ensures the theme manager is initialized before use
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Reset theme to system preference
   * @async
   * @description Resets the theme to use system preference (removes manual override)
   */
  async resetToSystemPreference() {
    await this.setTheme(null);
  }
}

export default ThemeManager; 