/**
 * @fileoverview Utility component creation utilities
 * @module components/utility-components
 * @description Provides progress, loading, status, tabs, and tooltip creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { createButton } from './button-components.js';

/**
 * Create a Pico progress indicator (indeterminate)
 * @param {string} ariaLabel - ARIA label for accessibility
 * @param {string} className - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createProgressIndicator(ariaLabel = 'Loading', className = '') {
  const progress = document.createElement('progress');
  progress.setAttribute('aria-label', ariaLabel);
  progress.className = className.trim();
  // Indeterminate progress (no value attribute)
  return progress;
}

/**
 * Create a Pico progress bar with specific value
 * @param {number} value - Progress value (0-100)
 * @param {number} max - Maximum value (default: 100)
 * @param {string} ariaLabel - ARIA label for accessibility
 * @param {string} className - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createProgressBar(value, max = 100, ariaLabel = 'Progress', className = '') {
  const progress = document.createElement('progress');
  progress.value = Math.min(Math.max(value, 0), max);
  progress.max = max;
  progress.setAttribute('aria-label', ariaLabel);
  progress.className = className.trim();
  return progress;
}

/**
 * Create a loading state with Pico progress indicator
 * @param {string} text - Loading text
 * @param {string} className - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createLoadingState(text = 'Loading...', className = '') {
  const container = document.createElement('div');
  container.className = `loading-state ${className}`.trim();

  const progress = createProgressIndicator('Loading', 'loading-progress');
  container.appendChild(progress);

  if (text && text.trim()) {
    const textEl = document.createElement('div');
    textEl.className = 'loading-text';
    textEl.textContent = text;
    container.appendChild(textEl);
  }

  return container;
}

/**
 * Set busy state on an element using Pico's aria-busy attribute
 * @param {HTMLElement} element - Element to set busy state on
 * @param {boolean} isBusy - Whether element is busy
 */
export function setBusyState(element, isBusy) {
  if (isBusy) {
    element.setAttribute('aria-busy', 'true');
  } else {
    element.removeAttribute('aria-busy');
  }
}

/**
 * Create a status indicator
 * @param {string} status - Status type
 * @param {string} text - Status text
 * @param {string} className - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createStatusIndicator(status, text, className = '') {
  const indicator = document.createElement('div');
  indicator.className = `status-indicator status-${status} ${className}`.trim();

  const icon = document.createElement('span');
  icon.className = 'status-icon';

  // Set appropriate icon based on status
  switch (status) {
    case 'success':
      icon.textContent = '✓';
      break;
    case 'error':
      icon.textContent = '✗';
      break;
    case 'warning':
      icon.textContent = '⚠';
      break;
    case 'info':
      icon.textContent = 'ℹ';
      break;
    default:
      icon.textContent = '•';
  }

  const textEl = document.createElement('span');
  textEl.className = 'status-text';
  textEl.textContent = text;

  indicator.appendChild(icon);
  indicator.appendChild(textEl);

  return indicator;
}

/**
 * Create a tabbed interface
 * @param {Array} tabs - Tab configurations
 * @param {Object} _options - Tab options (unused)
 * @returns {HTMLElement}
 */
export function createTabs(tabs, _options = {}) {
  const tabContainer = document.createElement('div');
  tabContainer.className = 'tab-container';

  const tabList = document.createElement('div');
  tabList.className = 'tab-list';

  const tabContent = document.createElement('div');
  tabContent.className = 'tab-content';

  tabs.forEach((tab, index) => {
    const tabButton = createButton(
      tab.title,
      () => switchTab(tabContainer, index),
      `tab-button ${index === 0 ? 'active' : ''}`,
    );
    tabList.appendChild(tabButton);

    const tabPanel = document.createElement('div');
    tabPanel.className = `tab-panel ${index === 0 ? 'active' : ''}`;
    tabPanel.innerHTML = tab.content;
    tabContent.appendChild(tabPanel);
  });

  tabContainer.appendChild(tabList);
  tabContainer.appendChild(tabContent);

  return tabContainer;
}

/**
 * Switch between tabs
 * @param {HTMLElement} tabContainer - Tab container
 * @param {number} activeIndex - Index of active tab
 */
export function switchTab(tabContainer, activeIndex) {
  const buttons = tabContainer.querySelectorAll('.tab-button');
  const panels = tabContainer.querySelectorAll('.tab-panel');

  buttons.forEach((button, index) => {
    button.classList.toggle('active', index === activeIndex);
  });

  panels.forEach((panel, index) => {
    panel.classList.toggle('active', index === activeIndex);
  });
}

/**
 * Create a tooltip
 * @param {HTMLElement} element - Element to attach tooltip to
 * @param {string} text - Tooltip text
 * @param {Object} options - Tooltip options
 */
export function createTooltip(element, text, options = {}) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = text;

  element.addEventListener('mouseenter', () => {
    document.body.appendChild(tooltip);
    positionTooltip(element, tooltip, options);
  });

  element.addEventListener('mouseleave', () => {
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  });
}

/**
 * Position a tooltip relative to an element
 * @param {HTMLElement} element - Target element
 * @param {HTMLElement} tooltip - Tooltip element
 * @param {Object} options - Positioning options
 */
export function positionTooltip(element, tooltip, options = {}) {
  const rect = element.getBoundingClientRect();
  const position = options.position || 'top';

  let top, left;

  switch (position) {
    case 'top':
      top = rect.top - tooltip.offsetHeight - 5;
      left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
      break;
    case 'bottom':
      top = rect.bottom + 5;
      left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2;
      left = rect.left - tooltip.offsetWidth - 5;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2;
      left = rect.right + 5;
      break;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}
