/**
 * @fileoverview Button component creation utilities
 * @module components/button-components
 * @description Provides button creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Available button styles for consistent UI
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
 * Map a class token to Pico CSS or passthrough utility classes.
 * @param {string} token
 * @returns {string}
 */
function mapClassToken(token) {
  if (token === 'danger') {
    return 'contrast';
  }

  return token;
}

/**
 * Create a button element
 * @param {string} text - Button text
 * @param {Function} onClick - Click handler
 * @param {string} className - Additional CSS classes
 * @param {Object} options - Additional options
 * @returns {HTMLButtonElement}
 */
export function createButton(text, onClick, className = '', options = {}) {
  const button = document.createElement('button');
  button.textContent = text;

  const classes = className.split(/\s+/).filter(Boolean).map(mapClassToken);

  button.className = classes.join(' ');

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  // Apply additional attributes
  if (options.type) {
    button.type = options.type;
  }
  if (options.disabled) {
    button.disabled = options.disabled;
  }
  if (options.title) {
    button.title = options.title;
  }
  if (options.id) {
    button.id = options.id;
  }

  for (const [key, value] of Object.entries(options)) {
    if (key.startsWith('aria-') && value != null) {
      button.setAttribute(key, String(value));
    }
  }

  return button;
}
