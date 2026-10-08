# Mettre une boutique en ligne

Objectif : **une boutique qui accepte des réservations en 10 minutes**, sans formation et sans
intervention technique.

Version publique de ce guide, à partager avec le gérant : `/{locale}/guide`
(par exemple `https://bookedforreal.com/fr/guide`).

---

## 1. Ce que fait le gérant (6 étapes, ~10 min)

Les écrans sont dans cet ordre dans la barre latérale du tableau de bord.

| # | Écran | Durée | Ce qu'il remplit |
| - | ----- | ----- | ---------------- |
| 1 | Inscription | 1 min | Email, mot de passe, nom du salon |
| 2 | **Prestations** | 3 min | Nom FR/EN, durée, tarif, temps de nettoyage |
| 3 | **Équipe** | 1 min | Un prénom par personne qui prend des rendez-vous |
| 4 | **Horaires** | 2 min | Plages par personne, avec pause déjeuner |
| 5 | **Réglages** | 1 min | Téléphone du salon + « Recevoir un message de test » |
| 6 | Partage | 30 s | `bookedforreal.com/s/<slug>` dans la bio Instagram, Google, la vitrine |

### Les trois pièges à connaître

- **Un jour sans plage n'est pas réservable.** C'est le mécanisme normal pour fermer le dimanche
  et le lundi, pas un bug.
- **L'ordre compte.** Sans prestation il n'y a rien à réserver ; sans horaire il n'y a aucun
  créneau. Si le lien de réservation affiche « aucune disponibilité », c'est presque toujours
  une de ces deux étapes.
- **Le temps de nettoyage** est le délai entre deux rendez-vous. À 0 il n'y a aucune marge pour
  ranger le poste.

### Le raccourci qui fait gagner du temps

Sur l'écran Horaires : régler **un** jour, puis « Copier sur tous les jours ». Le gérant
n'ajuste ensuite que les exceptions. C'est la différence entre 2 minutes et 10 minutes.

---

## 2. Ce que tu fais de ton côté

À faire **une fois**, avant d'ouvrir des boutiques :

1. Configurer Twilio (voir la section Notifications du `README.md`) : `TWILIO_PHONE_NUMBER`,
   `TWILIO_WHATSAPP_NUMBER`, et les 4 modèles de contenu `TWILIO_CONTENT_*`.
2. Vérifier que `STRIPE_PRICE_*` et `DATABASE_URL` sont renseignés.
3. Faire une réservation de test sur `/{locale}/s/<slug>` et confirmer qu'elle apparaît dans
   le tableau de bord.

Tant qu'un modèle WhatsApp n'existe pas, les messages correspondants partent en SMS : rien
n'est bloqué, mais la facture monte.

### Pour faire une démonstration

`pnpm db:seed` crée trois salons de démonstration avec prestations, équipe et horaires déjà
remplis : `paris-marais`, `lyon-brotteaux`, `marseille-vieux-port`. Idéal pour montrer le
produit fini en rendez-vous commercial, sans créer de compte.

---

## 3. Contrôle en 2 minutes

Après l'installation d'une boutique, vérifier dans cet ordre :

- [ ] `/{locale}/s/<slug>` affiche le salon avec ses prestations et son équipe
- [ ] Le calendrier propose des créneaux sur un jour ouvré
- [ ] Aucun créneau n'est proposé un jour sans plage
- [ ] Une réservation de test remonte dans **Rendez-vous** avec le bon client
- [ ] Le téléphone du salon reçoit l'alerte de nouveau rendez-vous
- [ ] Le compteur de crédits WhatsApp/SMS baisse dans **Réglages**
- [ ] Le paiement Stripe se termine et le salon sort de l'essai

---

## 4. Dépannage express

| Symptôme | Cause probable | Correction |
| -------- | -------------- | ---------- |
| « Aucune disponibilité » | Aucun horaire sur ce jour, ou aucune prestation | Écrans Horaires et Prestations |
| Le salon n'apparaît pas sur `/{slug}` | Mauvais slug, ou essai expiré côté serveur | Vérifier le lien, puis l'essai dans Réglages |
| Pas de message WhatsApp | Modèle `TWILIO_CONTENT_*` manquant ou non approuvé | Vérifier Twilio ; sinon le SMS prend le relais |
| Aucun message du tout | Numéro non dialable, ou quota épuisé | Format du numéro, puis compteur de crédits |
| La page de réservation est fermée | Essai terminé sans abonnement | Le gérant souscrit depuis Réglages |

---

## 5. Pour aller plus loin

- `README.md` — vue d'ensemble, variables d'environnement, endpoints
- `docs/DEPLOYMENT.md` — mise en production
- `docs/SEO.md` — référencement
- `docs/MOBILE_BUILD.md` — builds iOS et Android
