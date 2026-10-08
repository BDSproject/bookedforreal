# Configurer Stripe

Tout ce que le code attend, avec les montants exacts. Les valeurs viennent de
`apps/api/src/lib/plans.ts` et de `packages/i18n/messages/{fr,en}.json` : si vous changez un
prix ici, changez-le aussi là-bas.

## Ce qu'il faut créer

| Offre | Produit Stripe | Montant | Type | Variable d'environnement |
| ----- | -------------- | ------- | ---- | ------------------------ |
| À l'usage | Bookedforreal — À l'usage | **0,50 €** par rendez-vous | Au compteur, mensuel, cumul | `STRIPE_PRICE_USAGE` |
| Solo | Bookedforreal — Solo | **19,00 €** | Abonnement mensuel | `STRIPE_PRICE_SOLO` |
| Solo annuel | Bookedforreal — Solo | **180,00 €** | Abonnement annuel | `STRIPE_PRICE_SOLO_YEARLY` |
| Salon | Bookedforreal — Salon | **39,00 €** | Abonnement mensuel | `STRIPE_PRICE_SALON` |
| Salon annuel | Bookedforreal — Salon | **372,00 €** | Abonnement annuel | `STRIPE_PRICE_SALON_YEARLY` |
| Groupe | — | Sur devis | — | *aucun tarif* |

**Groupe n'a pas besoin de tarif Stripe.** `checkoutSchema` n'accepte que `USAGE`, `SOLO` et
`SALON` : cette offre se vend sur devis et se facture à la main.

L'annuel correspond à 15 €/mois (180 ÷ 12) et 31 €/mois (372 ÷ 12), soit exactement les
montants affichés sur la page tarifs.

## En une commande

```bash
# 1. Voir ce qui sera créé, sans appeler Stripe
node scripts/setup-stripe.mjs --dry-run

# 2. Créer en mode test
STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.mjs

# 3. Une fois validé, créer en production
STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe.mjs --live
```

Le script est **idempotent** : relancé, il réutilise les produits et les tarifs existants au
lieu de les dupliquer. Il refuse une clé `sk_live_` sans `--live`. À la fin il affiche le bloc
`STRIPE_PRICE_*` à coller dans l'environnement de l'API.

## À la main, si vous préférez

1. **Produits** → créez un produit par offre, sauf Groupe.
2. Dans chaque produit, ajoutez les tarifs :
   - **Solo** : 19,00 € récurrent / mensuel, puis 180,00 € récurrent / annuel
   - **Salon** : 39,00 € récurrent / mensuel, puis 372,00 € récurrent / annuel
   - **À l'usage** : 0,50 € récurrent / mensuel, avec **Mode de facturation : au compteur**,
     **Unité de facturation : par unité**, **Agrégation : somme**
3. Reportez chaque identifiant `price_...` dans la variable correspondante.

⚠️ Le tarif À l'usage doit être **au compteur**. `reportBookingUsage()` cherche l'item au
compteur dans l'abonnement pour l'incrémenter : si le tarif est un abonnement classique, aucun
rendez-vous n'est facturé et le plan devient gratuit.

## Webhook

**Développeurs → Webhooks → Ajouter un point de terminaison**

- URL : `https://<votre-domaine-api>/webhooks/stripe`
- Événements : `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
  `customer.subscription.deleted`
- Copiez la clé de signature `whsec_...` dans `STRIPE_WEBHOOK_SECRET`

Le webhook est la **seule** source de vérité pour activer un plan. Sans lui, un client peut
payer et rester bloqué en essai : `syncSubscriptionFromEvent()` ne reçoit jamais l'événement.

## Portail client

**Paramètres → Portail client** : activez l'annulation d'abonnement et la mise à jour du moyen
de paiement, et autorisez les produits Bookedforreal. Sans cette configuration,
`POST /billing/portal` renvoie une erreur et le client ne peut pas résilier lui-même.

## TVA

Les prix sont affichés **HT**. Le script crée les tarifs avec `tax_behavior: exclusive`, donc
la TVA s'ajoute au moment du paiement. Activez Stripe Tax si vous facturez la TVA ; si vous
êtes en franchise en base, Stripe Tax ne collecte rien et le prix HT est le prix payé.

## Essai gratuit

L'application gère l'essai de 7 jours elle-même, **sans carte bancaire** à l'inscription. Les
jours restants sont transmis à Stripe au moment de l'abonnement via `trial_period_days`, donc
la première facture tombe à la fin de l'essai. Le plan À l'usage n'a pas d'essai Stripe : il
n'y a rien à facturer au mois.

## Changer un prix plus tard

Un tarif Stripe est **immuable**. Pour passer du tarif de lancement au tarif public
(29 € / 59 €) :

1. Créez de nouveaux tarifs dans le même produit
2. Mettez à jour `STRIPE_PRICE_SOLO` et `STRIPE_PRICE_SALON` en production
3. Ajustez `packages/i18n/messages/{fr,en}.json` : `priceMonthly` et `pricePublicMonthly`

Les abonnés existants conservent leur ancien tarif — c'est voulu, et c'est ce qui permet
d'annoncer « tarif bloqué à vie ».

### Le badge « -20 % »

L'annuel est à 15 €/mois et 31 €/mois, soit **-21 %** et **-20,5 %** par rapport au mensuel,
pas exactement -20 %. Pour être au chiffre rond : 182,40 €/an et 374,40 €/an, avec 15,20 € et
31,20 € affichés.

## Vérifier que tout est branché

1. Renseignez `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et les cinq `STRIPE_PRICE_*`
2. Créez un compte, allez dans **Réglages**, cliquez sur un abonnement
3. Payez avec `4242 4242 4242 4242`, une date future et n'importe quel CVC
4. Contrôlez dans Stripe que l'événement `checkout.session.completed` est parti en **200**
5. Sur `/salons/me`, le `plan` doit avoir changé et `trial.expired` être passé à `false`
6. Testez **Gérer mon abonnement** : le portail client doit s'ouvrir

Pour le plan À l'usage, vérifiez en plus qu'un rendez-vous pris en ligne apparaît comme
utilisation dans l'abonnement Stripe.
