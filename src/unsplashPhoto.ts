import fallbackImages from './fallback-images';
import queryParser from './queryParser';
import type { ImageType } from './types';
import asyncImages from './unsplash-images';

export type ImageLoader = () => Promise<ImageType>;

export type ImageRegistry = Readonly<Record<string, ImageLoader>>;

const imageRegistry: ImageRegistry = {
  ...fallbackImages,
  ...asyncImages,
};

export async function fetchImageDataFrom(registry: ImageRegistry, id: string): Promise<ImageType['default'] | null> {
  const loader = registry[id];

  if (!loader) {
    return null;
  }

  const { default: data } = await loader();

  return data;
}

export function hasImageIn(registry: ImageRegistry, id: string | null): id is string {
  return id !== null && Object.prototype.hasOwnProperty.call(registry, id);
}

export function getRandomImageFrom(
  registry: ImageRegistry,
  random: () => number = Math.random,
  excludedId: string | null = null
): string | null {
  const keys = Object.keys(registry);
  const candidates = keys.length > 1 && excludedId ? keys.filter((key) => key !== excludedId) : keys;

  if (candidates.length === 0) {
    return null;
  }

  const index = Math.floor(random() * candidates.length);

  return candidates[index] ?? null;
}

export function readRequestedPhoto(query: URLSearchParams): string | null {
  return query.get('photo') ?? query.get('photos');
}

function writeCanonicalPhotoUrl(id: string): void {
  const url = new URL(window.location.href);

  url.searchParams.delete('photos');
  url.searchParams.set('photo', id);
  window.history.replaceState({ path: url.toString() }, '', url);
}

async function loadPhoto(id: string): Promise<ImageType['default'] | null> {
  const photo = await fetchImageDataFrom(imageRegistry, id);

  if (photo) {
    writeCanonicalPhotoUrl(id);
  }

  return photo;
}

export async function getInitialPhoto(): Promise<ImageType['default'] | null> {
  const query = queryParser();
  const requestedPhoto = readRequestedPhoto(query);
  const id = hasImageIn(imageRegistry, requestedPhoto) ? requestedPhoto : getRandomImageFrom(imageRegistry);

  if (!id) {
    return null;
  }

  return loadPhoto(id);
}

export async function getNextPhoto(currentId: string): Promise<ImageType['default'] | null> {
  const id = getRandomImageFrom(imageRegistry, Math.random, currentId);

  if (!id) {
    return null;
  }

  return loadPhoto(id);
}
