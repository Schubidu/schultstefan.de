import { decode } from 'blurhash';
import type { ImageType } from './types';

export default function createFavicon({ blurHash }: Pick<ImageType['default'], 'blurHash'>): string {
  const faviconSize = 32;
  const pixels = decode(blurHash, faviconSize, faviconSize);
  const canvas = document.createElement('canvas');

  canvas.width = faviconSize;
  canvas.height = faviconSize;
  canvas.classList.add('blurry');

  const context = canvas.getContext('2d');

  if (!context) {
    return '';
  }

  const imageData = context.createImageData(faviconSize, faviconSize);

  imageData.data.set(pixels);
  context.putImageData(imageData, 0, 0);

  const dataUrl = canvas.toDataURL('image/png');
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');

  if (favicon) {
    favicon.type = 'image/png';
    favicon.href = dataUrl;
  }

  document.body.insertBefore(canvas, document.body.firstChild);

  return dataUrl;
}
