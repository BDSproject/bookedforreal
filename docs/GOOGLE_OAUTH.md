# Configurer « Se connecter avec Google »

Le bouton Google (compte client) ne fonctionne qu'une fois le client OAuth créé côté Google.
Sans lui, le bouton est masqué et seuls email + mot de passe restent disponibles — rien ne casse.

## 1. Créer le client OAuth

1. Ouvrir la [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** →
   **Credentials**.
2. **Créer des identifiants** → **ID client OAuth** → type **Application Web**.
3. **Origines JavaScript autorisées** : `https://bookedforreal.com` (et `http://localhost:3000`
   pour le développement).
4. **URI de redirection autorisés** : on n'utilise pas le flux de redirection — le bouton
   renvoie un jeton d'identité directement au navigateur. Laisser vide, ou ajouter
   `https://bookedforreal.com` si Google l'exige.
5. Copier l'**ID client**.

## 2. Renseigner les variables

```env
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
```

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` est chargé par le navigateur (bouton).
- `GOOGLE_CLIENT_ID` est lu par l'API pour vérifier la signature du jeton.

## 3. Comment ça marche

Le bouton Google (Google Identity Services) renvoie un **jeton d'identité** (JWT signé par
Google). Le navigateur l'envoie à `POST /auth/client/google` ; l'API vérifie la signature
avec `google-auth-library`, lit `email` et `sub`, puis crée ou retrouve le compte client par
email. Comme Google a déjà prouvé que l'inbox existe, l'email est marqué confirmé.

## Vérification

1. Configurer l'ID client en dev et recharger `/fr/client/login`.
2. Cliquer **Continuer avec Google**, choisir un compte.
3. Vérifier dans la base que `client_accounts` contient la ligne avec `googleId` et
   `emailVerified = true`.

Sans `GOOGLE_CLIENT_ID` côté API, `POST /auth/client/google` répond `401 GOOGLE_NOT_CONFIGURED`.
