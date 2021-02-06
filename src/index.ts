/**
 * This file is just a silly example to show everything working in the browser.
 * When you're ready to start on your site, clear the file. Happy hacking!
 **/

import confetti from 'canvas-confetti';
import unsplash from './unsplash';

(async () => {
  await unsplash();
  document.documentElement.classList.add('hasConfetti');
  await confetti.create(document.getElementById('canvas') as HTMLCanvasElement, {
    resize: true,
    useWorker: true,
  })({ particleCount: 200, spread: 200 });
  document.documentElement.classList.remove('hasConfetti');
})();
