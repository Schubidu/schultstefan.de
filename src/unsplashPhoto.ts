import queryParser from './queryParser';
import type { ImageType } from './types';
import asyncImages from './unsplash-images';

export type ImageLoader = () => Promise<ImageType>;

export type ImageRegistry = Readonly<Record<string, ImageLoader>>;

const imageRegistry: ImageRegistry = asyncImages;

export async function fetchImageDataFrom(
  registry: ImageRegistry,
  id: string
): Promise<ImageType['default'] | null> {
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

export function getRandomImageFrom(registry: ImageRegistry, random: () => number = Math.random): string | null {
  const keys = Object.keys(registry);

  if (keys.length === 0) {
    return null;
  }

  const index = Math.floor(random() * keys.length);

  return keys[index] ?? null;
}

export function fetchImageData(id: string): Promise<ImageType['default'] | null> {
  return fetchImageDataFrom(imageRegistry, id);
}

export function hasImage(id: string | null): id is string {
  return hasImageIn(imageRegistry, id);
}

export function getRandomImage(): string | null {
  return getRandomImageFrom(imageRegistry);
}

export default async function unsplashPhoto(): Promise<ImageType['default'] | null> {
  const query = queryParser();
  const requestedPhoto = query.get('photos');
  const availablePhoto = hasImage(requestedPhoto);
  const photo = availablePhoto ? requestedPhoto : getRandomImage();

  if (!photo) {
    return null;
  }

  query.set('photos', photo);

  if (!availablePhoto) {
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${query.toString()}`;

    window.history.pushState({ path: newUrl }, '', newUrl);
  }

  return fetchImageData(photo);
}
