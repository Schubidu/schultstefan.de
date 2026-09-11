import confetti from 'canvas-confetti';

export type ConfettiLevel = 'none' | 'small' | 'large' | 'absurd';

export function chooseConfettiLevel(random: () => number = Math.random): ConfettiLevel {
  const value = random();

  if (value < 0.7) {
    return 'none';
  }

  if (value < 0.92) {
    return 'small';
  }

  if (value < 0.99) {
    return 'large';
  }

  return 'absurd';
}

function randomOrigin(random: () => number): { x: number; y: number } {
  return {
    x: 0.18 + random() * 0.64,
    y: 0.08 + random() * 0.32,
  };
}

export async function surpriseConfetti(random: () => number = Math.random): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const level = chooseConfettiLevel(random);

  if (level === 'none') {
    return;
  }

  if (level === 'small') {
    await confetti({ particleCount: 28 + Math.floor(random() * 24), spread: 52, origin: randomOrigin(random) });
    return;
  }

  if (level === 'large') {
    await confetti({ particleCount: 120 + Math.floor(random() * 80), spread: 110, origin: randomOrigin(random) });
    return;
  }

  await Promise.all([
    confetti({ particleCount: 260, spread: 180, startVelocity: 48, origin: randomOrigin(random) }),
    confetti({ particleCount: 260, spread: 180, startVelocity: 48, origin: randomOrigin(random) }),
  ]);
}
