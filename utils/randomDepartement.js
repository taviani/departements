export const pickRandomDepartement = (departements, current) => {
  if (departements.length <= 1) {
    return departements[0];
  }

  let next = current;
  while (next === current) {
    next = departements[Math.floor(Math.random() * departements.length)];
  }
  return next;
};
