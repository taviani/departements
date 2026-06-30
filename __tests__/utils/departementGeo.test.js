import { findDepartementCodeAt } from '../../utils/departementGeo';

describe('departementGeo', () => {
  it('resolves Paris to department 75', () => {
    expect(findDepartementCodeAt(48.8566, 2.3522)).toBe('75');
  });

  it('resolves Lyon to department 69', () => {
    expect(findDepartementCodeAt(45.764, 4.8357)).toBe('69');
  });

  it('returns null for coordinates outside metropolitan France', () => {
    expect(findDepartementCodeAt(40.4168, -3.7038)).toBeNull();
  });
});
