import { describe, expect, it } from 'vitest';

import fallbackImages from '../fallback-images';
import type { ImageType } from '../types';
import {
  fetchImageDataFrom,
  getRandomImageFrom,
  hasImageIn,
  readRequestedPhoto,
  type ImageRegistry,
} from '../unsplashPhoto';

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
  it('ships fallback photos for builds without an Unsplash secret', async () => {
    const ids = Object.keys(fallbackImages);

    expect(ids.length).toBeGreaterThanOrEqual(2);

    const firstId = ids[0];

    expect(firstId).toBeDefined();

    if (!firstId) {
      return;
    }

    const fallbackPhoto = await fetchImageDataFrom(fallbackImages, firstId);

    expect(fallbackPhoto?.id).toBe(firstId);
  });

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

  it('avoids immediately repeating the current image when alternatives exist', () => {
    expect(getRandomImageFrom(images, () => 0, 'img1')).toBe('img2');
  });

  it('keeps the only image available even when it is excluded', () => {
    const singleImage: ImageRegistry = { img1: imageLoader };

    expect(getRandomImageFrom(singleImage, () => 0, 'img1')).toBe('img1');
  });

  it('returns null when no image is available', () => {
    const emptyImages: ImageRegistry = {};

    expect(getRandomImageFrom(emptyImages, () => 0)).toBeNull();
  });

  it('prefers the canonical photo query parameter', () => {
    expect(readRequestedPhoto(new URLSearchParams('photo=canonical&photos=legacy'))).toBe('canonical');
  });

  it('accepts the legacy photos query parameter', () => {
    expect(readRequestedPhoto(new URLSearchParams('photos=legacy'))).toBe('legacy');
  });
});
