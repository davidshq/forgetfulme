/**
 * @fileoverview Container component creation utilities
 * @module components/container-components
 * @description Provides container and section creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Create a container with header
 * @param {string} title - Container title
 * @param {string} subtitle - Container subtitle
 * @param {string} className - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createContainer(title, subtitle = '', className = '') {
  const container = document.createElement('div');
  container.className = `ui-container ${className}`.trim();

  if (title) {
    const header = document.createElement('div');
    header.className = 'ui-container-header';

    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    header.appendChild(titleEl);

    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.textContent = subtitle;
      header.appendChild(subtitleEl);
    }

    container.appendChild(header);
  }

  return container;
}

/**
 * Create a section with title using Pico styling
 * @param {string} title - Section title
 * @param {string} className - Additional CSS classes
 * @param {Object} options - Section options
 * @returns {HTMLElement}
 */
export function createSection(title, className = '', options = {}) {
  // Use article element for card-like sections when specified
  const element = options.useCard
    ? document.createElement('article')
    : document.createElement('section');
  element.className = `section ${className}`.trim();

  if (title) {
    const titleEl = document.createElement(options.useCard ? 'header' : 'h3');
    if (options.useCard) {
      const titleH3 = document.createElement('h3');
      titleH3.textContent = title;
      titleEl.appendChild(titleH3);
    } else {
      titleEl.textContent = title;
    }
    element.appendChild(titleEl);
  }

  return element;
}
