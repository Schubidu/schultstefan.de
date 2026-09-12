import { decode } from 'blurhash';

export function createBlurDataUrl(blurHash: string, size = 32): string {
  const pixels = decode(blurHash, size, size);
  const canvas = document.createElement('canvas');

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');

  if (!context) {
    return '';
  }

  const imageData = context.createImageData(size, size);

  imageData.data.set(pixels);
  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

export function updateFavicon(dataUrl: string): void {
  if (!dataUrl) {
    return;
  }

  const favicons = document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]');

  for (const favicon of favicons) {
    favicon.type = 'image/png';
    favicon.href = dataUrl;
  }
}
