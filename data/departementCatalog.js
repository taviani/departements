import { departements } from './departements';

const departementsByNumber = Object.fromEntries(
  departements.map((dept) => [dept.number, dept])
);

export const getDepartementByCode = (code) => departementsByNumber[code] ?? null;

export { departements };
