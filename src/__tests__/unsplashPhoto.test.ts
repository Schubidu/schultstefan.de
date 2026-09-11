import { describe, expect, it } from 'vitest';

import type { ImageType } from '../types';
import { fetchImageDataFrom, selectPhotoId, type ImageRegistry } from '../unsplashPhoto';

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

  it('selects an unseen image', () => {
    expect(selectPhotoId(images, ['img1'], () => 0)).toEqual({ id: 'img2', seenIds: ['img1', 'img2'] });
  });

  it('ignores seen ids that are no longer in the registry', () => {
    expect(selectPhotoId(images, ['removed'], () => 0)).toEqual({ id: 'img1', seenIds: ['img1'] });
  });

  it('starts a new cycle after every image has been seen', () => {
    expect(selectPhotoId(images, ['img1', 'img2', 'img3'], () => 0, 'img3')).toEqual({
      id: 'img1',
      seenIds: ['img1'],
    });
  });

  it('does not immediately repeat the current image when a new cycle starts', () => {
    expect(selectPhotoId(images, ['img1', 'img2', 'img3'], () => 0, 'img1')?.id).toBe('img2');
  });

  it('keeps the only image available when a new cycle starts', () => {
    const singleImage: ImageRegistry = { img1: imageLoader };

    expect(selectPhotoId(singleImage, ['img1'], () => 0, 'img1')).toEqual({ id: 'img1', seenIds: ['img1'] });
  });

  it('returns null when no image is available', () => {
    const emptyImages: ImageRegistry = {};

    expect(selectPhotoId(emptyImages, [], () => 0)).toBeNull();
  });
});
