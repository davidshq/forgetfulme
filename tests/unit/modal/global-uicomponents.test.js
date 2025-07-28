/**
 * @fileoverview Test to ensure UIComponents is globally available for modal dialogs
 * @description Verifies that all main page entry points make UIComponents globally available
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Global UIComponents Availability', () => {
  beforeEach(() => {
    // Clear any existing global
    delete window.UIComponents;
  });

  afterEach(() => {
    // Clean up
    delete window.UIComponents;
    vi.resetModules();
  });

  it('should make UIComponents globally available in options page', async () => {
    // Import the options index which should set window.UIComponents
    await import('../../../options/index.js');
    
    expect(window.UIComponents).toBeDefined();
    expect(window.UIComponents.createConfirmDialog).toBeDefined();
    expect(window.UIComponents.showModal).toBeDefined();
  });

  it('should make UIComponents globally available in bookmark management page', async () => {
    // Import the bookmark management index which should set window.UIComponents
    await import('../../../bookmark-management/index.js');
    
    expect(window.UIComponents).toBeDefined();
    expect(window.UIComponents.createConfirmDialog).toBeDefined();
    expect(window.UIComponents.showModal).toBeDefined();
  });

  it('should make UIComponents globally available in popup page', async () => {
    // Import the popup index which should set window.UIComponents
    await import('../../../popup/index.js');
    
    expect(window.UIComponents).toBeDefined();
    expect(window.UIComponents.createConfirmDialog).toBeDefined();
    expect(window.UIComponents.showModal).toBeDefined();
  });

  it('should allow UIMessages.confirm to use modal dialogs when UIComponents is global', async () => {
    // Import UIMessages and UIComponents
    const UIMessages = (await import('../../../utils/ui-messages.js')).default;
    const UIComponents = (await import('../../../utils/ui-components.js')).default;
    
    // Make UIComponents globally available
    window.UIComponents = UIComponents;
    
    // Create spies
    const createConfirmDialogSpy = vi.spyOn(UIComponents, 'createConfirmDialog');
    const showModalSpy = vi.spyOn(UIComponents, 'showModal');
    const mockDialog = document.createElement('dialog');
    
    createConfirmDialogSpy.mockReturnValue(mockDialog);
    showModalSpy.mockImplementation(() => {});
    
    // Create a mock container
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Test UIMessages.confirm
    UIMessages.confirm(
      'Test confirm dialog',
      () => {},
      () => {},
      container
    );
    
    // Verify modal methods were called
    expect(createConfirmDialogSpy).toHaveBeenCalled();
    expect(showModalSpy).toHaveBeenCalledWith(mockDialog);
    
    // Clean up
    document.body.removeChild(container);
  });
});