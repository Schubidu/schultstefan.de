import queryParser from './queryParser';
import type { ImageType } from './types';
// eslint-disable-next-line import/no-unresolved
import asyncImages from './unsplash-images';

type ImageId = keyof typeof asyncImages;

export async function fetchImageData(id: ImageId): Promise<ImageType['default'] | null> {
  if (!asyncImages[id]) return null;
  const { default: data }: ImageType = await asyncImages[id]();
  return data;
}

export const hasImage = async (id: ImageId) => Object.keys(asyncImages).includes(id);

export function getRandomImage(): ImageId {
  const keys = Object.keys(asyncImages);

  return keys[Math.floor(Math.random() * keys.length)] as ImageId;
}

export const getRandomImageData = async () => {
  const keys = Object.keys(asyncImages);

  const randomKey = keys[Math.floor(Math.random() * keys.length)] as unknown as ImageId;

  return fetchImageData(randomKey);
};

export default async function unsplashPhoto(): Promise<ImageType['default'] | null> {
  const query = queryParser();
  const availablePhoto = await hasImage(query.get('photos') as ImageId);
  let photo: ImageId | null = null;

  if (!availablePhoto) {
    photo = getRandomImage();
  } else {
    photo = query.get('photos') as ImageId;
  }

  if (photo) {
    query.set('photos', photo);

    const newUrl = `${window.location.protocol}//${window.location.host}${
      window.location.pathname
    }?${query.toString()}`;
    !availablePhoto && window.history.pushState({ path: newUrl }, '', newUrl);
  }

  if (photo) {
    return fetchImageData(photo);
  }
  return null;
}
