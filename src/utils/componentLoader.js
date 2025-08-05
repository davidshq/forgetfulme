/**
 * @fileoverview Utility for loading HTML components into the DOM
 */

/* global DOMParser */

/**
 * Load an HTML component from a URL and inject it into the DOM
 * @param {string} url - URL of the HTML component
 * @param {string} targetSelector - CSS selector where to inject the component
 * @param {string} position - Where to inject: 'beforeend', 'afterbegin', 'beforebegin', 'afterend'
 * @returns {Promise<boolean>} - True if loaded successfully
 */
export async function loadHTMLComponent(url, targetSelector, position = 'beforeend') {
  try {
    // Security: Only allow chrome-extension:// URLs to prevent external content injection
    if (!url.startsWith('chrome-extension://')) {
      throw new Error('Only chrome-extension URLs are allowed for security');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load component: ${response.statusText}`);
    }

    const html = await response.text();
    const target = document.querySelector(targetSelector);

    if (!target) {
      console.error(`Target element not found: ${targetSelector}`);
      return false;
    }

    // Security: Use DOMParser to safely parse HTML without executing scripts
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Create document fragment from parsed content
    const fragment = document.createDocumentFragment();

    // Only take content from body, or fallback to empty if no body
    if (doc.body && doc.body.children.length > 0) {
      // Clone nodes to avoid moving them from the parsed document
      for (const child of Array.from(doc.body.children)) {
        fragment.appendChild(child.cloneNode(true));
      }
    } else {
      // If no body or body is empty, treat as empty component
      console.warn('Component has no body content or body is empty');
    }

    // Insert based on position
    switch (position) {
      case 'beforeend':
        target.appendChild(fragment);
        break;
      case 'afterbegin':
        target.insertBefore(fragment, target.firstChild);
        break;
      case 'beforebegin':
        if (target.parentNode && target.parentNode.nodeType === Node.ELEMENT_NODE) {
          target.parentNode.insertBefore(fragment, target);
        } else {
          console.warn('Invalid parentNode for beforebegin, falling back to appendChild');
          target.appendChild(fragment);
        }
        break;
      case 'afterend':
        if (target.parentNode && target.parentNode.nodeType === Node.ELEMENT_NODE) {
          const nextSibling = target.nextSibling;
          target.parentNode.insertBefore(fragment, nextSibling);
        } else {
          console.warn('Invalid parentNode for afterend, falling back to appendChild');
          target.appendChild(fragment);
        }
        break;
      default:
        target.appendChild(fragment);
    }

    return true;
  } catch (error) {
    console.error('Error loading HTML component:', error);
    return false;
  }
}

/**
 * Load multiple HTML components
 * @param {Array<Object>} components - Array of components to load
 * @param {string} components[].url - URL of the component
 * @param {string} components[].targetSelector - Target selector
 * @param {string} [components[].position] - Position to inject
 * @returns {Promise<boolean>} - True if all components loaded successfully
 */
export async function loadHTMLComponents(components) {
  const results = await Promise.all(
    components.map(component =>
      loadHTMLComponent(component.url, component.targetSelector, component.position)
    )
  );

  return results.every(result => result === true);
}
