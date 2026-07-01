/**
 * Maps visit counts to map tint levels 0–4 (0 = none).
 */
export const intensityFromVisitCount = (count) => {
  if (!count || count <= 0) {
    return 0;
  }
  if (count === 1) {
    return 1;
  }
  if (count <= 3) {
    return 2;
  }
  if (count <= 7) {
    return 3;
  }
  return 4;
};

export const buildVisitIntensityByCode = (visitCountByCode) => {
  const result = {};
  for (const [code, count] of Object.entries(visitCountByCode ?? {})) {
    const level = intensityFromVisitCount(count);
    if (level > 0) {
      result[code] = level;
    }
  }
  return result;
};
