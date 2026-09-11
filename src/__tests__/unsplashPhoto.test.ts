import { describe, expect, it } from 'vitest';

import type { ImageType } from '../types';
import { fetchImageDataFrom, getRandomImageFrom, hasImageIn, type ImageRegistry } from '../unsplashPhoto';

const image: ImageType['default'] = {
  id: 'img1',
  color: '#000000',
  blurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  urls: {
    raw: 'https://example.test/raw',
    full: 'https://example.test/full',
    regular: 'https://example.test/regular',
    small: 'https://example.test/small',
    thumb: 'https://example.test/thumb',
  },
  user: {
    name: 'Example Photographer',
    links: {
      html: 'https://example.test/photographer',
    },
  },
};

const imageLoader = async (): Promise<ImageType> => ({ default: image });

const images: ImageRegistry = {
  img1: imageLoader,
  img2: imageLoader,
  img3: imageLoader,
};

describe('image registry helpers', () => {
  it('returns null when an image is missing', async () => {
    const result = await fetchImageDataFrom(images, 'missing');

    expect(result).toBeNull();
  });

  it('returns data for an existing image', async () => {
    const result = await fetchImageDataFrom(images, 'img1');

    expect(result).toEqual(image);
  });

  it('reports existing and missing image ids', () => {
    expect(hasImageIn(images, 'img1')).toBe(true);
    expect(hasImageIn(images, 'missing')).toBe(false);
    expect(hasImageIn(images, null)).toBe(false);
  });

  it('selects an image from the registry without module mocking', () => {
    expect(getRandomImageFrom(images, () => 0)).toBe('img1');
    expect(getRandomImageFrom(images, () => 0.5)).toBe('img2');
    expect(getRandomImageFrom(images, () => 0.99)).toBe('img3');
  });

  it('returns null when no image is available', () => {
    const emptyImages: ImageRegistry = {};

    expect(getRandomImageFrom(emptyImages, () => 0)).toBeNull();
  });
});
