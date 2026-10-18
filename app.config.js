const fs = require('fs');

/**
 * Configuration dynamique : reprend app.json et ajoute le fichier Firebase d'Android
 * (notifications push) seulement s'il est présent, pour que les autres builds fonctionnent sans.
 *   - en local : google-services.json à la racine du projet ;
 *   - sur EAS : variable d'environnement de type fichier GOOGLE_SERVICES_JSON (voir README).
 */
module.exports = ({ config }) => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);

  return {
    ...config,
    android: { ...config.android, ...(googleServicesFile ? { googleServicesFile } : {}) },
  };
};
