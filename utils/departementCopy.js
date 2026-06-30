export const formatDepartementCount = (count) =>
  `${count} département${count > 1 ? 's' : ''}`;

export const CURRENT_DEPARTEMENT_MATCH_LABEL = "C'est un match !";

export const getHeaderSubtitle = ({ isDetailView }) => {
  if (isDetailView) {
    return 'Carte du département et préfecture';
  }
  return 'Glissez à droite pour rechercher · à gauche pour un hasard · vers le bas pour le vôtre';
};

export const getDetailStripSubtitle = (departement, prefecture) =>
  prefecture ? `Préfecture : ${prefecture}` : departement.region;
