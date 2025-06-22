import { describe, expect, it, vi } from 'vitest';

vi.mock('../unsplash-images', () => ({
  default: {
    img1: vi.fn(),
    img2: vi.fn(),
    img3: vi.fn(),
  },
}));

import { getRandomImage } from '../unplashPhoto';

const keys = ['img1', 'img2', 'img3'] as const;

describe('getRandomImage', () => {
  it('returns a valid image key', () => {
    const result = getRandomImage();
    expect(keys).toContain(result);
  });
});
