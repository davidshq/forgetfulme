/**
 * @fileoverview Unit tests for ForgetfulMe options page
 * @module tests/unit/options
 * @description Tests for the options page functionality including bookmark management
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../helpers/register-page-mocks.js';

vi.mock('../../config-ui.js', () => ({
  default: class MockConfigUI {
    constructor(_supabaseConfig) {
      this.showConfigForm = vi.fn();
      this.showConfigStatus = vi.fn();
    }
  },
}));

// Mock DOM elements used by options-specific setup
const mockAppContainer = {
  innerHTML: '',
  appendChild: vi.fn(),
};

import ForgetfulMeOptions from '../../options.js';
import UIComponents from '../../utils/ui-components.js';
import { renderMainInterface } from '../../utils/options-ui-renderer.js';

vi.mock('../../utils/options-ui-renderer.js', () => ({
  renderMainInterface: vi.fn(() => ({ configStatusContainer: null })),
}));

describe('ForgetfulMeOptions', () => {
  let options;

  beforeEach(() => {
    vi.clearAllMocks();

    UIComponents.DOM.getElement.mockImplementation(id => {
      if (id === 'app') return mockAppContainer;
      return null;
    });

    // Mock document.createElement
    document.createElement = vi.fn(tagName => {
      const element = {
        tagName: tagName.toUpperCase(),
        innerHTML: '',
        appendChild: vi.fn(),
        addEventListener: vi.fn(),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn().mockReturnValue([]),
        style: {},
        className: '',
        id: '',
        textContent: '',
        value: '',
        click: vi.fn(),
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      };

      return element;
    });

    // Mock document.getElementById
    document.getElementById = vi.fn(id => {
      if (id === 'app') return mockAppContainer;
      return null;
    });

    options = new ForgetfulMeOptions();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('openBookmarkManagement', () => {
    it('should open bookmark management in a new tab', () => {
      options.openBookmarkManagement();

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test-id/bookmark-management.html',
      });
    });

    it('should use chrome.runtime.getURL to get the correct URL', () => {
      options.openBookmarkManagement();

      expect(chrome.runtime.getURL).toHaveBeenCalledWith(
        'bookmark-management.html',
      );
    });
  });

  describe('loadData', () => {
    it('should load data without recent entries', async () => {
      options.supabaseService = {
        getBookmarks: vi.fn().mockResolvedValue([]),
      };
      options.configManager = {
        initialize: vi.fn().mockResolvedValue(),
        getCustomStatusTypes: vi.fn().mockResolvedValue([]),
      };

      await options.loadData();

      expect(options.supabaseService.getBookmarks).toHaveBeenCalled();
      expect(options.configManager.getCustomStatusTypes).toHaveBeenCalled();
    });
  });

  describe('showMainInterface', () => {
    it('should wire renderer callbacks to controller methods', () => {
      options.appContainer = mockAppContainer;
      options.configUI = { showConfigStatus: vi.fn() };

      const exportSpy = vi
        .spyOn(options, 'exportData')
        .mockResolvedValue(undefined);
      const clearSpy = vi
        .spyOn(options, 'clearData')
        .mockResolvedValue(undefined);
      const addSpy = vi
        .spyOn(options, 'addStatusType')
        .mockResolvedValue(undefined);
      const importSpy = vi.spyOn(options, 'openImportDialog');

      options.showMainInterface();

      expect(renderMainInterface).toHaveBeenCalledWith(
        mockAppContainer,
        expect.objectContaining({
          addStatusType: expect.any(Function),
          exportData: expect.any(Function),
          openImportDialog: expect.any(Function),
          clearData: expect.any(Function),
          openBookmarkManagement: expect.any(Function),
        }),
      );

      const callbacks = renderMainInterface.mock.calls[0][1];
      callbacks.exportData();
      callbacks.clearData();
      callbacks.addStatusType();
      callbacks.openImportDialog();

      expect(exportSpy).toHaveBeenCalled();
      expect(clearSpy).toHaveBeenCalled();
      expect(addSpy).toHaveBeenCalled();
      expect(importSpy).toHaveBeenCalled();
    });
  });
});
