/**
 * @fileoverview Layout UI component mocks
 * @module mocks/ui-components-layout
 * @description Layout component mocks matching the public UIComponents facade
 */

import { vi } from 'vitest';

/**
 * Creates layout UI component mocks
 * @param {Object} document - Mock document object
 * @returns {Object} Layout component mocks
 */
export const createLayoutComponents = document => ({
  createGrid: vi.fn((items, options = {}) => {
    const grid = document.createElement('div');

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
      gridItem.className = `grid-item ${item.className || ''}`.trim();

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
  }),
});
