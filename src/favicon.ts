import { decode } from 'blurhash';
import type { ImageType } from './types';

let favicon: HTMLLinkElement | null;

window.addEventListener('load', () => {
  favicon = document.querySelector('[rel="shortcut icon"]');
});

export default async function createFavicon({
  color,
  blurHash,
}: Pick<ImageType['default'], 'color' | 'blurHash'>): Promise<string> {
  favicon = document.querySelector('[rel="shortcut icon"]');
  const pixels = decode(blurHash, 32, 32);

  const faviconSize = 32;

  const canvas = document.createElement('canvas');
  canvas.width = faviconSize;
  canvas.height = faviconSize;
  canvas.classList.add('blurry');

  const context = canvas.getContext('2d');
  const img = document.createElement('img');
  if (favicon?.href) img.src = favicon.href;
  document.body.appendChild(canvas);
  document.body.insertBefore(canvas, document.body.firstChild);
  return new Promise((resolve) => {
    img.onload = () => {
      if (context && favicon) {
        const imageData = context.createImageData(faviconSize, faviconSize);
        imageData.data.set(pixels);
        context.putImageData(imageData, 0, 0);

        /*         context.beginPath();
        context.arc(canvas.width - faviconSize, canvas.height, faviconSize / 3, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
 */
        // Replace favicon
        favicon.type = 'image/png';
        favicon.href = canvas.toDataURL('image/png');
        resolve(canvas.toDataURL('image/png'));
      }
    };
  });
}
