/**
 * @fileoverview DOM utility functions for the ForgetfulMe extension
 */

/**
 * Safely query a single element
 * @param {string} selector - CSS selector
 * @param {Document|Element} context - Search context
 * @returns {Element|null} Found element or null
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Safely query multiple elements
 * @param {string} selector - CSS selector
 * @param {Document|Element} context - Search context
 * @returns {NodeList} Found elements
 */
export function $$(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * Add event listener with automatic cleanup tracking
 * @param {Element} element - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @param {boolean|Object} options - Event options
 * @returns {Function} Cleanup function
 */
export function addEventListener(element, event, handler, options = false) {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

/**
 * Show element by removing hidden class/attribute
 * @param {Element} element - Element to show
 */
export function show(element) {
  if (!element) return;
  element.classList.remove('hidden');
  element.removeAttribute('hidden');
  element.style.display = '';
}

/**
 * Hide element by adding hidden class
 * @param {Element} element - Element to hide
 */
export function hide(element) {
  if (!element) return;
  element.classList.add('hidden');
}

/**
 * Toggle element visibility
 * @param {Element} element - Element to toggle
 * @param {boolean} [force] - Force show (true) or hide (false)
 */
export function toggle(element, force) {
  if (!element) return;

  if (force !== undefined) {
    if (force) {
      show(element);
    } else {
      hide(element);
    }
    return;
  }

  if (element.classList.contains('hidden')) {
    show(element);
  } else {
    hide(element);
  }
}

/**
 * Set text content safely
 * @param {Element} element - Target element
 * @param {string} text - Text to set
 */
export function setText(element, text) {
  if (!element) return;
  element.textContent = text || '';
}

/**
 * Set HTML content safely by escaping user input
 * @param {Element} element - Target element
 * @param {string} html - HTML to set (will be escaped if not explicitly marked as safe)
 * @param {boolean} [trusted=false] - Whether to trust the HTML content (skip escaping)
 */
export function setHTML(element, html, trusted = false) {
  if (!element) return;

  if (!html) {
    element.innerHTML = '';
    return;
  }

  if (trusted) {
    // Only use innerHTML with explicitly trusted content
    element.innerHTML = html;
  } else {
    // Escape HTML for safety
    element.textContent = html;
  }
}

/**
 * Set HTML content for trusted content only (internal use)
 * WARNING: Only use with known-safe HTML from static templates
 * @param {Element} element - Target element
 * @param {string} html - Trusted HTML to set (must be static, never user input)
 */
export function setTrustedHTML(element, html) {
  if (!element) return;

  // Clear first for safety
  element.textContent = '';

  // Only set innerHTML if we have trusted content
  if (html && typeof html === 'string') {
    // Log warning if content looks suspicious (contains script or event handlers)
    if (html.includes('<script') || html.includes('javascript:') || /on\w+=/i.test(html)) {
      console.warn('setTrustedHTML: Potentially unsafe HTML detected:', html.substring(0, 100));
      element.textContent = html; // Fallback to safe text content
      return;
    }
    element.innerHTML = html;
  }
}

/**
 * Clear element content safely
 * @param {Element} element - Element to clear
 */
export function clearElement(element) {
  if (!element) return;

  // More efficient than innerHTML = ''
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Add or remove CSS class based on condition
 * @param {Element} element - Target element
 * @param {string} className - CSS class name
 * @param {boolean} condition - Whether to add the class
 */
export function toggleClass(element, className, condition) {
  if (!element) return;

  if (condition) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

/**
 * Create element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} [attributes] - Element attributes
 * @param {string|Node|Node[]} [content] - Element content
 * @returns {Element} Created element
 */
export function createElement(tag, attributes = {}, content = null) {
  const element = document.createElement(tag);

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });

  // Set content
  if (content !== null) {
    if (typeof content === 'string') {
      element.textContent = content;
    } else if (content instanceof Node) {
      element.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach(child => {
        if (child instanceof Node) {
          element.appendChild(child);
        }
      });
    }
  }

  return element;
}

/**
 * Get form data as object
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Form data as key-value pairs
 */
export function getFormData(form) {
  if (!form) return {};

  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  return data;
}

/**
 * Set form field values from object
 * @param {HTMLFormElement} form - Form element
 * @param {Object} data - Data to populate
 */
export function setFormData(form, data) {
  if (!form || !data) return;

  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements[key];
    if (!field) return;

    if (field.type === 'checkbox') {
      field.checked = Boolean(value);
    } else if (field.type === 'radio') {
      const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
      if (radio) radio.checked = true;
    } else {
      field.value = value || '';
    }
  });
}

/**
 * Wait for DOM to be ready
 * @returns {Promise<void>} Promise that resolves when DOM is ready
 */
export function ready() {
  return new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}
