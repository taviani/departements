import { formatDepartementCount, getDetailStripSubtitle, getHeaderSubtitle } from '../../utils/departementCopy';

describe('departementCopy', () => {
  it('formats singular and plural department counts', () => {
    expect(formatDepartementCount(0)).toBe('0 département');
    expect(formatDepartementCount(1)).toBe('1 département');
    expect(formatDepartementCount(96)).toBe('96 départements');
  });

  it('returns the detail subtitle when zoomed', () => {
    expect(getHeaderSubtitle({ isDetailView: true })).toBe(
      'Carte du département et préfecture'
    );
  });

  it('returns swipe hints as the default subtitle', () => {
    expect(getHeaderSubtitle({ isDetailView: false })).toBe(
      'Glissez à droite pour rechercher · à gauche pour un hasard'
    );
  });

  it('prefers prefecture over region in the detail strip', () => {
    const item = { number: '75', name: 'Paris', region: 'Île-de-France' };
    expect(getDetailStripSubtitle(item, 'Paris')).toBe('Préfecture : Paris');
    expect(getDetailStripSubtitle(item, null)).toBe('Île-de-France');
  });
});
