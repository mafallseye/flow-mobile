# 📱 Flow Mobile — React Native (Expo) + Supabase

Version native iOS / Android de [Flow](https://task-app-nine-omega.vercel.app).
Même base Supabase que la version web : mêmes comptes, mêmes tâches, synchronisées en temps réel.

## Fonctionnalités
- Connexion / inscription e-mail (session persistante sur l'appareil)
- 4 onglets : Aujourd'hui · À venir · Toutes · Terminées (avec badges)
- Ajout via bouton flottant + panneau bas (priorité, échéance rapide ou calendrier natif)
- Cocher, modifier (appui sur le titre), changer la priorité, supprimer avec « Annuler »
- Retours haptiques, mode clair/sombre automatique (ou manuel), écran de démarrage et icônes

## Démarrer
```bash
cp .env.example .env      # renseigner URL + clé anon Supabase
npm install
npx expo start            # scanner le QR code avec l'app Expo Go
```

## Construire pour les stores (EAS)
```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://xxx.supabase.co --visibility plaintext --environment production --environment preview
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <clé anon> --visibility plaintext --environment production --environment preview
npx eas-cli@latest build --profile preview --platform android   # APK installable directement
npx eas-cli@latest build --profile production --platform all    # builds stores
npx eas-cli@latest submit --platform ios|android
```
Prérequis stores : compte Apple Developer (99 $/an) et Google Play Console (25 $ une fois).

## Sécurité
- Seule la clé **anon** est embarquée (extractible d'un binaire) : la protection repose sur la **RLS** de la table `tasks`
  (`auth.uid() = user_id` sur select/insert/update/delete) — voir le dépôt `task-app`, dossier `supabase/migrations`.
- Jamais de clé `service_role` dans l'app.

## Structure
```
App.js                    providers + routage session
src/lib/supabase.js       client (AsyncStorage, refresh au premier plan)
src/lib/useTasks.js       CRUD optimiste + temps réel (partagé avec le web)
src/lib/{dates,views}.js  logique métier partagée
src/theme.js              palette clair/sombre
src/components/           écrans et composants UI
```
