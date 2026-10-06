# SEO & visibilité IA (Google Search)

Ce document résume ce qui est **implémenté dans le code** et ce qui reste à faire
**hors du code** pour être visible dès la mise en ligne — y compris dans les
fonctionnalités IA de Google (AI Overviews, AI Mode).

---

## 1. Technique (fait ✅)

| Élément | État |
| --- | --- |
| Rendu SSR/SSG (contenu dans le HTML, pas seulement en JS) | ✅ |
| `<title>` + `<meta description>` uniques par page | ✅ |
| `canonical` + `hreflang` (fr / en / x-default) | ✅ |
| `sitemap.xml` dynamique | ✅ |
| `robots.txt` (+ `noindex` sur les zones privées) | ✅ |
| OpenGraph + Twitter cards + image de partage générée | ✅ |
| Image OG par salon (`/[locale]/s/[slug]/opengraph-image`) | ✅ |
| Page 404 dédiée | ✅ |
| `max-snippet:-1`, `max-image-preview:large` | ✅ |
| Responsive / mobile-first | ✅ |
| URLs descriptives + dossiers thématiques (`/coiffeur`, `/barber`, `/blog`) | ✅ |

## 2. E-E-A-T & confiance (fait ✅)

Google insiste sur le **« Who / How / Why »**. Sont en place :

- **À propos** (`/fr/about`), **Contact**, **Mentions légales**, **Confidentialité**, **CGV**
- **Bylines** sur les articles de blog (« L'équipe Bookedforreal ») + `Article.author` en JSON-LD
- Liens footer vers toutes ces pages
- `Organization` + `WebSite` en JSON-LD (knowledge panel)

## 3. Contenu (fait ✅ / à poursuivre)

- **Villes sans salon → `noindex, follow`** : évite le *scaled content abuse* (pages
  quasi identiques produites en masse). Elles deviennent indexables dès qu'un salon
  s'y inscrit.
- **Sitemap allégé** : seules les villes **ayant un salon** y figurent.
- Blog : 10 articles FR/EN.

**À poursuivre** : privilégier du **contenu non-commodity** (vécu, données réelles,
études de cas) plutôt que des listicles génériques. Ex. : « Ce qu'on a appris en
accompagnant 30 salons sur 6 mois », plutôt que « 7 astuces pour … ».

## 4. Réservation & agents IA (fait ✅)

Ce guide mentionne explicitement les agents qui *« réservent un rendez-vous »*.
Mesures appliquées :

- **JSON-LD `ReserveAction`** sur chaque salon → expose l'action de réservation
  (`potentialAction.target.urlTemplate` = l'URL de réservation).
- **CTA « Réserver » fonctionnel** sur la page salon (link vers `/s/<slug>/book`).
- **Parcours de réservation sémantique et accessible** : vrais `<button>` (au lieu de
  `<div>` cliquables), `<form>` réel, `<fieldset>/<legend>`, labels associés
  (`htmlFor`/`id`), `aria-pressed`, `role="alert"`, `autocomplete`.
- **Sections labellisées** (`<section aria-labelledby>`) sur la page salon.

Ces choix aident **les lecteurs d'écran** (accessibility tree) **et** les agents
navigateurs qui analysent le DOM / l'arbre d'accessibilité.

## 5. Ce qu'il faut IGNORER (Google le dit explicitement)

- ❌ **`llms.txt`** et autres fichiers « spéciaux » → *Google Search ignore them*.
- ❌ **« Chunking »** du contenu en petits morceaux.
- ❌ **Réécrire pour l'IA** / chasser la longue traîne.
- ❌ **Rechercher des « mentions » inauthentiques**.
- ❌ **Sur-optimiser les données structurées** (pas requises pour l'IA, utiles pour les rich results).
- ❌ `meta keywords`, keyword stuffing, longueur de contenu magique.

## 6. À faire au moment de la mise en ligne (hors code)

1. **Domaine + HTTPS** (obligatoire) et `NEXT_PUBLIC_APP_URL` en `https://…`.
2. **Google Search Console** : valider le domaine, soumettre `sitemap.xml`, puis
   consulter le rapport **« Performances IA génératives »**.
3. **Google Business Profile** : créer la fiche de Bookedforreal (recommandé par le
   guide pour les *local business details* et les réponses IA).
4. **Vérifier l'éligibilité** : inclure le site dans les fonctionnalités IA de
   Search Console.
5. **PageSpeed Insights** après déploiement (Core Web Vitals).
6. Partager le lien (réseaux, communautés de coiffeurs) → les liens entrants restent
   le principal vecteur de découverte.

## 7. Mesure

- **Search Console** → Performances (requêtes, clics, impressions) + rapport IA.
- **Umami** (analytics, optionnel via `NEXT_PUBLIC_UMAMI_*`).
- ⚠️ Méfiance envers les outils tiers qui promettent des « métriques internes Google » :
  aucun n'y a accès.

## 8. Maintenance technique (audit)

Vérifié sur le site en fonctionnement :

| Contrôle | Résultat |
| --- | --- |
| Ressources (CSS, JS, logo) **non bloquées** par robots.txt | ✅ |
| Ressources servies aux robots (`/_next/...` → 200) | ✅ |
| **Vrais 404** (pas de soft 404) sur page inconnue / salon inconnu / article inconnu | ✅ 404 |
| Redirect **308** (équivalent 301) sur slug salon migré | ✅ |
| `robots.txt` pour le crawl + `noindex` pour l'indexation (jamais l'inverse) | ✅ |
| Sitemap : uniquement les pages indexables | ✅ |
| hreflang fr / en / x-default | ✅ |
| Compression | 126 Ko → **18,6 Ko** (gzip) |
| CSS critique | 22,7 Ko |
| JS partagé (First Load) | 87,3 Ko |
| Polices | auto-hébergées + `preload` + `display: swap` |
| Favicon fourni (`icon.png` 512×512 + apple-touch-icon) | ✅ |

**À surveiller dans le temps :**

- **Search Console → Indexation des pages** : repérer les *soft 404* et les pages
  « explorée, non indexée ».
- **Core Web Vitals** (Search Console + PageSpeed Insights) après déploiement réel.
- **Ne pas bloquer le logo** dans robots.txt : Google en a besoin pour le knowledge
  panel (`Organization.logo`).
- Lors d'un **changement d'URL** : toujours un 301 + mise à jour du sitemap.
- Avant un **changement de domaine** : suivre la procédure officielle de migration de
  site (Search Console → « Changement d'adresse »).
