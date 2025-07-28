/**
 * @fileoverview Test for UIMessages confirm dialog modal behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import UIMessages from '../../../utils/ui-messages.js';
import UIComponents from '../../../utils/ui-components.js';

describe('UIMessages Confirm Dialog', () => {
  let mockContainer;
  let createConfirmDialogSpy;
  let showModalSpy;

  beforeEach(() => {
    // Create mock container
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);

    // Make UIComponents globally available
    window.UIComponents = UIComponents;

    // Create spies for UIComponents methods
    createConfirmDialogSpy = vi.spyOn(UIComponents, 'createConfirmDialog');
    showModalSpy = vi.spyOn(UIComponents, 'showModal');
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should use UIComponents modal for confirm dialog', () => {
    const mockDialog = document.createElement('dialog');
    createConfirmDialogSpy.mockReturnValue(mockDialog);
    showModalSpy.mockImplementation(() => {});

    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    UIMessages.confirm(
      'Are you sure you want to clear all data?',
      onConfirm,
      onCancel,
      mockContainer
    );

    // Verify UIComponents methods were called
    expect(createConfirmDialogSpy).toHaveBeenCalledWith(
      'Are you sure you want to clear all data?',
      onConfirm,
      onCancel,
      {}
    );
    expect(showModalSpy).toHaveBeenCalledWith(mockDialog);
  });

  it('should pass options to createConfirmDialog', () => {
    const mockDialog = document.createElement('dialog');
    createConfirmDialogSpy.mockReturnValue(mockDialog);
    showModalSpy.mockImplementation(() => {});

    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const options = {
      confirmText: 'Delete',
      cancelText: 'Keep',
      confirmClass: 'danger',
    };

    UIMessages.confirm(
      'Delete this item?',
      onConfirm,
      onCancel,
      mockContainer,
      options
    );

    // Verify options were passed
    expect(createConfirmDialogSpy).toHaveBeenCalledWith(
      'Delete this item?',
      onConfirm,
      onCancel,
      options
    );
  });

  it('should fall back to legacy confirm when UIComponents methods are not available', () => {
    // Temporarily remove the methods to simulate them not being available
    const originalCreateConfirmDialog = UIComponents.createConfirmDialog;
    const originalShowModal = UIComponents.showModal;

    delete UIComponents.createConfirmDialog;
    delete UIComponents.showModal;

    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    UIMessages.confirm('Are you sure?', onConfirm, onCancel, mockContainer);

    // Should fall back to legacy implementation
    // Check that a confirm element was appended to the container
    const confirmEl = mockContainer.querySelector('.ui-confirm');
    expect(confirmEl).toBeTruthy();
    expect(confirmEl.querySelector('.ui-confirm-message').textContent).toBe(
      'Are you sure?'
    );

    // Restore the methods
    UIComponents.createConfirmDialog = originalCreateConfirmDialog;
    UIComponents.showModal = originalShowModal;
  });

  it('should integrate with options page data manager', async () => {
    // Import the actual data manager to test integration
    const { DataManager } = await import(
      '../../../options/modules/data/data-manager.js'
    );

    const mockConfigManager = {
      initialize: vi.fn().mockResolvedValue(undefined),
      getCustomStatusTypes: vi.fn().mockResolvedValue([]),
    };

    const mockSupabaseService = {
      getBookmarks: vi
        .fn()
        .mockResolvedValue([
          { id: '1', title: 'Test', url: 'http://test.com' },
        ]),
      deleteBookmark: vi.fn().mockResolvedValue(undefined),
    };

    const dataManager = new DataManager({
      configManager: mockConfigManager,
      supabaseService: mockSupabaseService,
      appContainer: mockContainer,
    });

    // Mock the modal creation
    const mockDialog = document.createElement('dialog');
    createConfirmDialogSpy.mockReturnValue(mockDialog);
    showModalSpy.mockImplementation(() => {});

    // Spy on success message
    const successSpy = vi
      .spyOn(UIMessages, 'success')
      .mockImplementation(() => {});

    // Call clearData which should show a confirm dialog
    await dataManager.clearData();

    // Verify confirm dialog was shown as a modal
    expect(createConfirmDialogSpy).toHaveBeenCalled();
    expect(showModalSpy).toHaveBeenCalledWith(mockDialog);

    // Get the onConfirm callback and execute it
    const confirmCall = createConfirmDialogSpy.mock.calls[0];
    const onConfirmCallback = confirmCall[1];

    // Execute the confirm callback
    await onConfirmCallback();

    // Verify bookmark was deleted
    expect(mockSupabaseService.deleteBookmark).toHaveBeenCalledWith('1');
    expect(successSpy).toHaveBeenCalledWith(
      'All data cleared successfully',
      mockContainer
    );
  });
});
