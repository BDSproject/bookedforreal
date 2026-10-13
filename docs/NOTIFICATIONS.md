# Notifications WhatsApp + SMS

Un rendez-vous déclenche jusqu'à trois messages, envoyés **WhatsApp d'abord**, puis
**SMS en repli** si WhatsApp échoue ou n'est pas configuré :

| Message | Destinataire | Quand |
| ------- | ------------ | ----- |
| Confirmation | client | dès la réservation |
| Rappel J-1 | client | 24 h avant |
| Alerte | numéro du salon | à chaque nouveau rendez-vous |

Les modèles vivent dans `apps/api/src/lib/notifications/messages.ts`.

## Combien de messages par réservation

```env
NOTIFY_MESSAGES="minimal"   # ou "full"
```

| Réglage | Ce qui part | Coût pour 100 RDV |
| ------- | ----------- | ----------------- |
| **`minimal`** (défaut) | **le rappel J-1 uniquement** | ~4 € |
| `full` | confirmation + rappel + alerte salon | ~12 € |

`minimal` est le défaut car **trois messages par réservation ne tiennent dans
aucun quota** : un Salon à 400 RDV dépenserait 48 € de SMS sur un abonnement de
39 €. Le rappel J-1 est le message qui fait réellement baisser les lapins, c'est
lui qu'on garde. Quand la réservation est trop proche pour un rappel (moins de
24 h), c'est la confirmation qui part — le client reçoit toujours exactement un
message.

La confirmation reste de toute façon couverte par **l'email de vérification**
(envoyé à la réservation), et le gérant voit les nouveaux RDV dans son agenda.

## Choisir le fournisseur

Deux fournisseurs sont branchés, et tous les deux gèrent **SMS et WhatsApp** —
le repli reste donc au même endroit :

| | Twilio | Telnyx |
| --- | --- | --- |
| WhatsApp | tarif Meta + ~0,005 € | tarif Meta + ~0,004 € |
| SMS France | ~0,080 € | ~0,004-0,05 € |
| Modèles | Twilio Content (`HX…`) | WhatsApp Manager de Meta (nom + langue) |

```env
NOTIFY_PROVIDER="telnyx"   # ou "twilio"
```

Si `NOTIFY_PROVIDER` est absent : Telnyx est utilisé **dès que `TELNYX_API_KEY`
existe**, sinon Twilio. Rien ne casse si les variables sont incomplètes : le
message retombe sur l'autre canal, puis échoue proprement dans le log.

## Les 4 modèles à créer

**Obligatoire** : WhatsApp refuse tout message métier qui n'est pas un modèle
approuvé. Les mêmes textes servent aux deux fournisseurs, seul l'identifiant change.

Placeholders, dans **cet ordre exact** :
`{{1}}` salon · `{{2}}` date · `{{3}}` heure · `{{4}}` prestation · `{{5}}` client

| Rôle | Texte (FR) | Variables |
| ---- | ---------- | --------- |
| Confirmation | `RDV confirmé chez {{1}} le {{2}} à {{3}}. À bientôt !` | 1, 2, 3 |
| Rappel | `Rappel : RDV chez {{1}} le {{2}} à {{3}}. À demain !` | 1, 2, 3 |
| Alerte salon | `Nouveau RDV : {{5}}, {{2}} à {{3}} ({{4}}).` | 2, 3, 4, 5 |
| Test | `Bookedforreal : vos rappels WhatsApp et SMS fonctionnent` | aucune |

Catégorie **Utility** (transactionnel). L'approbation Meta prend 24-48 h.

## Option A — Twilio

1. Compte sur [twilio.com](https://www.twilio.com) → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
2. **Messaging → Senders → WhatsApp** : le *sandbox* pour tester en 2 minutes,
   ou un vrai expéditeur WhatsApp (compte Meta Business requis) en production
3. Un numéro SMS → `TWILIO_PHONE_NUMBER`
4. Créer les 4 modèles dans **Content Template Builder** → `HX…` dans les
   `TWILIO_CONTENT_*`

## Option B — Telnyx

1. Compte sur [portal.telnyx.com](https://portal.telnyx.com) (vérification KYC)
2. **API Keys** → créer une clé → `TELNYX_API_KEY`
3. **Numbers → Buy a number** (numéro FR) → `TELNYX_PHONE_NUMBER`
4. **Messaging → Messaging Profiles** → créer un profil et y rattacher le numéro
5. **Messaging → WhatsApp → Get Started** → connecte ton **Meta Business Manager**,
   crée le WABA et enregistre le numéro → `TELNYX_WHATSAPP_NUMBER`
6. Créer les 4 modèles → `TELNYX_TEMPLATE_*` (le **nom** du modèle, ou son UUID),
   `TELNYX_TEMPLATE_LANGUAGE` valant `fr` par défaut

Guide officiel : [How to Set Up WhatsApp on Telnyx](https://support.telnyx.com/en/articles/13986485-how-to-set-up-whatsapp-on-telnyx)

### Prérequis côté Meta (les deux options)

- Un **Meta Business Manager** ([business.facebook.com](https://business.facebook.com)) —
  un simple compte Facebook ne suffit pas
- La **vérification d'entreprise** (documents légaux) : indispensable en production,
  c'est elle qui prend le plus de temps
- Un **numéro qui n'est sur aucun WhatsApp** (ni l'app perso, ni WhatsApp Business)
- Telnyx demande que le numéro WhatsApp soit **un numéro Telnyx**

## Tester

Dashboard → **Réglages → « Recevoir un message de test »**. Ça envoie le modèle
`TEST` sur le numéro du salon, et le compteur de crédits baisse.

## Dépannage

| Symptôme | Cause probable |
| -------- | -------------- |
| Le message part en SMS | Modèle manquant ou non approuvé → c'est le repli normal |
| `Twilio 401` | Clé API fausse |
| `Telnyx 403` | Numéro non rattaché au *messaging profile* |
| `Telnyx 40008` | Modèle en attente, rejeté ou suspendu par Meta |
| Rien du tout | Numéro non dialable (format) ou quota du plan épuisé |

Les numéros sont normalisés en E.164 avant envoi : un client sans numéro
dialable est simplement ignoré, sans consommer de crédit.
