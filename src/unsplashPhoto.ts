import type { ImageType } from './types';
import images from './unsplash-images';

export type ImageLoader = () => Promise<ImageType>;

export type ImageRegistry = Readonly<Record<string, ImageLoader>>;

export interface PhotoSelection {
  readonly id: string;
  readonly seenIds: readonly string[];
}

const SEEN_PHOTO_IDS_KEY = 'schultstefan.seen-photo-ids';

const imageRegistry = images;

export async function fetchImageDataFrom(registry: ImageRegistry, id: string): Promise<ImageType['default'] | null> {
  const loader = registry[id];

  if (!loader) {
    return null;
  }

  const { default: data } = await loader();

  return data;
}

export function selectPhotoId(
  registry: ImageRegistry,
  seenIds: readonly string[],
  random: () => number = Math.random,
  excludedId: string | null = null
): PhotoSelection | null {
  const ids = Object.keys(registry);

  if (ids.length === 0) {
    return null;
  }

  const currentIds = new Set(ids);
  const validSeenIds = seenIds.filter((id) => currentIds.has(id));
  let candidates = ids.filter((id) => !validSeenIds.includes(id) && id !== excludedId);
  let nextSeenIds = validSeenIds;

  if (candidates.length === 0) {
    candidates = ids.filter((id) => id !== excludedId);

    if (candidates.length === 0) {
      candidates = ids;
    }

    nextSeenIds = [];
  }

  const index = Math.floor(random() * candidates.length);
  const id = candidates[index];

  if (!id) {
    return null;
  }

  return { id, seenIds: [...nextSeenIds, id] };
}

function readSeenPhotoIds(): string[] {
  try {
    const stored = window.localStorage.getItem(SEEN_PHOTO_IDS_KEY);

    return stored ? stored.split(',').filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeSeenPhotoIds(ids: readonly string[]): void {
  try {
    window.localStorage.setItem(SEEN_PHOTO_IDS_KEY, ids.join(','));
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

async function selectPhoto(excludedId: string | null = null): Promise<ImageType['default'] | null> {
  const selection = selectPhotoId(imageRegistry, readSeenPhotoIds(), Math.random, excludedId);

  if (!selection) {
    return null;
  }

  writeSeenPhotoIds(selection.seenIds);

  return fetchImageDataFrom(imageRegistry, selection.id);
}

export async function getInitialPhoto(): Promise<ImageType['default'] | null> {
  return selectPhoto();
}

export async function getNextPhoto(currentId: string): Promise<ImageType['default'] | null> {
  return selectPhoto(currentId);
}
