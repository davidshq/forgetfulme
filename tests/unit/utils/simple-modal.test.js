import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SimpleModal from '../../../utils/simple-modal.js';

describe('SimpleModal', () => {
  let container;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Mock dialog.showModal (not available in JSDOM)
    HTMLDialogElement.prototype.showModal = vi.fn(function() {
      this.setAttribute('open', '');
    });
    
    HTMLDialogElement.prototype.close = vi.fn(function() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
  });

  afterEach(() => {
    // Clean up any remaining modals
    document.querySelectorAll('dialog').forEach(dialog => dialog.remove());
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('confirm', () => {
    it('should create and show a confirmation dialog', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      
      const dialog = SimpleModal.confirm(
        'Are you sure?',
        onConfirm,
        onCancel
      );

      expect(dialog).toBeInstanceOf(HTMLDialogElement);
      expect(dialog.showModal).toHaveBeenCalled();
      expect(document.body.contains(dialog)).toBe(true);
      
      // Check dialog structure
      const message = dialog.querySelector('p');
      expect(message.textContent).toBe('Are you sure?');
      
      const buttons = dialog.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toBe('Cancel');
      expect(buttons[1].textContent).toBe('Confirm');
    });

    it('should call onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      
      const dialog = SimpleModal.confirm(
        'Delete this item?',
        onConfirm,
        onCancel
      );

      const confirmBtn = dialog.querySelector('button:last-child');
      confirmBtn.click();

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
      expect(dialog.close).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      
      const dialog = SimpleModal.confirm(
        'Delete this item?',
        onConfirm,
        onCancel
      );

      const cancelBtn = dialog.querySelector('button:first-child');
      cancelBtn.click();

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
      expect(dialog.close).toHaveBeenCalled();
    });

    it('should call onCancel when close button is clicked', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      
      const dialog = SimpleModal.confirm(
        'Delete this item?',
        onConfirm,
        onCancel
      );

      const closeBtn = dialog.querySelector('a.close');
      closeBtn.click();

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should use custom button text when provided', () => {
      const dialog = SimpleModal.confirm(
        'Are you sure?',
        vi.fn(),
        vi.fn(),
        {
          confirmText: 'Delete',
          cancelText: 'Keep'
        }
      );

      const buttons = dialog.querySelectorAll('button');
      expect(buttons[0].textContent).toBe('Keep');
      expect(buttons[1].textContent).toBe('Delete');
    });

    it('should remove dialog from DOM when closed', () => {
      const dialog = SimpleModal.confirm(
        'Test',
        vi.fn(),
        vi.fn()
      );

      expect(document.body.contains(dialog)).toBe(true);

      // Simulate dialog close
      dialog.close();

      // Dialog should be removed after close event
      expect(document.body.contains(dialog)).toBe(false);
    });
  });

  describe('alert', () => {
    it('should create and show an alert dialog', () => {
      const onClose = vi.fn();
      
      const dialog = SimpleModal.alert(
        'Operation completed!',
        onClose
      );

      expect(dialog).toBeInstanceOf(HTMLDialogElement);
      expect(dialog.showModal).toHaveBeenCalled();
      expect(document.body.contains(dialog)).toBe(true);
      
      // Check dialog structure
      const message = dialog.querySelector('p');
      expect(message.textContent).toBe('Operation completed!');
      
      const button = dialog.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('OK');
    });

    it('should call onClose when OK button is clicked', () => {
      const onClose = vi.fn();
      
      const dialog = SimpleModal.alert(
        'Success!',
        onClose
      );

      const okBtn = dialog.querySelector('button');
      okBtn.click();

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(dialog.close).toHaveBeenCalled();
    });

    it('should use custom OK button text when provided', () => {
      const dialog = SimpleModal.alert(
        'Message',
        vi.fn(),
        { okText: 'Got it!' }
      );

      const button = dialog.querySelector('button');
      expect(button.textContent).toBe('Got it!');
    });
  });

  describe('Modal behavior', () => {
    it('should handle multiple modals', () => {
      const dialog1 = SimpleModal.alert('First', vi.fn());
      const dialog2 = SimpleModal.confirm('Second', vi.fn(), vi.fn());

      expect(document.querySelectorAll('dialog')).toHaveLength(2);
      expect(document.body.contains(dialog1)).toBe(true);
      expect(document.body.contains(dialog2)).toBe(true);
    });

    it('should not throw when callbacks are not provided', () => {
      expect(() => {
        const dialog = SimpleModal.confirm('Test');
        const confirmBtn = dialog.querySelector('button:last-child');
        confirmBtn.click();
      }).not.toThrow();

      expect(() => {
        const dialog = SimpleModal.alert('Test');
        const okBtn = dialog.querySelector('button');
        okBtn.click();
      }).not.toThrow();
    });
  });
});