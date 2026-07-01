/**
 * Corse 2A/2B share one slot in the X/96 progress counter.
 */
export const progressBucket = (code) => {
  if (code === '2A' || code === '2B') {
    return 'corse';
  }
  return code;
};
