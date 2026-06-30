export const helpMeta = {
  title: 'Aide',
  intro:
    "Ce guide explique comment activer la localisation et les notifications pour profiter pleinement de l'application. Toutes les données restent sur votre appareil.",
};

export const helpSections = [
  {
    title: 'Localisation sur la carte',
    paragraphs: [
      "Un cœur bleu indique le département où vous vous trouvez actuellement, lorsque la localisation est disponible.",
      "Balayez la carte vers le bas pour centrer la vue sur votre département actuel. Si la localisation n'est pas encore autorisée, l'application vous la demandera à ce moment-là.",
      "Choisissez « Autoriser quand l'app est active » (ou l'équivalent) : cela suffit pour la carte et le cœur sur la liste.",
    ],
  },
  {
    title: 'Notifications : mise en route',
    steps: [
      "Ouvrez le menu (☰) puis Notifications.",
      "Activez « Activer les notifications » et acceptez l'autorisation système lorsque iOS ou Android vous le demande.",
      "Vérifiez dans Autorisations système que Notifications affiche « Autorisées ».",
    ],
    paragraphs: [
      "Sans cette étape, aucune alerte ne pourra s'afficher, même si la localisation est activée.",
    ],
  },
  {
    title: 'Alertes de passage de département',
    steps: [
      "Dans Notifications, activez « Passage de département ».",
      "Acceptez d'abord la localisation « Quand l'app est active », puis « Toujours autoriser » (iPhone) ou « Autoriser tout le temps » (Android).",
      "Vérifiez que Localisation affiche « Toujours autorisée » dans la page Notifications.",
    ],
    paragraphs: [
      "Une notification vous prévient lorsque vous entrez dans un nouveau département. Le changement est confirmé après deux lectures GPS stables, espacées d'environ 300 mètres, pour limiter les fausses alertes près des frontières.",
      "Cette fonction nécessite l'accès en arrière-plan : sans « Toujours autoriser », les alertes ne fonctionnent que lorsque l'application est ouverte.",
    ],
  },
  {
    title: 'Que choisir dans les pop-ups ?',
    paragraphs: [
      "Autoriser une fois : temporaire, à éviter — la permission expire et les alertes s'arrêtent.",
      "Autoriser quand l'app est active : suffisant pour la carte et le cœur, mais insuffisant pour les alertes en déplacement.",
      "Toujours autoriser (iPhone) / Autoriser tout le temps (Android) : requis pour les alertes de passage lorsque l'app est en arrière-plan.",
      "Ne pas autoriser : aucune fonction de localisation ne sera disponible.",
    ],
  },
  {
    title: 'iPhone : réglages manuels',
    steps: [
      "Réglages > Confidentialité et sécurité > Localisation > Départements > Toujours.",
      "Réglages > Notifications > Départements > Autoriser les notifications.",
    ],
  },
  {
    title: 'Android : réglages manuels',
    steps: [
      "Paramètres > Applications > Départements > Autorisations > Localisation > Autoriser tout le temps.",
      "Paramètres > Applications > Départements > Notifications > activer les alertes.",
      "Si un service de premier plan apparaît (« Suivi de votre position »), c'est normal : il indique que l'app surveille les changements de département en arrière-plan.",
    ],
  },
  {
    title: 'Vérifier que tout fonctionne',
    steps: [
      "Ouvrez Notifications et contrôlez les deux lignes Autorisations système : Notifications « Autorisées » et Localisation « Toujours autorisée ».",
      "Activez « Passage de département » si ce n'est pas déjà fait.",
      "Testez en vous déplaçant (ou simulez un déplacement) : une alerte doit apparaître après avoir franchi une frontière de département.",
    ],
    paragraphs: [
      "Si vous venez de modifier les réglages système, revenez dans l'application : les statuts se mettent à jour automatiquement.",
    ],
  },
  {
    title: 'Dépannage',
    paragraphs: [
      "Le toggle « Passage de département » ne s'active pas : vous n'avez probablement pas choisi « Toujours autoriser ». Utilisez « Ouvrir les réglages système » dans la page Notifications.",
      "Pas d'alerte près d'une frontière : la précision GPS (~300 m) peut retarder ou fusionner deux départements proches. C'est voulu pour éviter les notifications intempestives.",
      "Expo Go (mode développement) : la localisation en arrière-plan n'est pas fiable. Installez une version compilée de l'application pour tester les alertes en déplacement.",
      "Autres catégories : « Département du jour » et « Actualités de l'application » seront disponibles dans de futures versions ; seul « Passage de département » envoie des alertes liées à la position aujourd'hui.",
    ],
  },
];
