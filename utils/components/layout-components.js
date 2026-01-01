/**
 * @fileoverview Layout component creation utilities
 * @module components/layout-components
 * @description Provides layout creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Create a responsive layout container
 * @param {string} className - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createLayoutContainer(className = '') {
  const container = document.createElement('div');
  container.className = `container ${className}`.trim();
  return container;
}

/**
 * Create a sidebar layout
 * @param {HTMLElement} sidebar - Sidebar content
 * @param {HTMLElement} main - Main content
 * @param {Object} options - Layout options
 * @returns {HTMLElement}
 */
export function createSidebarLayout(sidebar, main, options = {}) {
  const layout = document.createElement('div');
  layout.className = `sidebar-layout ${options.className || ''}`.trim();

  // Create sidebar container
  const sidebarContainer = document.createElement('aside');
  sidebarContainer.className = 'sidebar';
  sidebarContainer.appendChild(sidebar);
  layout.appendChild(sidebarContainer);

  // Create main content container
  const mainContainer = document.createElement('main');
  mainContainer.className = 'main-content';
  mainContainer.appendChild(main);
  layout.appendChild(mainContainer);

  return layout;
}

/**
 * Create a grid layout with Pico CSS classes
 * @param {Array} items - Grid items
 * @param {Object} options - Grid options
 * @returns {HTMLElement}
 */
export function createGrid(items, options = {}) {
  const grid = document.createElement('div');

  // Use Pico's grid system with responsive classes
  let gridClass = 'grid';
  if (options.columns) {
    gridClass += ` grid-${options.columns}`;
  }
  if (options.gap) {
    gridClass += ` gap-${options.gap}`;
  }
  grid.className = `${gridClass} ${options.className || ''}`.trim();

  items.forEach(item => {
    const gridItem = document.createElement('div');
    // Use Pico's grid item styling
    gridItem.className = `grid-item ${item.className || ''}`.trim();

    // Support for complex content (not just text)
    if (typeof item === 'string') {
      gridItem.textContent = item;
    } else if (item.content) {
      gridItem.innerHTML = item.content;
    } else if (item.text) {
      gridItem.textContent = item.text;
    }

    grid.appendChild(gridItem);
  });

  return grid;
}
