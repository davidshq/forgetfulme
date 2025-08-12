import { describe, it, expect } from 'vitest';
import { normalizeUrl, domainOf } from '../../src/utils/url.js';

describe('url utils', () => {
  it('normalizes hash and hostname', () => {
    const input = 'https://Example.com/Path/#section';
    const out = normalizeUrl(input);
    expect(out).toBe('https://example.com/Path/');
  });

  it('trims extra trailing slashes', () => {
    const input = 'https://example.com/foo//';
    const out = normalizeUrl(input);
    expect(out).toBe('https://example.com/foo/');
  });

  it('extracts domain in lowercase', () => {
    expect(domainOf('HTTPS://Sub.Example.COM/path')).toBe('sub.example.com');
  });
});

