import queryParser from './queryParser.mjs';
import { fetchImageData, getRandomImage, hasImage } from './unsplash-images/index.mjs';

export default async () => {
  const query = await queryParser();
  const availePhoto = await hasImage(query.get('photos'));
  let photo = '';

  if (history.pushState) {
    if (!availePhoto) {
      photo = await getRandomImage();
    } else {
      photo = query.get('photos');
    }

    query.set('photos', photo);

    const newUrl = `${window.location.protocol}//${window.location.host}${
      window.location.pathname
    }?${query.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }

  return fetchImageData(photo);
};
