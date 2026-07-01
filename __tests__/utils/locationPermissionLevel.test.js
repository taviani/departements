import {
  shouldShowVisitHistoryLocationBanner,
  shouldShowVisitHistoryPartialInfo,
} from '../../utils/locationPermissionLevel';

describe('visit history location banners', () => {
  it('hides banner when Always is granted', () => {
    expect(
      shouldShowVisitHistoryLocationBanner({
        historyEnabled: true,
        permissionLevel: 'background',
        bannerDismissed: false,
        isExpoGo: false,
      })
    ).toBe(false);
  });

  it('shows banner for foreground-only in compiled app', () => {
    expect(
      shouldShowVisitHistoryLocationBanner({
        historyEnabled: true,
        permissionLevel: 'foreground',
        bannerDismissed: false,
        isExpoGo: false,
      })
    ).toBe(true);
  });

  it('hides Always banner in Expo Go with foreground permission', () => {
    expect(
      shouldShowVisitHistoryLocationBanner({
        historyEnabled: true,
        permissionLevel: 'foreground',
        bannerDismissed: false,
        isExpoGo: true,
      })
    ).toBe(false);
  });

  it('shows partial info in Expo Go with foreground permission', () => {
    expect(
      shouldShowVisitHistoryPartialInfo({
        historyEnabled: true,
        permissionLevel: 'foreground',
        isExpoGo: true,
      })
    ).toBe(true);
  });

  it('shows banner when geoloc is missing', () => {
    expect(
      shouldShowVisitHistoryLocationBanner({
        historyEnabled: true,
        permissionLevel: 'undetermined',
        bannerDismissed: false,
        isExpoGo: true,
      })
    ).toBe(true);
  });
});
