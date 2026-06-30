import {
  createGeofenceState,
  updateGeofenceState,
} from '../../utils/departementGeofence';

describe('departementGeofence', () => {
  it('requires stable readings before confirming a department change', () => {
    let state = createGeofenceState();

    ({ state } = updateGeofenceState(state, 48.8566, 2.3522, 50));
    expect(state.confirmedCode).toBeNull();
    expect(state.pendingCount).toBe(1);

    const { state: finalState, changedCode } = updateGeofenceState(
      state,
      48.8566,
      2.3522,
      50
    );

    expect(changedCode).toBe('75');
    expect(finalState.confirmedCode).toBe('75');
  });

  it('ignores very inaccurate readings', () => {
    const state = createGeofenceState();
    const { changedCode } = updateGeofenceState(state, 48.8566, 2.3522, 900);
    expect(changedCode).toBeNull();
  });
});
