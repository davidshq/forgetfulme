/**
 * @fileoverview Integration tests for options page renderer + data manager contract
 * @module tests/unit/options-page-integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderMainInterface } from '../../utils/options-ui-renderer.js';
import { loadStatusTypes } from '../../utils/options-data-manager.js';

describe('options page integration', () => {
  let appContainer;

  beforeEach(() => {
    appContainer = document.createElement('div');
    appContainer.id = 'app';
    document.body.appendChild(appContainer);
  });

  it('renders DOM ids used by options.js and options-data-manager', () => {
    renderMainInterface(appContainer, {
      addStatusType: vi.fn(),
      exportData: vi.fn(),
      openImportDialog: vi.fn(),
      clearData: vi.fn(),
      openBookmarkManagement: vi.fn(),
    });

    expect(document.getElementById('new-status')).toBeTruthy();
    expect(document.getElementById('status-types-list')).toBeTruthy();
    expect(document.getElementById('import-file')).toBeTruthy();
  });

  it('populates status types list after render', () => {
    renderMainInterface(appContainer, {
      addStatusType: vi.fn(),
      exportData: vi.fn(),
      openImportDialog: vi.fn(),
      clearData: vi.fn(),
      openBookmarkManagement: vi.fn(),
    });

    loadStatusTypes(['important', 'reference'], vi.fn());

    const list = document.getElementById('status-types-list');
    expect(list.children.length).toBe(2);
  });

  it('calls exportData when Export All Data is clicked', () => {
    const exportData = vi.fn();

    renderMainInterface(appContainer, {
      addStatusType: vi.fn(),
      exportData,
      openImportDialog: vi.fn(),
      clearData: vi.fn(),
      openBookmarkManagement: vi.fn(),
    });

    const exportButton = Array.from(
      appContainer.querySelectorAll('button'),
    ).find(btn => btn.textContent === 'Export All Data');

    exportButton.click();

    expect(exportData).toHaveBeenCalledTimes(1);
  });

  it('calls addStatusType when the status form is submitted', () => {
    const addStatusType = vi.fn();

    renderMainInterface(appContainer, {
      addStatusType,
      exportData: vi.fn(),
      openImportDialog: vi.fn(),
      clearData: vi.fn(),
      openBookmarkManagement: vi.fn(),
    });

    const statusInput = document.getElementById('new-status');
    statusInput.value = 'important';

    const form = appContainer.querySelector('#add-status-form');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(addStatusType).toHaveBeenCalledTimes(1);
  });

  it('calls openBookmarkManagement when Manage Bookmarks is clicked', () => {
    const openBookmarkManagement = vi.fn();

    renderMainInterface(appContainer, {
      addStatusType: vi.fn(),
      exportData: vi.fn(),
      openImportDialog: vi.fn(),
      clearData: vi.fn(),
      openBookmarkManagement,
    });

    const manageButton = Array.from(
      appContainer.querySelectorAll('button'),
    ).find(btn => btn.textContent.includes('Manage Bookmarks'));

    manageButton.click();

    expect(openBookmarkManagement).toHaveBeenCalledTimes(1);
  });
});
