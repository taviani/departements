export const formatDepartementCount = (count) =>
  `${count} département${count > 1 ? 's' : ''}`;

export const getHeaderSubtitle = ({ isDetailView }) => {
  if (isDetailView) {
    return 'Carte du département et préfecture';
  }
  return 'Glissez à droite pour rechercher · à gauche pour un hasard';
};

export const getDetailStripSubtitle = (departement, prefecture) =>
  prefecture ? `Préfecture : ${prefecture}` : departement.region;
