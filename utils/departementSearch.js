export const filterDepartements = (departements, query) => {
  if (!query.trim()) {
    return departements;
  }

  const normalized = query.toLowerCase().trim();
  return departements.filter(
    (dept) =>
      dept.number.toLowerCase().includes(normalized) ||
      dept.name.toLowerCase().includes(normalized)
  );
};
