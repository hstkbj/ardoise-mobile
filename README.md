# Ardoise Parents — application mobile (Expo SDK 54 / React Native)

Application des parents d'élèves : ils se connectent avec le **code d'accès** remis par l'école
et suivent chacun de leurs enfants.

| Onglet / écran | Contenu | API |
|---|---|---|
| Accueil | Moyenne et rang, absences, devoirs à faire, reste à payer, dernier bulletin, évolution des notes, annonces | `GET /parent/children`, `GET /parent/announcements` |
| Notes | Moyenne générale, **bulletins** (disponible / à venir / retenu pour impayés), moyennes par matière, toutes les notes | `GET /report-cards/{élève}`, `…/pdf` |
| Absences | Absences et retards, justification avec motif et pièce jointe (photo ou PDF) | `POST /parent/attendance/{id}/justify` |
| Paiements | Reste à payer, échéances, **paiement** (FedaPay ou demande à la comptabilité), reçus PDF | `POST /parent/payments/{id}/checkout`, `…/verify`, `GET /payments/{id}/receipt` |
| Plus | Notifications (et notifications push sur le téléphone), devoirs (cocher fait), emploi du temps, annonces, documents (+ demande au secrétariat), profil, déconnexion | voir `resources/openapi/parent.yaml` |

Les modules absents du plan de l'école (`features` de `/auth/me`) sont masqués. Avec plusieurs
enfants, un sélecteur en haut de chaque écran change l'enfant affiché partout.

## Identité

Mêmes logo, couleurs (vert ardoise `#1D5C4D`, jaune `#F2B33D`, neutres chauds), police (Instrument Sans)
et icônes que le site : `src/constants/theme.ts`, `src/components/Logo.tsx`, `src/components/Icon.tsx`.
Icône d'application et écran de démarrage : `assets/images/`.

## Démarrer

```bash
cd mobile
npm install
cp .env.example .env        # EXPO_PUBLIC_API_URL = adresse de l'API (IP de l'ordinateur en local)
npx expo start              # QR code à scanner avec Expo Go, ou touches i / a / w
```

Côté Laravel, lancez le serveur accessible depuis le téléphone : `php artisan serve --host=0.0.0.0`,
puis `php artisan ardoise:demo --fresh` affiche des codes parents de démonstration.

Contrôles : `npm run typecheck`, `npm run lint`.

## Publier

```bash
npm install -g eas-cli && eas login
eas build --profile preview --platform android   # APK à installer pour tester
eas build --profile production --platform all    # Play Store / App Store
eas submit --platform all
```

Adresse de l'API par environnement : `eas.json` (`EXPO_PUBLIC_API_URL`). Identifiants d'application :
`app.ardoise.parents` (`app.json`) — à remplacer par les vôtres avant la première publication.

## Organisation

```
src/app/              écrans (Expo Router) — (tabs)/ pour les onglets, payer/, justifier/, bulletin/ en fenêtres
src/components/       Logo, icônes, Text, Screen, cartes, boutons, tuiles, graphique, sélecteur d'enfant
src/providers/        session (jeton dans le trousseau du téléphone) et enfants (/parent/children)
src/lib/              client API, types (miroir de l'OpenAPI), formats fr-FR, téléchargement + partage
```

## Notifications push

Le parent reçoit une notification sur son téléphone, **même application fermée**, quand l'école valide une note
(« Awa · Mathématiques — Interrogation 2 : 14/20 »), signale une absence ou un retard, publie un bulletin, un devoir
ou une annonce, ou encaisse un paiement. Toucher la notification ouvre l'écran concerné, sur le bon enfant.
L'école choisit les événements dans **Paramètres › Destinataires** (canal « Push »).

Fonctionnement : à la connexion, l'application demande l'autorisation, obtient le jeton Expo du téléphone
(`src/lib/push.ts`) et l'envoie au serveur (`POST /parent/push-token`) ; à la déconnexion il est retiré. Le serveur
envoie par le service gratuit d'Expo, qui relaie vers Firebase (Android) et Apple (iOS).

**Mise en place (une seule fois)**

1. Projet Expo : `npm install -g eas-cli && eas login && eas init` — ajoute `extra.eas.projectId` dans `app.json`
   (nécessaire pour obtenir le jeton). Pensez à committer `app.json`.
2. Android — Firebase (gratuit) :
   - [console.firebase.google.com](https://console.firebase.google.com) → créer un projet → ajouter une application
     Android avec le package `app.ardoise.parents` → télécharger `google-services.json` et le placer à la racine
     du projet (ou, sur EAS : `eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json`) ;
   - Firebase → Paramètres du projet → Comptes de service → « Générer une nouvelle clé privée » (fichier JSON) ;
   - `eas credentials` → Android → production → Google Service Account → « Manage your Google Service Account Key
     for Push Notifications (FCM V1) » → envoyer ce fichier JSON.
3. iOS : compte Apple Developer ; `eas build -p ios` propose de créer la clé push (APNs) automatiquement.
4. Serveur : rien à configurer, mais le worker doit tourner (`php artisan queue:work`).

**Tester** : Expo Go ne reçoit pas les notifications push sur Android. Construisez une version de test,
`eas build --profile preview --platform android`, installez l'APK, connectez-vous avec un code parent, puis validez
une évaluation de son enfant depuis l'espace enseignant. Outil pratique : [expo.dev/notifications](https://expo.dev/notifications)
pour envoyer un message à un jeton `ExponentPushToken[…]`.

## Paiement en ligne

Quand l'école a activé FedaPay, « Payer » ouvre la page de paiement sécurisée dans le navigateur du
téléphone ; à la fermeture, l'application vérifie le paiement (`/parent/payments/verify`) et affiche
le résultat (le webhook confirme aussi le paiement côté serveur). Sans FedaPay, la demande est
transmise à la comptabilité de l'école, qui la confirme.
