# Déployer sur O2switch (mutualisé) et continuer à développer

O2switch mutualisé fait tourner Node.js via **Phusion Passenger** (outil cPanel
« Setup Node.js App ») : pas de PM2, pas de Nginx, pas de ports libres, et les
dépendances s'installent avec **npm**. Notre monorepo (pnpm + TypeScript + Turborepo)
ne s'y déploie donc pas directement — on **construit en local** puis on envoie deux
dossiers prêts à l'emploi.

Architecture cible :

```
bookedforreal.com      → O2switch Node #1  (Next.js standalone)
api.bookedforreal.com  → O2switch Node #2  (Fastify)
Neon                   → la base (inchangée)
```

---

## 1. Construire les bundles (en local, à chaque mise en ligne)

```bash
NEXT_PUBLIC_APP_URL=https://bookedforreal.com \
NEXT_PUBLIC_API_URL=https://api.bookedforreal.com \
DATABASE_URL="postgresql://…" \
bash deploy/build-bundle.sh
```

Ça crée :

| Dossier | Contenu | Fichier de démarrage |
| ------- | ------- | -------------------- |
| `deploy-out/api` | Fastify compilé + `node_modules` de prod | `dist/server.js` |
| `deploy-out/web` | Next.js (build `.next` + `next start`) | `start.js` |

Les bundles **contiennent déjà `node_modules`** : on ne relance jamais
`npm install` côté O2switch (le `package.json` est retiré exprès pour ça).

## 2. Envoyer sur O2switch

Par **SSH** (recommandé) ou FTP :

```bash
scp -r deploy-out/api  USER@ssh.o2switch.net:~/bookedforreal-api
scp -r deploy-out/web  USER@ssh.o2switch.net:~/bookedforreal-web
```

> Ne mets jamais le dossier d'application **dans** le dossier du domaine (risque
> d'exposer les sources si l'app est stoppée). Deux dossiers séparés, comme ci-dessus.

## 3. Créer les deux applications dans cPanel

**cPanel → Setup Node.js App → Create Application** (une fois pour l'API, une fois pour le web).

### L'API

| Champ | Valeur |
| ----- | ------ |
| Node.js version | 20 |
| Application mode | Production |
| Application root | `bookedforreal-api` |
| Application URL | `api.bookedforreal.com` |
| Application startup file | `dist/server.js` |

### Le web

| Champ | Valeur |
| ----- | ------ |
| Node.js version | 20 |
| Application mode | Production |
| Application root | `bookedforreal-web` |
| Application URL | `bookedforreal.com` (et `www`) |
| Application startup file | `start.js` |

## 4. Variables d'environnement (bouton « Add Variable »)

### Sur l'API

```
DATABASE_URL        (Neon)
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
CORS_ORIGIN         https://bookedforreal.com
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_USAGE / STRIPE_PRICE_SOLO / STRIPE_PRICE_SOLO_YEARLY
STRIPE_PRICE_SALON / STRIPE_PRICE_SALON_YEARLY
TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER / TWILIO_WHATSAPP_NUMBER
TWILIO_CONTENT_CONFIRMATION / _REMINDER / _OWNER_ALERT / _TEST
GOOGLE_CLIENT_ID
BREVO_API_KEY / BREVO_SENDER_EMAIL
```

### Sur le web

```
DATABASE_URL        (nécessaire si une page SSR relit la base à la demande)
NEXT_PUBLIC_APP_URL = https://bookedforreal.com
NEXT_PUBLIC_API_URL = https://api.bookedforreal.com
```

> `NEXT_PUBLIC_*` est figé **au build** : change-les dans `build-bundle.sh` et
> reconstruis, pas seulement côté cPanel.

## 5. Migrations de la base (une fois, en local)

La base reste sur Neon. Lance les migrations depuis ta machine :

```bash
DATABASE_URL="postgresql://…" pnpm db:migrate:deploy
```

## 6. Domaine + SSL

1. Dans l'espace client O2switch, crée le sous-domaine `api.bookedforreal.com`
   (ou utilise la « App URI » qui fait le lien).
2. Laisse O2switch générer le SSL (Let's Encrypt automatique).
3. Vérifie `https://api.bookedforreal.com/health` → `{"status":"ok"}`.

## 7. Webhook Stripe

Une fois l'API en ligne : Dashboard Stripe → Webhooks → URL
`https://api.bookedforreal.com/webhooks/stripe`.

## 8. Vérifier

- [ ] `https://api.bookedforreal.com/health` → ok
- [ ] `https://bookedforreal.com/fr` charge
- [ ] `https://bookedforreal.com/fr/s/paris-marais` affiche horaires + tarifs
- [ ] Une réservation de test remonte dans l'agenda
- [ ] Le webhook Stripe répond 200

---

## Continuer à développer

Le déploiement n'empêche rien en local :

1. Tu développes et commit normalement (la base de dev reste sur Neon ou Docker)
2. Quand tu veux publier : `git push`, puis relance `deploy/build-bundle.sh` et
   ré-envoie les deux dossiers
3. Redémarre l'app dans cPanel (bouton **Restart**) — ou recrée le bundle et remplace

### Astuce pour aller plus vite

Ajoute dans ton `~/.ssh/config` un alias :

```
Host o2switch
  HostName ssh.o2switch.net
  User VOTRE_IDENTIFIANT
```

puis : `rsync -avz --delete deploy-out/api o2switch:~/bookedforreal-api`

## Limites connues du mutualisé

- **Pas de PM2** : Passenger relance l'app, mais pas de cluster ni de scaling fin
- **Pas de compilateur** (`gcc`/`node-gyp` bloqués) : on utilise `@node-rs/argon2` et
  Prisma avec des binaires précompilés, donc ça passe. Si une future dépendance
  native exige une compilation, il faudra demander l'accès au support
- **Une app = un dossier** : web et API sont deux « Setup Node.js App » séparés
