# Publier l'application mobile (iOS & Android)

L'app est une app **Expo (SDK 51)** avec expo-router, NativeWind, React Query et un
client API (`apps/mobile/lib/api.ts`) qui pointe vers le même backend Fastify que le
web. Le build passe par **EAS Build** (cloud) : pas besoin de Xcode ni d'Android Studio
en local.

---

## 1. Prérequis (comptes)

| Compte | Nécessaire pour | Coût |
| --- | --- | --- |
| **Expo** (EAS) | Construire dans le cloud, gérer les builds | Gratuit |
| **Apple Developer** | Build iOS + publication App Store | 99 $ / an |
| **Google Play Developer** | Publication Android | 25 $ (une fois) |

Outils en local :

```bash
npm install -g eas-cli      # CLI EAS
eas login                   # connexion au compte Expo
```

---

## 2. Configurer l'URL de l'API (obligatoire)

L'app lit `EXPO_PUBLIC_API_URL` (`apps/mobile/lib/api.ts`), qui vaut par défaut
`http://localhost:4000` (inutilisable sur un téléphone réel).

Ajoute-la dans `apps/mobile/eas.json` pour chaque profil de build :

```jsonc
{
  "build": {
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_URL": "https://api.bookedforreal.com" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://api.bookedforreal.com" }
    }
  }
}
```

> ⚠️ L'API doit être **accessible en HTTPS publiquement** depuis un téléphone. En
> local, utilise un tunnel (`ngrok http 4000`) et mets son URL dans `EXPO_PUBLIC_API_URL`.

---

## 3. Icône d'app + écran de démarrage (actuellement absents)

`app.json` ne référence **aucune icône** : l'app part avec l'icône Expo par défaut.
Crée un dossier `apps/mobile/assets/` avec :

- `icon.png` — 1024 × 1024 px (icône iOS/Android)
- `adaptive-icon.png` — 1024 × 1024 px (Android adaptive, avec marge de sécurité)
- `splash-icon.png` — 1024 × 1024 px (écran de démarrage)

Puis référence-les dans `app.json` :

```jsonc
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#7C3AED"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#7C3AED"
      }
    }
  }
}
```

> 💡 Tu peux générer ces images à partir du logo (fond violet #7C3AED + monogramme
> blanc). Dis-le-moi si tu veux que je les génère avec le logo BFR.

---

## 4. Lier le projet à EAS (une seule fois)

`eas.json` existe déjà, mais le projet n'est pas encore rattaché à un projet EAS :

```bash
cd apps/mobile
eas init          # crée le projet EAS et écrit extra.eas.projectId dans app.json
```

---

## 5. Construire (EAS Build — cloud)

### Build de **production** (pour les stores)

```bash
cd apps/mobile

# iOS → .ipa
eas build --platform ios --profile production

# Android → .aab (Android App Bundle, format requis par le Play Store)
eas build --platform android --profile production
```

- **iOS** : EAS va te demander de te connecter à ton compte Apple Developer puis
  gère automatiquement les **certificats et profils de provisionnement**.
- **Android** : EAS génère et stocke la **keystore** de signature (gérée par EAS).

### Build de **test** (distribution interne)

```bash
eas build --platform ios --profile preview      # .ipa à installer via un lien
eas build --platform android --profile preview  # .apk à installer via un lien
```

Le profil `preview` (`distribution: "internal"`) génère un lien d'installation pour
tester sans passer par les stores.

---

## 6. Tester sur un appareil

- **Développement rapide** : `pnpm --filter @bookedforreal/mobile start` puis scanner
  le QR code avec **Expo Go** (mais `expo-secure-store`/`expo-notifications` marchent
  mieux en build natif).
- **iOS (avant la sortie)** : `eas submit --platform ios` vers **TestFlight**, ou
  installe le `.ipa` du profil `preview`.
- **Android** : installe le `.apk` du profil `preview`, ou utilise le canal
  **internal testing** de Google Play.

---

## 7. Publier sur les stores

```bash
cd apps/mobile

# iOS — App Store (TestFlight puis App Store)
eas submit --platform ios

# Android — Google Play
eas submit --platform android
```

Avant la première soumission :

- **iOS** : complète la fiche App Store Connect (description, captures d'écran,
  classification, confidentialité).
- **Android** : complète la fiche Play Console (description, captures, contenu
  sensible, politique de confidentialité).

---

## 8. CI/CD (déjà branché)

`.github/workflows/ci.yml` build déjà le mobile :

- **PR** → `eas build --platform all --profile preview` (aperçu)
- **`main`** → `eas build --platform all --profile production`

Il utilise le secret GitHub **`EXPO_TOKEN`** (un token d'accès Expo). À créer :

```bash
# dans ton terminal
gh secret set EXPO_TOKEN --repo BDSproject/bookedforreal
```

*(un token Expo se génère dans expo.dev → Account → Access Tokens)*

---

## Récapitulatif des identifiants

| Champ | Valeur actuelle (`app.json`) |
| --- | --- |
| Nom | Bookedforreal |
| slug Expo | `bookedforreal` |
| schéma (deep link) | `bookedforreal` |
| iOS bundleIdentifier | `com.bookedforreal.app` |
| Android package | `com.bookedforreal.app` |

> ⚠️ Vérifie que `com.bookedforreal.app` est **libre** (App Store + Play Store) avant
> le premier build. S'il est pris, change-le (ex. `com.bookedforreal.mobile`).

---

## Ordre conseillé de mise en ligne

1. Ajoute l'**icône + splash** (§3).
2. Définis `EXPO_PUBLIC_API_URL` (§2).
3. `eas init` puis un **build preview** (§5) → teste sur ton téléphone.
4. Corrige ce qui ne va pas, puis **build production** (§5).
5. **TestFlight** (iOS) / **internal testing** (Android) (§7).
6. Soumets aux stores (§7) une fois validé.
