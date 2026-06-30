const appConfig = require('../app.json').expo;

/** Update publisher and contact before App Store / Google Play submission. */
export const legalMeta = {
  appName: 'Départements',
  version: appConfig.version,
  publisherName: 'Départements',
  contactEmail: 'contact@example.com',
  lastUpdated: '13 juin 2026',
};

export const legalSections = [
  {
    title: 'Éditeur',
    paragraphs: [
      `Application : ${legalMeta.appName}`,
      `Version : ${legalMeta.version}`,
      `Éditeur : ${legalMeta.publisherName}`,
      `Contact : ${legalMeta.contactEmail}`,
    ],
  },
  {
    title: 'Politique de confidentialité',
    paragraphs: [
      `${legalMeta.appName} ne crée pas de compte utilisateur et ne transmet pas vos données à des serveurs tiers.`,
      "La recherche et la sélection de départements sont traitées localement sur votre appareil.",
      "Si vous activez la localisation, la position GPS est utilisée uniquement sur l'appareil pour afficher un indicateur sur votre département actuel et, le cas échéant, pour vous notifier lorsque vous changez de département. Ces données ne sont pas envoyées à l'éditeur.",
      "Aucune publicité, aucun traceur publicitaire et aucun outil d'analyse tiers n'est intégré à l'application.",
      "En mode développement (Expo Go), le réseau local peut être utilisé uniquement pour charger le code de l'application depuis votre ordinateur.",
      `Pour toute question relative à la confidentialité : ${legalMeta.contactEmail}`,
    ],
  },
  {
    title: "Conditions d'utilisation",
    paragraphs: [
      `${legalMeta.appName} est fournie à titre informatif et éducatif, sans garantie d'exactitude, d'exhaustivité ou de disponibilité.`,
      "Les limites administratives, noms de départements et localisations de préfectures sont issues de sources publiques et peuvent ne pas refléter les dernières réformes territoriales.",
      "L'éditeur décline toute responsabilité en cas d'erreur, d'omission ou d'utilisation du contenu de l'application.",
      "L'utilisation de l'application implique l'acceptation des présentes conditions.",
    ],
  },
  {
    title: 'Sources et crédits',
    paragraphs: [
      'Carte des départements : données GeoJSON métropolitaines (source ouverte, simplifiée pour l’affichage mobile).',
      'Préfectures : coordonnées et libellés compilés à partir de sources publiques.',
      'Liste des 96 départements métropolitains (dont la Corse 2A et 2B).',
      'Icônes : @expo/vector-icons (Ionicons).',
    ],
  },
  {
    title: 'Propriété intellectuelle',
    paragraphs: [
      "Le code source de l'application est distribué sous licence MIT, sauf mention contraire pour les ressources tierces.",
      'Les données géographiques et administratives citées ci-dessus restent la propriété de leurs auteurs respectifs.',
      `© ${new Date().getFullYear()} ${legalMeta.publisherName}. Tous droits réservés sur les éléments originaux de l'application.`,
    ],
  },
];
