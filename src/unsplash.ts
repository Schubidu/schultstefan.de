import { surpriseConfetti } from './confetti';
import { createBlurDataUrl, updateFavicon } from './favicon';
import type { ImageType } from './types';
import { getInitialPhoto, getNextPhoto } from './unsplashPhoto';

type Photo = ImageType['default'];
type TransitionPhase = 'soften' | 'swap' | 'reveal';

const background = document.querySelector<HTMLElement>('#photo-background');
const credit = document.querySelector<HTMLElement>('#photo-credit');
const shuffleButton = document.querySelector<HTMLButtonElement>('#shuffle-photo');
const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let currentPhoto: Photo | null = null;

function cssUrl(url: string): string {
  return `url(${JSON.stringify(url)})`;
}

function applyBackground(url: string, color: string): void {
  if (!background) {
    return;
  }

  background.style.backgroundColor = color;
  background.style.backgroundImage = cssUrl(url);
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

function applyPhotoMetadata(photo: Photo, blurDataUrl: string): void {
  themeColor?.setAttribute('content', photo.color);
  updateFavicon(blurDataUrl);
  updateCredit(photo);
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

async function transitionBackground(phase: TransitionPhase, update: () => void): Promise<void> {
  if (reducedMotion.matches || !document.startViewTransition) {
    update();
    return;
  }

  document.documentElement.dataset.transitionPhase = phase;

  try {
    const transition = document.startViewTransition(update);

    await transition.finished;
  } finally {
    delete document.documentElement.dataset.transitionPhase;
  }
}

async function revealPhoto(photo: Photo): Promise<void> {
  const blurDataUrl = createBlurDataUrl(photo.blurHash);

  applyPhotoMetadata(photo, blurDataUrl);
  applyBackground(blurDataUrl, photo.color);

  const loaded = await preloadImage(photo.urls.regular);

  if (loaded) {
    await transitionBackground('reveal', () => applyBackground(photo.urls.regular, photo.color));
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

    await transitionBackground('soften', () => applyBackground(currentBlur, currentPhoto?.color ?? nextPhoto.color));
    await transitionBackground('swap', () => {
      applyPhotoMetadata(nextPhoto, nextBlur);
      applyBackground(nextBlur, nextPhoto.color);
    });

    if (await imageReady) {
      await transitionBackground('reveal', () => applyBackground(nextPhoto.urls.regular, nextPhoto.color));
    }

    currentPhoto = nextPhoto;
    await surpriseConfetti();
  } finally {
    shuffleButton.disabled = false;
    shuffleButton.removeAttribute('aria-busy');
  }
}

export default async function initializeBackground(): Promise<void> {
  const photo = await getInitialPhoto();

  if (!photo) {
    if (shuffleButton) {
      shuffleButton.disabled = true;
    }
    return;
  }

  await revealPhoto(photo);
  await surpriseConfetti();

  shuffleButton?.addEventListener('click', async () => {
    await shufflePhoto();
  });
}
