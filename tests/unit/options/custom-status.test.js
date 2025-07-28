/**
 * @fileoverview Test for custom status persistence in options page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../../../options/modules/data/data-manager.js';
import ConfigManager from '../../../utils/config-manager.js';
import SupabaseService from '../../../supabase-service.js';
import UIComponents from '../../../utils/ui-components.js';
import UIMessages from '../../../utils/ui-messages.js';

describe('Custom Status Persistence', () => {
  let dataManager;
  let mockConfigManager;
  let mockSupabaseService;
  let mockAppContainer;

  beforeEach(() => {
    // Create mock dependencies
    mockConfigManager = {
      initialize: vi.fn().mockResolvedValue(undefined),
      getCustomStatusTypes: vi.fn().mockResolvedValue(['reading', 'important']),
      addCustomStatusType: vi.fn().mockResolvedValue(undefined),
      removeCustomStatusType: vi.fn().mockResolvedValue(undefined),
    };

    mockSupabaseService = {
      getBookmarks: vi.fn().mockResolvedValue([]),
    };

    mockAppContainer = document.createElement('div');

    // Create data manager instance
    dataManager = new DataManager({
      configManager: mockConfigManager,
      supabaseService: mockSupabaseService,
      appContainer: mockAppContainer,
    });

    // Mock UI messages
    vi.spyOn(UIMessages, 'success').mockImplementation(() => {});
    vi.spyOn(UIMessages, 'error').mockImplementation(() => {});
  });

  it('should add a new custom status type when form is submitted', async () => {
    // Create a mock input element
    const mockInput = document.createElement('input');
    mockInput.id = 'new-status-name';
    mockInput.value = 'Test Status';
    document.body.appendChild(mockInput);

    // Create a mock list container
    const mockListContainer = document.createElement('div');
    mockListContainer.id = 'status-list-container';
    document.body.appendChild(mockListContainer);

    // Call addStatusType
    await dataManager.addStatusType();

    // Verify config manager was initialized
    expect(mockConfigManager.initialize).toHaveBeenCalled();

    // Verify the status was added with normalized name
    expect(mockConfigManager.addCustomStatusType).toHaveBeenCalledWith(
      'test-status'
    );

    // Verify success message was shown
    expect(UIMessages.success).toHaveBeenCalledWith(
      'Status type added successfully',
      mockAppContainer
    );

    // Cleanup
    document.body.removeChild(mockInput);
    document.body.removeChild(mockListContainer);
  });

  it('should clear input fields after successful addition', async () => {
    // Create mock input elements
    const mockNameInput = document.createElement('input');
    mockNameInput.id = 'new-status-name';
    mockNameInput.value = 'Test Status';
    document.body.appendChild(mockNameInput);

    const mockDescInput = document.createElement('input');
    mockDescInput.id = 'new-status-description';
    mockDescInput.value = 'Test Description';
    document.body.appendChild(mockDescInput);

    const mockListContainer = document.createElement('div');
    mockListContainer.id = 'status-list-container';
    document.body.appendChild(mockListContainer);

    // Call addStatusType
    await dataManager.addStatusType();

    // Verify inputs were cleared
    expect(mockNameInput.value).toBe('');
    expect(mockDescInput.value).toBe('');

    // Cleanup
    document.body.removeChild(mockNameInput);
    document.body.removeChild(mockDescInput);
    document.body.removeChild(mockListContainer);
  });

  it('should display error when status name is empty', async () => {
    // Create a mock input element with empty value
    const mockInput = document.createElement('input');
    mockInput.id = 'new-status-name';
    mockInput.value = '';
    document.body.appendChild(mockInput);

    // Call addStatusType
    await dataManager.addStatusType();

    // Verify error message was shown
    expect(UIMessages.error).toHaveBeenCalledWith(
      'Please enter a status type',
      mockAppContainer
    );

    // Verify addCustomStatusType was not called
    expect(mockConfigManager.addCustomStatusType).not.toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(mockInput);
  });

  it('should update the status list after adding a new status', async () => {
    // Setup
    const mockInput = document.createElement('input');
    mockInput.id = 'new-status-name';
    mockInput.value = 'New Status';
    document.body.appendChild(mockInput);

    const mockListContainer = document.createElement('div');
    mockListContainer.id = 'status-list-container';
    document.body.appendChild(mockListContainer);

    // Mock the updated status list
    mockConfigManager.getCustomStatusTypes.mockResolvedValue([
      'reading',
      'important',
      'new-status',
    ]);

    // Call addStatusType
    await dataManager.addStatusType();

    // Verify the list was updated
    expect(mockListContainer.children.length).toBeGreaterThan(0);

    // Cleanup
    document.body.removeChild(mockInput);
    document.body.removeChild(mockListContainer);
  });
});