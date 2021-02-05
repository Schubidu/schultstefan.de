import type { ImageType } from './types';

let favicon: HTMLLinkElement | null;

window.addEventListener('load', () => {
  favicon = document.querySelector('[rel="shortcut icon"]');
});

export default ({ color }: Pick<ImageType['default'], 'color'>) => {
  favicon = document.querySelector('[rel="shortcut icon"]');

  const faviconSize = 16;

  const canvas = document.createElement('canvas');
  canvas.width = faviconSize;
  canvas.height = faviconSize;

  const context = canvas.getContext('2d');
  const img = document.createElement('img');
  if (favicon?.href) img.src = favicon.href;

  img.onload = () => {
    if (context && favicon) {
      context.beginPath();
      context.arc(canvas.width - faviconSize / 3, canvas.height - faviconSize / 3, faviconSize / 3, 0, 2 * Math.PI);
      context.fillStyle = color;
      context.fill();

      // Replace favicon
      favicon.type = 'image/png';
      favicon.href = canvas.toDataURL('image/png');
    }
  };
};
