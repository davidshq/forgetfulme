/**
 * @fileoverview Button components for ForgetfulMe extension
 * @module ui-components/button-components
 * @description Provides button creation and styling utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Available button styles for consistent UI
 * @static
 * @type {Object}
 * @property {string} PRIMARY - Primary button style
 * @property {string} SECONDARY - Secondary button style
 * @property {string} DANGER - Danger/error button style
 * @property {string} SUCCESS - Success button style
 * @property {string} WARNING - Warning button style
 * @property {string} INFO - Info button style
 * @property {string} SMALL - Small button size
 * @property {string} LARGE - Large button size
 */
export const BUTTON_STYLES = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
  SMALL: 'small',
  LARGE: 'large',
};

/**
 * Button component creation utilities
 * @class ButtonComponents
 * @description Provides button creation and styling utilities
 *
 * @example
 * // Create a primary button
 * const button = ButtonComponents.createButton('Click me', () => console.log('clicked'), 'primary');
 */
export class ButtonComponents {
  /**
   * Create a button element
   * @param {string} text - Button text
   * @param {Function} onClick - Click handler
   * @param {string} className - Additional CSS classes
   * @param {Object} options - Additional options
   * @returns {HTMLButtonElement}
   */
  static createButton(text, onClick, className = '', options = {}) {
    const button = document.createElement('button');
    button.textContent = text;

    // Map custom classes to Pico CSS classes
    let picoClass = '';
    if (className.includes('primary')) picoClass = 'primary';
    else if (className.includes('secondary')) picoClass = 'secondary';
    else if (className.includes('danger')) picoClass = 'contrast';
    else if (className.includes('outline')) picoClass = 'outline';
    else picoClass = className;

    button.className = picoClass;

    if (onClick) {
      button.addEventListener('click', onClick);
    }

    // Apply additional attributes
    if (options.type) button.type = options.type;
    if (options.disabled) button.disabled = options.disabled;
    if (options.title) button.title = options.title;
    if (options.id) button.id = options.id;

    return button;
  }
}
