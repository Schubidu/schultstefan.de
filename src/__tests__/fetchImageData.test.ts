import { describe, expect, it, vi } from 'vitest';

vi.mock('../unsplash-images', () => ({
  default: {
    img1: vi.fn(async () => ({ foo: 'bar' })),
  },
}));

import { fetchImageData, hasImage } from '../unplashPhoto';

describe('fetchImageData', () => {
  it('returns null when image is missing', async () => {
    const result = await fetchImageData('missing' as any);
    expect(result).toBeNull();
  });

  it('returns data for existing image', async () => {
    const result = await fetchImageData('img1' as any);
    expect(result).toEqual({ foo: 'bar' });
  });
});

describe('hasImage', () => {
  it('reports existing keys', async () => {
    const result = await hasImage('img1' as any);
    expect(result).toBe(true);
  });

  it('reports missing keys', async () => {
    const result = await hasImage('missing' as any);
    expect(result).toBe(false);
  });
});
