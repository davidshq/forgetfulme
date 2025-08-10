/**
 * @fileoverview Unit tests for DOM utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  $,
  $$,
  addEventListener,
  show,
  hide,
  toggle,
  setText,
  setHTML,
  setTrustedHTML,
  clearElement,
  toggleClass,
  createElement,
  getFormData,
  setFormData,
  ready
} from '../../../src/utils/dom.js';

describe('utils/dom', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="root">
        <div id="a" class="hidden" hidden></div>
        <div id="b"></div>
        <form id="test-form">
          <input type="text" name="title" value="hello" />
          <input type="checkbox" name="flag" />
          <input type="radio" name="choice" value="x" />
          <input type="radio" name="choice" value="y" />
        </form>
      </div>
    `;
  });

  it('$ and $$ should query elements safely', () => {
    const el = $('#a');
    const list = $$('#root div');
    expect(el).toBeInstanceOf(HTMLElement);
    expect(list.length).toBeGreaterThan(0);
  });

  it('addEventListener should attach and cleanup listeners', () => {
    const el = $('#b');
    const handler = vi.fn();
    const cleanup = addEventListener(el, 'click', handler);

    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('show/hide/toggle should control visibility', () => {
    const a = $('#a');
    const b = $('#b');

    show(a);
    expect(a.classList.contains('hidden')).toBe(false);
    expect(a.hasAttribute('hidden')).toBe(false);

    hide(b);
    expect(b.classList.contains('hidden')).toBe(true);

    toggle(b);
    expect(b.classList.contains('hidden')).toBe(false);
    toggle(b, false);
    expect(b.classList.contains('hidden')).toBe(true);
    toggle(b, true);
    expect(b.classList.contains('hidden')).toBe(false);
  });

  it('setText should set text content safely', () => {
    const b = $('#b');
    setText(b, 'Hello');
    expect(b.textContent).toBe('Hello');
    setText(b, '');
    expect(b.textContent).toBe('');
  });

  it('setHTML should escape by default and allow trusted HTML when flagged', () => {
    const b = $('#b');
    setHTML(b, '<span>Hi</span>');
    expect(b.innerHTML).toBe('&lt;span&gt;Hi&lt;/span&gt;');
    setHTML(b, '<span>Hi</span>', true);
    expect(b.innerHTML).toBe('<span>Hi</span>');
    setHTML(b, null);
    expect(b.innerHTML).toBe('');
  });

  it('setTrustedHTML should warn on suspicious HTML and fallback to text', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const b = $('#b');

    setTrustedHTML(b, '<div><strong>Safe</strong></div>');
    expect(b.innerHTML).toBe('<div><strong>Safe</strong></div>');

    setTrustedHTML(b, '<div onclick="alert(1)">X</div>');
    expect(warnSpy).toHaveBeenCalled();
    expect(b.textContent).toContain('<div onclick="alert(1)">');

    warnSpy.mockRestore();
  });

  it('clearElement should empty content', () => {
    const b = $('#b');
    b.innerHTML = '<i>text</i>';
    clearElement(b);
    expect(b.innerHTML).toBe('');
  });

  it('toggleClass should add or remove class', () => {
    const b = $('#b');
    toggleClass(b, 'x', true);
    expect(b.classList.contains('x')).toBe(true);
    toggleClass(b, 'x', false);
    expect(b.classList.contains('x')).toBe(false);
  });

  it('createElement should build element with attributes and content', () => {
    const child = document.createElement('span');
    child.textContent = 'child';
    const el = createElement('div', { className: 'c1', dataset: { id: '42' } }, [child]);
    expect(el.className).toBe('c1');
    expect(el.dataset.id).toBe('42');
    expect(el.querySelector('span')?.textContent).toBe('child');
  });

  it('getFormData should extract values and setFormData should populate fields', () => {
    const form = document.getElementById('test-form');
    const data = getFormData(form);
    expect(data).toMatchObject({ title: 'hello' });

    setFormData(form, { title: 'updated', flag: true, choice: 'y' });
    const inputs = form.elements;
    expect(inputs.title.value).toBe('updated');
    expect(inputs.flag.checked).toBe(true);
    const selected = form.querySelector('input[name="choice"]:checked');
    expect(selected?.value).toBe('y');
  });

  it('ready should resolve when DOM is ready', async () => {
    await expect(ready()).resolves.toBeUndefined();
  });
});


