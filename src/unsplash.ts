import { surpriseConfetti } from './confetti';
import { createBlurDataUrl, updateFavicon } from './favicon';
import type { ImageType } from './types';
import { getInitialPhoto, getNextPhoto } from './unsplashPhoto';

type Photo = ImageType['default'];

const SOFTEN_DURATION_MS = 90;

const SWAP_DURATION_MS = 110;

const REVEAL_DURATION_MS = 240;

const background = document.querySelector<HTMLElement>('#photo-background');

const baseLayer = document.querySelector<HTMLElement>('#photo-layer-base');

const overlayLayer = document.querySelector<HTMLElement>('#photo-layer-overlay');

const credit = document.querySelector<HTMLElement>('#photo-credit');

const shuffleButton = document.querySelector<HTMLButtonElement>('#shuffle-photo');

const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let currentPhoto: Photo | null = null;

function cssUrl(url: string): string {
  return `url(${JSON.stringify(url)})`;
}

function applyLayer(layer: HTMLElement | null, url: string, color: string): void {
  if (!layer) {
    return;
  }

  layer.style.backgroundColor = color;
  layer.style.backgroundImage = cssUrl(url);
}

function applyBasePhoto(url: string, color: string): void {
  if (baseLayer) {
    applyLayer(baseLayer, url, color);

    return;
  }

  if (background) {
    background.style.backgroundColor = color;
    background.style.backgroundImage = cssUrl(url);
  }
}

function updateCredit(photo: Photo): void {
  if (!credit) {
    return;
  }

  const sourceSuffix = '?utm_source=schultstefan.de&utm_medium=referral';

  const photoLink = document.createElement('a');

  const photographerLink = document.createElement('a');

  const unsplashLink = document.createElement('a');

  photoLink.href = `https://unsplash.com/photos/${photo.id}${sourceSuffix}`;
  photoLink.rel = 'nofollow noopener';
  photoLink.textContent = 'Photo';

  photographerLink.href = `${photo.user.links.html}${sourceSuffix}`;
  photographerLink.rel = 'nofollow noopener';
  photographerLink.textContent = photo.user.name;

  unsplashLink.href = `https://unsplash.com/${sourceSuffix}`;
  unsplashLink.rel = 'nofollow noopener';
  unsplashLink.textContent = 'Unsplash';

  credit.replaceChildren(photoLink, ' by ', photographerLink, ' on ', unsplashLink);
  credit.hidden = false;
}

function applyThemeColor(color: string): void {
  themeColor?.setAttribute('content', color);
  document.documentElement.style.setProperty('--photo-color', color);
}

function applyPhotoIdentity(photo: Photo, blurDataUrl: string): void {
  updateFavicon(blurDataUrl);
  updateCredit(photo);
}

function triggerSurpriseConfetti(): void {
  void surpriseConfetti().catch(() => undefined);
}

async function preloadImage(url: string): Promise<boolean> {
  const image = new Image();

  image.src = url;

  try {
    await image.decode();

    return true;
  } catch {
    return false;
  }
}

async function fadeOverlay(opacity: 0 | 1, duration: number): Promise<void> {
  if (!overlayLayer) {
    return;
  }

  const finalOpacity = String(opacity);

  if (reducedMotion.matches) {
    overlayLayer.style.opacity = finalOpacity;

    return;
  }

  const currentOpacity = Number.parseFloat(getComputedStyle(overlayLayer).opacity);

  const animation = overlayLayer.animate([{ opacity: currentOpacity }, { opacity }], {
    duration,
    easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
    fill: 'forwards',
  });

  await animation.finished;
  overlayLayer.style.opacity = finalOpacity;
  animation.cancel();
}

function resetOverlay(): void {
  if (!overlayLayer) {
    return;
  }

  for (const animation of overlayLayer.getAnimations()) {
    animation.cancel();
  }

  overlayLayer.style.opacity = '0';
  overlayLayer.style.backgroundImage = 'none';
}

async function revealLoadedPhoto(url: string, color: string): Promise<void> {
  if (!overlayLayer) {
    applyBasePhoto(url, color);

    return;
  }

  applyLayer(overlayLayer, url, color);
  await fadeOverlay(1, REVEAL_DURATION_MS);
  applyBasePhoto(url, color);
  resetOverlay();
}

async function revealPhoto(photo: Photo): Promise<void> {
  const blurDataUrl = createBlurDataUrl(photo.blurHash);

  applyThemeColor(photo.color);
  applyPhotoIdentity(photo, blurDataUrl);
  applyBasePhoto(blurDataUrl, photo.color);

  if (await preloadImage(photo.urls.regular)) {
    await revealLoadedPhoto(photo.urls.regular, photo.color);
  }

  currentPhoto = photo;
}

async function shufflePhoto(): Promise<void> {
  if (!currentPhoto || !shuffleButton) {
    return;
  }

  shuffleButton.disabled = true;
  shuffleButton.setAttribute('aria-busy', 'true');

  try {
    const nextPhoto = await getNextPhoto(currentPhoto.id);

    if (!nextPhoto) {
      return;
    }

    const currentBlur = createBlurDataUrl(currentPhoto.blurHash);

    const nextBlur = createBlurDataUrl(nextPhoto.blurHash);

    const imageReady = preloadImage(nextPhoto.urls.regular);

    if (overlayLayer) {
      applyLayer(overlayLayer, currentBlur, currentPhoto.color);
      await fadeOverlay(1, SOFTEN_DURATION_MS);

      applyBasePhoto(nextBlur, nextPhoto.color);
      await fadeOverlay(0, SWAP_DURATION_MS);
    } else {
      applyBasePhoto(nextBlur, nextPhoto.color);
    }

    applyPhotoIdentity(nextPhoto, nextBlur);

    if (await imageReady) {
      await revealLoadedPhoto(nextPhoto.urls.regular, nextPhoto.color);
    }

    applyThemeColor(nextPhoto.color);
    currentPhoto = nextPhoto;
    triggerSurpriseConfetti();
  } finally {
    shuffleButton.disabled = false;
    shuffleButton.removeAttribute('aria-busy');
  }
}

export default async function initializeBackground(): Promise<void> {
  const photo = await getInitialPhoto();

  if (!photo) {
    return;
  }

  await revealPhoto(photo);

  if (shuffleButton) {
    shuffleButton.addEventListener('click', async () => {
      await shufflePhoto();
    });
    shuffleButton.disabled = false;
  }

  triggerSurpriseConfetti();
}
