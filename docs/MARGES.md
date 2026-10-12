# Marge — calcul détaillé

Tout est ramené à **l'euro par client et par mois**. Les hypothèses sont en haut,
les chiffres se recalculent en changeant une ligne.

## 1. Hypothèses

| Poste | Valeur | Pourquoi |
| ----- | ------ | -------- |
| Frais Stripe | **1,5 % + 0,25 €** | carte européenne, facturé **une fois par mois** (l'usage au compteur est agrégé) |
| Messages par rendez-vous | **3** | confirmation client + rappel J‑1 client + alerte salon |
| Coût d'un WhatsApp | **0,035 €** | tarif Meta utilitaire France + marge BSP |
| Coût d'un SMS (Twilio) | **0,074 €** | tarif France |
| Coût d'un SMS (Telnyx) | **0,040 €** | tarif annoncé, frais opérateur inclus |
| Part de repli SMS | **20 %** | part des clients sans WhatsApp |

**Coût d'un message mélangé** (80 % WhatsApp / 20 % SMS) : **0,0428 €** avec Twilio,
**0,0360 €** avec Telnyx
**Coût d'un rendez-vous** (3 messages) : **0,128 €** avec Twilio, **0,108 €** avec Telnyx

## 2. Marge par plan — quota de crédits entièrement consommé

C'est le cas le plus défavorable : le client utilise tous ses crédits.

| Plan | Prix | Crédits couvrent | CA | Stripe | Messages | **Marge** | % |
| ---- | ---- | ---------------- | -- | ------ | -------- | --------- | - |
| À l'usage | 0 € + 0,50 €/RDV | 16 RDV | 8,33 € | 0,38 € | 2,14 € | **5,82 €** | 70 % |
| Solo | 19 € | 33 RDV | 19,00 € | 0,53 € | 4,28 € | **14,18 €** | 75 % |
| Salon | 39 € | 133 RDV | 39,00 € | 0,83 € | 17,12 € | **21,04 €** | 54 % |
| Groupe | 199 € (exemple) | 667 RDV | 199,00 € | 3,23 € | 85,60 € | **110,16 €** | 55 % |

Deux enseignements :

- **Solo est le meilleur plan** en pourcentage (75 %), et c'est celui qui a le moins de chances d'épuiser ses crédits
- **Salon a la marge la plus faible** (54 %) : 400 crédits coûtent 17 € sur un abonnement de 39 €. Et ces 400 crédits ne couvrent que **133 rendez-vous** alors que le plan en autorise 400

## 3. Le plan « À l'usage » — attention aux 0,25 € de Stripe

Sur un prélèvement de 0,50 €, les 0,25 € fixes de Stripe représentent **la moitié du montant**. C'est ce qui rend le paiement à l'unité dangereux

| | Par rendez-vous |
| - | --------------- |
| Encaissé | 0,500 € |
| Stripe (1,5 % + 0,25 €) | −0,258 € |
| Messages (3 × 0,0428 €) | −0,128 € |
| **Marge** | **0,114 €** (23 %) |

**Mais Stripe agrège l'usage au compteur et facture une seule fois par mois.**
Le 0,25 € est donc amorti sur tous les rendez-vous du mois, pas prélevé à chaque fois :

| Rendez-vous dans le mois | Marge |
| ------------------------ | ----- |
| 1 | 0,11 € (23 %) |
| 10 | 3,02 € (60 %) |
| 16 (crédits épuisés) | 5,82 € (70 %) |
| 50 | 22,24 € (89 %) |

Au-delà de 16 rendez-vous, **les rappels s'arrêtent** (quota de 50 crédits) alors que la
facturation continue. C'est le vrai point faible de ce plan : la marge monte, mais
la promesse casse.

## 4. Au tarif public (Solo 29 €, Salon 59 €)

| Plan | CA | Stripe | Messages | Marge | % |
| ---- | -- | ------ | -------- | ----- | - |
| Solo | 29,00 € | 0,69 € | 4,28 € | **24,04 €** | 83 % |
| Salon | 59,00 € | 1,14 € | 17,12 € | **40,75 €** | 69 % |

Passer du tarif de lancement au tarif public fait gagner **+10 € sur Solo** et
**+20 € sur Salon**, sans changer le coût d'un centime.

## 5. Sensibilité — ce qui compte vraiment

Marge du plan Solo (19 €, 100 crédits) selon la part de messages qui tombent en SMS :

| SMS via | 0 % | 10 % | 20 % | 40 % | 80 % |
| ------- | --- | ---- | ---- | ---- | ---- |
| **Twilio** | 14,96 € | 14,57 € | 14,18 € | 13,40 € | **11,84 €** |
| **Telnyx** | 14,96 € | 14,91 € | 14,86 € | 14,76 € | **14,56 €** |

Deux conclusions :

1. **Changer de fournisseur ne rapporte presque rien** tant que WhatsApp fonctionne
   (14,18 € vs 14,86 €, soit 0,68 €)
2. **En revanche, si beaucoup de clients n'ont pas WhatsApp, Telnyx protège la marge** :
   à 80 % de repli, on perd 3,12 € avec Twilio et seulement 0,40 € avec Telnyx

## 6. Coûts fixes et seuil de rentabilité

| Poste | Au démarrage | À l'échelle |
| ----- | ------------ | ----------- |
| Neon (base) | 0 € (offre gratuite) | ~18 €/mois |
| Hébergement O2switch | ~7 €/mois | ~15 €/mois |
| Nom de domaine | ~1 €/mois | ~1 €/mois |
| Brevo, Sentry, Umami | 0 € (offres gratuites) | 0-25 €/mois |
| **Total** | **~8 €/mois** | **~35-60 €/mois** |

**Seuil de rentabilité : 1 client Solo suffit** au démarrage (14,18 € de marge pour
8 € de coûts fixes). À l'échelle, il faut 3 clients Solo

## 7. Portefeuille type

Mix retenu : 60 % Solo, 15 % Salon, 25 % à l'usage — l'à-usage étant la porte d'entrée
qui convertit ensuite vers Solo. Soit **13,12 € de marge par client et par mois**.

| Clients | Marge brute/mois | Coûts fixes | **Marge nette/mois** |
| ------- | ---------------- | ----------- | -------------------- |
| 10 | 131 € | 8 € | **123 €** |
| 20 | 262 € | 18 € | **244 €** |
| 50 | 656 € | 35 € | **621 €** |
| 100 | 1 312 € | 50 € | **1 262 €** |
| 217 | 2 847 € | 80 € | **2 767 €** |

À 217 clients, la marge nette est d'environ **2 770 €/mois** avant impôt et
rémunération. Le passage en SASU (IS 15 % puis rémunération) est détaillé dans
`docs/financial-model.html` : il divise ce montant par ~1,68 en dividendes ou ~1,86
en salaire.

## 8. Ce qu'il faut retenir

1. **La marge est confortable** : 70 à 83 % selon le plan et le tarif. Le SaaS n'a
   presque aucun coût variable hors messages
2. **Le quota de crédits est le seul vrai coût variable.** Chaque message envoyé en
   plus grignote la marge — et le quota actuel de Salon (400) ne couvre que 133 RDV
   sur les 400 autorisés
3. **Le levier principal, c'est le prix**, pas le fournisseur : passer de 19 € à 29 €
   rapporte 10 € par client, changer de fournisseur 0,68 €
4. **Le vrai risque, c'est le repli SMS.** Si tes clients n'ont pas WhatsApp, la marge
   Solo tombe à 11,84 € avec Twilio. Telnyx rend ce risque quasi nul
5. **Ne descends pas en dessous de 19 €/mois** : à 9 €, la marge Solo tombe à **4,33 €**
   et il faut 9 clients pour couvrir 35 € de coûts fixes (contre 3 à 19 €)
