import { filterDepartements } from '../../utils/departementSearch';
import { departements } from '../../data/departements';

describe('filterDepartements', () => {
  it('returns all departments for an empty query', () => {
    expect(filterDepartements(departements, '')).toHaveLength(96);
    expect(filterDepartements(departements, '   ')).toHaveLength(96);
  });

  it('filters by department number', () => {
    const results = filterDepartements(departements, '75');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Paris');
  });

  it('filters by department name case-insensitively', () => {
    const results = filterDepartements(departements, 'rhône');
    expect(results.some((dept) => dept.name === 'Rhône')).toBe(true);
  });

  it('does not filter by region name', () => {
    const results = filterDepartements(departements, 'Bretagne');
    expect(results).toHaveLength(0);
  });

  it('returns partial name matches', () => {
    const results = filterDepartements(departements, 'seine');
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((dept) => dept.name.toLowerCase().includes('seine'))).toBe(
      true
    );
  });

  it('finds Corsica departments by code', () => {
    expect(filterDepartements(departements, '2A')).toHaveLength(1);
    expect(filterDepartements(departements, '2B')).toHaveLength(1);
  });
});
