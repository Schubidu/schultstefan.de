import { describe, expect, it } from 'vitest';

import { chooseConfettiLevel } from '../confetti';

describe('chooseConfettiLevel', () => {
  it('uses weighted surprise thresholds', () => {
    expect(chooseConfettiLevel(() => 0)).toBe('none');
    expect(chooseConfettiLevel(() => 0.699)).toBe('none');
    expect(chooseConfettiLevel(() => 0.7)).toBe('small');
    expect(chooseConfettiLevel(() => 0.919)).toBe('small');
    expect(chooseConfettiLevel(() => 0.92)).toBe('large');
    expect(chooseConfettiLevel(() => 0.989)).toBe('large');
    expect(chooseConfettiLevel(() => 0.99)).toBe('absurd');
  });
});
