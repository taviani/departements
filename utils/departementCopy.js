export const formatDepartementCount = (count) =>
  `${count} département${count > 1 ? 's' : ''}`;

export const CURRENT_DEPARTEMENT_HERE_LABEL = 'Vous êtes ici';
export const CURRENT_DEPARTEMENT_MATCH_LABEL = `${CURRENT_DEPARTEMENT_HERE_LABEL} 📍`;

export const DEPARTEMENT_CHANGE_NOTIFICATION_TITLE = 'Nouveau département !';

export const getDepartementChangeNotificationLines = (departement) => {
  const welcomeLine = `Bienvenue dans le ${departement.number} · ${departement.name}`;

  return {
    title: welcomeLine,
    subtitle: DEPARTEMENT_CHANGE_NOTIFICATION_TITLE,
    androidBody: DEPARTEMENT_CHANGE_NOTIFICATION_TITLE,
  };
};

export const getHeaderSubtitle = ({ isDetailView }) => {
  if (isDetailView) {
    return 'Carte du département et préfecture';
  }
  return 'Glissez à droite pour rechercher · à gauche pour un hasard · vers le bas pour le vôtre';
};

export const getDetailStripSubtitle = (departement, prefecture) =>
  prefecture ? `Préfecture : ${prefecture}` : departement.region;
