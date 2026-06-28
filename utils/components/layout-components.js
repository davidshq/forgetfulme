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
