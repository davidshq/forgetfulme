/**
 * Simple Modal utility for ForgetfulMe extension
 * Uses Pico.css's built-in modal styling
 */

export class SimpleModal {
  /**
   * Show a confirmation dialog
   * @param {string} message - The message to display
   * @param {Function} onConfirm - Callback when user confirms
   * @param {Function} onCancel - Callback when user cancels
   * @param {Object} options - Optional configuration
   */
  static confirm(message, onConfirm, onCancel, options = {}) {
    // Create modal elements using Pico.css structure
    const dialog = document.createElement('dialog');
    dialog.id = 'confirm-modal';
    
    const article = document.createElement('article');
    
    // Header with close button
    const header = document.createElement('header');
    const closeBtn = document.createElement('a');
    closeBtn.href = '#';
    closeBtn.className = 'close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.onclick = (e) => {
      e.preventDefault();
      dialog.close();
      if (onCancel) onCancel();
    };
    header.appendChild(closeBtn);
    
    // Message
    const messageP = document.createElement('p');
    messageP.textContent = message;
    
    // Footer with buttons
    const footer = document.createElement('footer');
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'secondary';
    cancelBtn.textContent = options.cancelText || 'Cancel';
    cancelBtn.onclick = () => {
      dialog.close();
      if (onCancel) onCancel();
    };
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = options.confirmText || 'Confirm';
    confirmBtn.onclick = () => {
      dialog.close();
      if (onConfirm) onConfirm();
    };
    
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    
    // Assemble modal
    article.appendChild(header);
    article.appendChild(messageP);
    article.appendChild(footer);
    dialog.appendChild(article);
    
    // Add to body and show
    document.body.appendChild(dialog);
    dialog.showModal();
    
    // Clean up when closed
    dialog.addEventListener('close', () => {
      dialog.remove();
    });
    
    return dialog;
  }
  
  /**
   * Show an alert dialog
   * @param {string} message - The message to display
   * @param {Function} onClose - Callback when dialog is closed
   * @param {Object} options - Optional configuration
   */
  static alert(message, onClose, options = {}) {
    const dialog = document.createElement('dialog');
    dialog.id = 'alert-modal';
    
    const article = document.createElement('article');
    
    // Message
    const messageP = document.createElement('p');
    messageP.textContent = message;
    
    // Footer with OK button
    const footer = document.createElement('footer');
    
    const okBtn = document.createElement('button');
    okBtn.textContent = options.okText || 'OK';
    okBtn.onclick = () => {
      dialog.close();
      if (onClose) onClose();
    };
    
    footer.appendChild(okBtn);
    
    // Assemble modal
    article.appendChild(messageP);
    article.appendChild(footer);
    dialog.appendChild(article);
    
    // Add to body and show
    document.body.appendChild(dialog);
    dialog.showModal();
    
    // Clean up when closed
    dialog.addEventListener('close', () => {
      dialog.remove();
    });
    
    return dialog;
  }
}

export default SimpleModal;