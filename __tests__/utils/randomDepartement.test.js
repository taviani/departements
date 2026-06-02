import { pickRandomDepartement } from '../../utils/randomDepartement';

const sample = [
  { number: '01', name: 'Ain' },
  { number: '75', name: 'Paris' },
  { number: '13', name: 'Bouches-du-Rhône' },
];

describe('pickRandomDepartement', () => {
  it('returns the only department when the list has one item', () => {
    const single = [{ number: '75', name: 'Paris' }];
    expect(pickRandomDepartement(single, null)).toBe(single[0]);
    expect(pickRandomDepartement(single, single[0])).toBe(single[0]);
  });

  it('never returns the current department when alternatives exist', () => {
    const current = sample[0];
    for (let i = 0; i < 30; i += 1) {
      const next = pickRandomDepartement(sample, current);
      expect(next).not.toBe(current);
      expect(sample).toContain(next);
    }
  });

  it('can pick any department when current is null', () => {
    const picks = new Set();
    for (let i = 0; i < 50; i += 1) {
      picks.add(pickRandomDepartement(sample, null).number);
    }
    expect(picks.size).toBeGreaterThan(1);
  });
});
