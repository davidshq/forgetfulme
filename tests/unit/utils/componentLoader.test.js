/**
 * @fileoverview Unit tests for componentLoader utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { loadHTMLComponent, loadHTMLComponents } from '../../../src/utils/componentLoader.js';

const setupDOM = () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="target-container"></div>
        <div id="second-container"></div>
      </body>
    </html>
  `);

  global.window = dom.window;
  global.document = dom.window.document;
  global.fetch = vi.fn();

  return dom;
};

describe('componentLoader', () => {
  let dom;

  beforeEach(() => {
    dom = setupDOM();
  });

  afterEach(() => {
    dom?.window.close();
    vi.resetAllMocks();
  });

  describe('loadHTMLComponent', () => {
    it('should load and inject HTML content', async () => {
      const mockHTML = '<div class="test-component">Test Component</div>';
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHTML)
      });

      const result = await loadHTMLComponent('chrome-extension://test/test.html', '#target-container');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('chrome-extension://test/test.html');
      
      const container = document.getElementById('target-container');
      expect(container.innerHTML).toBe(mockHTML);
    });

    it('should reject non-chrome-extension URLs for security', async () => {
      const result = await loadHTMLComponent('https://evil.com/malicious.html', '#target-container');

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false on fetch error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });

      const result = await loadHTMLComponent('chrome-extension://test/missing.html', '#target-container');

      expect(result).toBe(false);
    });

    it('should return false when target not found', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>Test</div>')
      });

      const result = await loadHTMLComponent('chrome-extension://test/test.html', '#nonexistent');

      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await loadHTMLComponent('chrome-extension://test/test.html', '#target-container');

      expect(result).toBe(false);
    });
  });

  describe('loadHTMLComponents', () => {
    it('should load multiple components', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<div>Component 1</div>')
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<div>Component 2</div>')
        });

      const components = [
        { url: 'chrome-extension://test/comp1.html', targetSelector: '#target-container' },
        { url: 'chrome-extension://test/comp2.html', targetSelector: '#second-container' }
      ];

      const result = await loadHTMLComponents(components);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should return false if any component fails', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('<div>OK</div>') })
        .mockResolvedValueOnce({ ok: false, statusText: 'Error' });

      const components = [
        { url: 'chrome-extension://test/comp1.html', targetSelector: '#target-container' },
        { url: 'chrome-extension://test/comp2.html', targetSelector: '#second-container' }
      ];

      const result = await loadHTMLComponents(components);

      expect(result).toBe(false);
    });
  });
});