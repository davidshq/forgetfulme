/**
 * @fileoverview Card UI component mocks
 * @module mocks/ui-components-cards
 * @description Card-related UI component mocks
 */

import { vi } from 'vitest';

/**
 * Creates card UI component mocks
 * @param {Object} document - Mock document object
 * @returns {Object} Card component mocks
 */
export const createCardComponents = document => ({
  createSection: vi.fn((title, className, options) => {
    const element = options?.useCard
      ? document.createElement('article')
      : document.createElement('section');
    element.className = `section ${className || ''}`.trim();
    if (title) {
      if (options?.useCard) {
        const header = document.createElement('header');
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        header.appendChild(titleElement);
        element.appendChild(header);
      } else {
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        element.appendChild(titleElement);
      }
    }
    return element;
  }),
  createCard: vi.fn((title, content, footer, className) => {
    const card = document.createElement('article');
    card.className = `card ${className || ''}`.trim();
    if (title) {
      const header = document.createElement('header');
      const titleElement = document.createElement('h3');
      titleElement.textContent = title;
      header.appendChild(titleElement);
      card.appendChild(header);
    }
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = content;
    card.appendChild(contentDiv);
    if (footer) {
      const footerElement = document.createElement('footer');
      footerElement.innerHTML = footer;
      card.appendChild(footerElement);
    }
    return card;
  }),
  createCardWithActions: vi.fn((title, content, actions) => {
    const card = document.createElement('article');
    card.className = 'card';
    if (title) {
      const header = document.createElement('header');
      const titleElement = document.createElement('h3');
      titleElement.textContent = title;
      header.appendChild(titleElement);
      card.appendChild(header);
    }
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = content;
    card.appendChild(contentDiv);
    if (actions && actions.length > 0) {
      const footer = document.createElement('footer');
      footer.className = 'card-actions';
      actions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.text;
        button.className = action.className || 'secondary';
        footer.appendChild(button);
      });
      card.appendChild(footer);
    }
    return card;
  }),
  createFormCard: vi.fn((title, formFields, onSubmit, submitText, className) => {
    const card = document.createElement('article');
    card.className = `card form-card ${className || ''}`.trim();
    if (title) {
      const header = document.createElement('header');
      const titleElement = document.createElement('h3');
      titleElement.textContent = title;
      header.appendChild(titleElement);
      card.appendChild(header);
    }
    const form = document.createElement('form');
    form.className = 'card-form';
    card.appendChild(form);
    return card;
  }),
  createListCard: vi.fn((title, items, options, className) => {
    const card = document.createElement('article');
    card.className = `card list-card ${className || ''}`.trim();
    if (title) {
      const header = document.createElement('header');
      const titleElement = document.createElement('h3');
      titleElement.textContent = title;
      header.appendChild(titleElement);
      card.appendChild(header);
    }
    const listContainer = document.createElement('div');
    listContainer.className = 'card-list';
    items.forEach(item => {
      const listItem = document.createElement('div');
      listItem.className = 'list-item';
      if (item.title) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'item-title';
        titleDiv.textContent = item.title;
        listItem.appendChild(titleDiv);
      }
      listContainer.appendChild(listItem);
    });
    card.appendChild(listContainer);
    return card;
  }),
});
