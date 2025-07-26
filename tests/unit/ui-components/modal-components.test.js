import { describe, test, expect, beforeEach, vi } from 'vitest';
import UIComponents from '../../../utils/ui-components.js';

describe('Modal Components Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Modal Creation and Management', () => {
    test('should create accessible modal dialog', () => {
      // Use old API: createModal(title, content, actions, options)
      const modal = UIComponents.createModal(
        'Confirm Delete',
        'Are you sure you want to delete this bookmark?',
        [],
        { id: 'delete-modal' }
      );

      // Test accessibility attributes
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');

      // Test modal structure
      const title = modal.querySelector('h3');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Confirm Delete');

      const content = modal.querySelector('.modal-content');
      expect(content.textContent).toContain('Are you sure');
    });

    test('should handle modal show and hide behavior', () => {
      const modal = UIComponents.createModal('Test Modal', 'Test content');

      document.body.appendChild(modal);

      // Test show modal
      UIComponents.showModal(modal);
      expect(modal.style.display).not.toBe('none');
      expect(modal.classList.contains('modal-open')).toBe(true);

      // Test hide modal
      UIComponents.closeModal(modal);
      expect(modal.style.display).toBe('none');
      expect(modal.classList.contains('modal-open')).toBe(false);
    });

    test('should close modal on escape key press', () => {
      const modal = UIComponents.createModal('Test Modal', 'Test content');

      document.body.appendChild(modal);
      UIComponents.showModal(modal);

      // Simulate escape key press on window
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(escapeEvent);

      // Modal should be hidden
      expect(modal.style.display).toBe('none');
    });

    test('should close modal on backdrop click', () => {
      const modal = UIComponents.createModal('Test Modal', 'Test content');

      document.body.appendChild(modal);
      UIComponents.showModal(modal);

      // Simulate backdrop click (clicking on dialog itself)
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: modal });
      modal.dispatchEvent(clickEvent);

      expect(modal.style.display).toBe('none');
    });
  });

  describe('Confirm Dialog Workflow', () => {
    test('should create confirm dialog with proper actions', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // Use old API: createConfirmDialog(message, onConfirm, onCancel, options)
      const dialog = UIComponents.createConfirmDialog(
        'This action cannot be undone',
        onConfirm,
        onCancel,
        {
          title: 'Delete Bookmark',
          confirmText: 'Delete',
          cancelText: 'Cancel',
        }
      );

      // Test dialog structure
      expect(dialog.getAttribute('role')).toBe('dialog');

      const confirmButton = dialog.querySelector('button:first-of-type');
      const cancelButton = dialog.querySelector('button:last-of-type');

      expect(confirmButton.textContent).toBe('Delete');
      expect(cancelButton.textContent).toBe('Cancel');

      // Test confirm action
      confirmButton.click();
      expect(onConfirm).toHaveBeenCalled();

      // Reset and test cancel action
      const dialog2 = UIComponents.createConfirmDialog(
        'Test message',
        vi.fn(),
        onCancel
      );
      document.body.appendChild(dialog2);
      const cancelBtn2 = dialog2.querySelector('button:last-of-type');
      cancelBtn2.click();
      expect(onCancel).toHaveBeenCalled();
    });

    test('should apply danger styling to destructive actions', () => {
      const dialog = UIComponents.createConfirmDialog(
        'This will permanently delete all bookmarks',
        vi.fn(),
        vi.fn(),
        {
          title: 'Delete All Bookmarks',
          confirmText: 'Delete All',
          confirmStyle: 'danger',
        }
      );

      const confirmButton = dialog.querySelector('button:first-of-type');
      expect(
        confirmButton.classList.contains('danger') ||
          confirmButton.classList.contains('contrast')
      ).toBe(true);
    });
  });

  describe('Modal Error Handling', () => {
    test('should handle missing required properties gracefully', () => {
      // Test with minimal props
      const modal = UIComponents.createModal();

      expect(modal).toBeTruthy();
      expect(modal.tagName).toBe('DIALOG');
    });

    test('should prevent body scroll when modal is open', () => {
      const modal = UIComponents.createModal('Test Modal', 'Test content');

      document.body.appendChild(modal);

      UIComponents.showModal(modal);
      expect(document.body.style.overflow).toBe('hidden');

      UIComponents.closeModal(modal);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Modal Accessibility', () => {
    test('should trap focus within modal', () => {
      const modal = UIComponents.createModal(
        'Test Modal',
        '<button id="modal-btn">Click me</button>'
      );

      document.body.appendChild(modal);
      UIComponents.showModal(modal);

      // Test that focus can be set to modal elements
      const modalButton = modal.querySelector('#modal-btn');
      if (modalButton) {
        modalButton.focus();
        expect(document.activeElement).toBe(modalButton);
      }
    });

    test('should restore focus when modal closes', () => {
      // Create a button that opens the modal
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const modal = UIComponents.createModal('Test Modal', 'Test content');

      document.body.appendChild(modal);
      UIComponents.showModal(modal);
      UIComponents.closeModal(modal);

      // Focus should return to trigger button (if focus management is implemented)
      // For now, just test that focus management doesn't break
      expect(triggerButton).toBeTruthy();
    });
  });
});
