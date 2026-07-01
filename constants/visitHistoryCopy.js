export const visitHistoryCopy = {
  menuLabel: 'Mon parcours',
  screenTitle: 'Mon parcours',

  globalRecommendation: {
    title: 'Profitez pleinement de l\'app',
    message:
      'Activez la localisation pour voir où vous êtes, être alerté lors de vos passages de département et suivre vos visites sur la carte. L\'app reste utilisable sans : aucune coordonnée n\'est envoyée à nos serveurs.',
    later: 'Plus tard',
    enable: 'Activer la localisation',
    dismissForever: 'Ne plus afficher',
  },

  consentEnable: {
    title: 'Localisation recommandée',
    message:
      'Pour enregistrer vos visites automatiquement, autorisez l\'accès à votre position. Sans cela, votre historique restera vide — le reste de l\'app fonctionne normalement. Seuls les codes département et les horaires sont stockés sur votre appareil.',
    later: 'Plus tard',
    authorize: 'Autoriser la localisation',
    openSettings: 'Ouvrir les réglages',
  },

  partialTracking: {
    title: 'Suivi partiel possible',
    message:
      'Vos visites seront enregistrées lorsque l\'application est ouverte. Pour un suivi complet en déplacement, nous recommandons « Toujours autoriser ».',
    continue: 'Continuer ainsi',
    enableFull: 'Activer le suivi complet',
  },

  consentDisable: {
    title: 'Historique de visites',
    message:
      'L\'enregistrement des visites est arrêté. Vos données existantes sont conservées sur l\'appareil.',
    keep: 'Conserver l\'historique',
    delete: 'Supprimer l\'historique',
  },

  historyToggle: {
    label: 'Historique de visites',
    description:
      'Enregistre automatiquement vos passages de département (GPS uniquement, stockage local).',
  },

  mapToggle: {
    label: 'Afficher mes départements visités',
    description: 'Teinte les départements visités sur la carte.',
  },

  banner: {
    noLocation:
      '📍 Activez la localisation pour enregistrer vos visites et voir votre progression.',
    activate: 'Activer',
    foregroundOnly:
      'Pour suivre vos déplacements en continu, activez « Toujours autoriser » dans les réglages.',
    settings: 'Réglages',
  },

  emptyNoLocation:
    'Vos visites apparaîtront ici dès que la localisation sera activée.',

  emptyNoVisits:
    'Vos visites apparaîtront ici lorsque vous changerez de département.',

  progressLabel: (visited, total) => `${visited} / ${total}`,

  totalPassages: (count) =>
    count === 1 ? '1 passage enregistré' : `${count} passages enregistrés`,

  topDepartmentsTitle: 'Départements les plus visités',

  mapHint:
    'Activez la localisation pour voir votre département actuel et vos visites sur la carte.',

  links: {
    detail: 'Historique détaillé',
    export: 'Exporter',
    delete: 'Supprimer',
    manageConsent: 'Gérer le consentement',
    exportComingSoon: 'L\'export JSON sera disponible dans une prochaine mise à jour.',
    deleteComingSoon:
      'La suppression complète sera disponible dans une prochaine mise à jour. Vous pouvez retirer le consentement et conserver ou supprimer vos données.',
  },

  sessionDuration: (minutes) =>
    minutes < 60
      ? `${minutes} min`
      : `${Math.floor(minutes / 60)} h ${minutes % 60} min`,

  helpSection: {
    title: 'Historique de visites',
    paragraphs: [
      'Activez la localisation pour enregistrer automatiquement vos passages de département. L\'app reste utilisable sans : l\'historique reste vide tant que le GPS n\'est pas autorisé.',
      'Seuls le code département et les horaires sont stockés sur votre appareil. Aucune coordonnée GPS n\'est conservée dans l\'historique.',
      '« Toujours autoriser » est recommandé pour un suivi complet en déplacement, comme pour les alertes de passage.',
      'Export et suppression de l\'historique : page Mon parcours (menu ☰).',
    ],
  },
};
