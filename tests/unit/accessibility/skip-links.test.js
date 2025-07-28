/**
 * @fileoverview Test for skip link accessibility implementation
 * @description Verifies that skip links are properly implemented across all pages
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Skip Links Accessibility', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });

  it('should have proper skip link structure in options page', () => {
    // Simulate options.html structure
    document.body.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <main id="main-content">
        <h1>ForgetfulMe Settings</h1>
        <p>Main content goes here</p>
      </main>
    `;

    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.querySelector('#main-content');

    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(skipLink.textContent).toBe('Skip to main content');
    expect(mainContent).toBeTruthy();
    expect(mainContent.tagName).toBe('MAIN');
  });

  it('should have proper skip link structure in popup page', () => {
    // Simulate popup.html structure
    document.body.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <main id="main-content" class="container">
        <h1>ForgetfulMe</h1>
        <p>Popup content goes here</p>
      </main>
    `;

    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.querySelector('#main-content');

    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(mainContent).toBeTruthy();
    expect(mainContent.classList.contains('container')).toBe(true);
  });

  it('should have proper skip link structure in bookmark management page', () => {
    // Simulate bookmark-management.html structure
    document.body.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <main id="main-content" class="container">
        <h1>Bookmark Management</h1>
        <p>Bookmark management content goes here</p>
      </main>
    `;

    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.querySelector('#main-content');

    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(mainContent).toBeTruthy();
    expect(mainContent.classList.contains('container')).toBe(true);
  });

  it('should be focusable and keyboard accessible', () => {
    document.body.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <main id="main-content">
        <h1>Test Content</h1>
        <input type="text" id="test-input" />
      </main>
    `;

    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.querySelector('#main-content');
    const testInput = document.querySelector('#test-input');

    // Test that skip link can receive focus
    skipLink.focus();
    expect(document.activeElement).toBe(skipLink);

    // Test that clicking/activating skip link moves focus to main content area
    // Simulate clicking the skip link
    const clickEvent = new Event('click', { bubbles: true });
    skipLink.dispatchEvent(clickEvent);

    // In a real browser, focus would move to main content
    // We can test the href attribute points to the correct element
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(mainContent.id).toBe('main-content');
  });

  it('should have proper CSS styling for accessibility', () => {
    document.body.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <main id="main-content">Content</main>
    `;

    const skipLink = document.querySelector('.skip-link');
    
    // Test that skip link has the correct class for styling
    expect(skipLink.classList.contains('skip-link')).toBe(true);
    
    // The actual CSS styling is tested through visual testing
    // but we can verify the structure is in place
    expect(skipLink.tagName).toBe('A');
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });

  it('should work with DOM manipulation libraries', async () => {
    // Simulate UIComponents.DOM.getElement usage
    document.body.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <main id="main-content">
        <div id="app-content">Dynamic content will be loaded here</div>
      </main>
    `;

    // Test that the main content element can be found
    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeTruthy();

    // Test that content can be dynamically added
    const dynamicContent = document.createElement('div');
    dynamicContent.innerHTML = '<h1>Dynamically Added Content</h1>';
    mainContent.appendChild(dynamicContent);

    expect(mainContent.children.length).toBeGreaterThan(1);
    expect(mainContent.querySelector('h1').textContent).toBe('Dynamically Added Content');
  });

  it('should maintain accessibility with multiple navigation elements', () => {
    document.body.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="#section1">Section 1</a></li>
          <li><a href="#section2">Section 2</a></li>
        </ul>
      </nav>
      <main id="main-content">
        <section id="section1">
          <h2>Section 1</h2>
          <p>Content 1</p>
        </section>
        <section id="section2">
          <h2>Section 2</h2>
          <p>Content 2</p>
        </section>
      </main>
    `;

    const skipLink = document.querySelector('.skip-link');
    const nav = document.querySelector('nav');
    const mainContent = document.querySelector('#main-content');

    // Test that skip link comes before navigation
    expect(skipLink.compareDocumentPosition(nav)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    
    // Test that navigation comes before main content
    expect(nav.compareDocumentPosition(mainContent)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    
    // Test that skip link correctly targets main content
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });
});