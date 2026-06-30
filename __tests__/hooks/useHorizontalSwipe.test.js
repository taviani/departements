import { resolveSwipeAction } from '../../hooks/useHorizontalSwipe';

describe('resolveSwipeAction', () => {
  it('detects a downward swipe', () => {
    expect(resolveSwipeAction({ dx: 0, dy: 80, vx: 0, vy: 0 })).toBe('down');
    expect(resolveSwipeAction({ dx: 5, dy: 10, vx: 0, vy: 0.4 })).toBe('down');
  });

  it('detects horizontal swipes when horizontal movement dominates', () => {
    expect(resolveSwipeAction({ dx: 80, dy: 10, vx: 0, vy: 0 })).toBe('right');
    expect(resolveSwipeAction({ dx: -80, dy: 10, vx: 0, vy: 0 })).toBe('left');
  });

  it('ignores short or ambiguous gestures', () => {
    expect(resolveSwipeAction({ dx: 10, dy: 10, vx: 0, vy: 0 })).toBeNull();
    expect(resolveSwipeAction({ dx: 0, dy: -80, vx: 0, vy: 0 })).toBeNull();
  });
});
