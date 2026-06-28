/**
 * @fileoverview Unit tests for download helpers
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadJson } from '../../utils/download.js';

describe('downloadJson', () => {
  let appendChildSpy;
  let removeChildSpy;
  let clickSpy;
  let revokeObjectURLSpy;

  beforeEach(() => {
    appendChildSpy = vi.spyOn(document.body, 'appendChild');
    removeChildSpy = vi.spyOn(document.body, 'removeChild');
    revokeObjectURLSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('creates a JSON blob download and cleans up', () => {
    downloadJson({ bookmarks: [] }, 'forgetfulme-export-2026-06-28.json');

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });
});
