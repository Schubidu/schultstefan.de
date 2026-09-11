import confetti from 'canvas-confetti';
import unsplash from './unsplash';

(async () => {
  await unsplash();

  document.documentElement.classList.add('hasConfetti');
  await confetti({ particleCount: 200, spread: 200 });
  document.documentElement.classList.remove('hasConfetti');
})();
