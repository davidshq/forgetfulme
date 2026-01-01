/**
 * @fileoverview Status selector component
 * @module components/status-selector
 * @description Handles status dropdown management
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from '../utils/ui-components.js';
import { formatStatus } from '../utils/formatters.js';

/**
 * Status selector component
 * @class StatusSelector
 * @description Manages status dropdown options
 */
export class StatusSelector {
  /**
   * Create a status selector component
   */
  constructor() {}

  /**
   * Load custom status types into the selector
   * @param {Array<string>} customStatusTypes - Array of custom status type strings
   */
  loadCustomStatusTypes(customStatusTypes) {
    if (customStatusTypes.length === 0) {
      return;
    }

    const readStatusSelectEl = UIComponents.DOM.getElement('read-status');
    if (!readStatusSelectEl) {
      return;
    }

    // Clear default options and add custom ones
    readStatusSelectEl.innerHTML = '';
    customStatusTypes.forEach(status => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = formatStatus(status);
      readStatusSelectEl.appendChild(option);
    });
  }
}
