/**
 * @fileoverview Quick add form component for popup
 * @module components/quick-add
 * @description Handles the quick add bookmark form in the popup
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from '../utils/ui-components.js';

/**
 * Quick add form component
 * @class QuickAdd
 * @description Manages the quick add bookmark form
 */
export class QuickAdd {
  /**
   * Create a quick add component
   * @param {Object} options - Configuration options
   * @param {Function} options.onSubmit - Callback when form is submitted
   */
  constructor(options = {}) {
    this.onSubmit = options.onSubmit || (() => {});
  }

  /**
   * Create quick add form card
   * @returns {HTMLElement} The form card element
   */
  createFormCard() {
    const formCard = UIComponents.createFormCard(
      'Mark Current Page',
      [
        {
          type: 'select',
          id: 'read-status',
          label: 'Mark as:',
          options: {
            options: [
              { value: 'read', text: 'Read' },
              { value: 'good-reference', text: 'Good Reference' },
              { value: 'low-value', text: 'Low Value' },
              { value: 'revisit-later', text: 'Revisit Later' },
            ],
            helpText: 'Choose how you want to categorize this page',
            'aria-describedby': 'status-help',
          },
        },
        {
          type: 'text',
          id: 'tags',
          label: 'Tags (comma separated):',
          options: {
            placeholder: 'research, tutorial, important',
            helpText: 'Add tags to help organize your bookmarks',
            'aria-describedby': 'tags-help',
          },
        },
      ],
      e => {
        e.preventDefault();
        this.onSubmit();
      },
      'Mark as Read',
      'mark-as-read-card',
    );

    return formCard;
  }

  /**
   * Get form values
   * @returns {Object} Object with status and tags
   */
  getFormValues() {
    return {
      status: UIComponents.DOM.getValue('read-status') || 'read',
      tags: UIComponents.DOM.getValue('tags') || '',
    };
  }

  /**
   * Clear form
   */
  clearForm() {
    UIComponents.DOM.setValue('tags', '');
  }
}
