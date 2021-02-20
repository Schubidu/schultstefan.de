import colorContrast from 'color-contrast';
import favicon from './favicon';
import photo from './unplashPhoto';

const aside = document.createElement('aside');
document.body.append(aside);

const contrastText = {
  light: {
    '--background-color': 'rgba(255, 255, 255, 0.7)',
    '--background-backdrop-color': 'rgba(255, 255, 255, 0.4)',
    '--font-color': '#000',
  },
  dark: {
    '--background-color': 'rgba(0, 0, 0, 0.7)',
    '--background-backdrop-color': 'rgba(0, 0, 0, 0.4)',
    '--font-color': '#fefefe',
  },
} as const;

export default async function unsplash() {
  const documentElement = document.documentElement;
  const currentPhoto = await photo();
  if (currentPhoto) {
    const {
      id,
      color,
      blurHash,
      user: {
        name: unsplashUser,
        links: { html: unsplashProfil },
      },
      urls: { full: unsplashFull, regular: unsplashRegular },
    } = currentPhoto;

    const blurry = await favicon({ color, blurHash });
    documentElement.style.setProperty('--unsplash-color', color);
    documentElement.style.setProperty('--unsplash-full', `url(${unsplashFull})`);
    documentElement.style.setProperty('--unsplash-regular', `url(${unsplashRegular})`);
    documentElement.style.setProperty('--unsplash-blurry', `url(${blurry})`);
    documentElement.style.setProperty('--unsplash-text', `url(${blurry})`);
    const contrast = colorContrast('#000', color);
    Object.entries(contrastText[contrast > 7 ? 'light' : 'dark']).forEach(([prop, value]) =>
      documentElement.style.setProperty(prop, value)
    );

    aside.innerHTML = `<a href="https://unsplash.com/photos/${id}?utm_source=Stefan%27s%20Photo%20App%20Example%0D%0ADemo&utm_medium=referral" rel=”nofollow”>Photo</a> by <a href="${unsplashProfil}?utm_source=Stefan%27s%20Photo%20App%20Example%0D%0ADemo&utm_medium=referral" rel=”nofollow”>${unsplashUser}</a> on <a href="https://unsplash.com/?utm_source=Stefan%27s%20Photo%20App%20Example%0D%0ADemo&utm_medium=referral" rel=”nofollow”>Unsplash</a>`;
    return currentPhoto;
  }
}
