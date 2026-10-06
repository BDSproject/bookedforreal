/** SEO blog articles (data-driven). Content is per-locale. */
export interface BlogArticle {
  slug: string;
  category: string;
  publishedAt: string;
  /** Set when the article is meaningfully updated (exposed as `dateModified`). */
  updatedAt?: string;
  fr: { title: string; description: string; content: string[] };
  en: { title: string; description: string; content: string[] };
}

/** Author byline for every article (E-E-A-T: make it clear who wrote the content). */
export const BLOG_AUTHOR: Record<"fr" | "en", string> = {
  fr: "L'équipe Bookedforreal",
  en: "The Bookedforreal team",
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "comment-accepter-reservations-en-ligne",
    category: "Réservation",
    publishedAt: "2026-01-10",
    fr: {
      title: "Comment accepter les réservations en ligne (coiffeurs & barbiers)",
      description: "Le guide complet pour mettre en place la réservation en ligne dans votre salon.",
      content: [
        "La réservation en ligne transforme votre salon : plus d'appels manqués, moins de no-shows et un agenda toujours rempli.",
        "Commencez par lister vos services avec leurs durées et tarifs, puis définissez vos horaires et ceux de votre équipe.",
        "Publiez un lien de réservation sur vos réseaux et votre vitrine Google. Bookedforreal génère ce lien automatiquement.",
        "Vos clients choisissent un service, une date et une heure en 3 clics. Vous recevez la réservation instantanément.",
      ],
    },
    en: {
      title: "How to accept online bookings (hairdressers & barbers)",
      description: "The complete guide to setting up online booking in your salon.",
      content: [
        "Online booking transforms your salon: no more missed calls, fewer no-shows and a full calendar.",
        "Start by listing your services with their durations and prices, then define your opening hours and your team's.",
        "Publish a booking link on your social media and Google listing. Bookedforreal generates this link automatically.",
        "Clients pick a service, a date and a time in 3 clicks. You receive the booking instantly.",
      ],
    },
  },
  {
    slug: "reduire-no-shows-salon",
    category: "No-shows",
    publishedAt: "2026-01-08",
    fr: {
      title: "7 astuces pour réduire les no-shows dans votre salon",
      description: "Les rappels automatiques et la pré-réservation réduisent les rendez-vous manqués.",
      content: [
        "Un rendez-vous manqué coûte de l'argent et bloque un créneau. Les rappels sont votre meilleure arme.",
        "Envoyez un rappel 24h avant via SMS ou WhatsApp : le taux d'absence chute immédiatement.",
        "Demandez un numéro de téléphone à la réservation et activez la confirmation automatique.",
        "Avec Bookedforreal, rappels et confirmations sont inclus et s'envoient sans effort.",
      ],
    },
    en: {
      title: "7 tips to reduce no-shows in your salon",
      description: "Automatic reminders and pre-booking cut missed appointments.",
      content: [
        "A missed appointment costs money and blocks a slot. Reminders are your best tool.",
        "Send a reminder 24h before via SMS or WhatsApp: the no-show rate drops immediately.",
        "Ask for a phone number at booking and enable automatic confirmation.",
        "With Bookedforreal, reminders and confirmations are included and sent effortlessly.",
      ],
    },
  },
  {
    slug: "meilleur-logiciel-reservation-coiffeur",
    category: "Outils",
    publishedAt: "2026-01-06",
    fr: {
      title: "Quel est le meilleur logiciel de réservation pour coiffeurs ?",
      description: "Les critères pour choisir : prix, simplicité, rappels et mini-site inclus.",
      content: [
        "Un bon logiciel de réservation doit être simple : 3 clics pour le client, aucune formation pour vous.",
        "Vérifiez le prix : méfiez-vous des frais cachés par réservation. Préférez un abonnement clair.",
        "Le mini-site, les rappels automatiques et l'application mobile font toute la différence.",
        "Bookedforreal réunit tout cela à partir de 5 €/mois, avec un essai gratuit de 7 jours.",
      ],
    },
    en: {
      title: "What is the best booking software for hairdressers?",
      description: "The criteria to choose: price, simplicity, reminders and an included mini-site.",
      content: [
        "Good booking software must be simple: 3 clicks for the client, no training for you.",
        "Check the price: beware of hidden per-booking fees. Prefer clear subscription pricing.",
        "The mini-site, automatic reminders and mobile app make all the difference.",
        "Bookedforreal brings it all together from €5/month, with a 7-day free trial.",
      ],
    },
  },
  {
    slug: "creer-mini-site-salon",
    category: "Mini-site",
    publishedAt: "2026-01-04",
    fr: {
      title: "Créer un mini-site pour votre salon en 5 minutes",
      description: "Une page simple avec services, tarifs, avis et un bouton Réserver.",
      content: [
        "Votre mini-site est votre vitrine : nom, photos, services, tarifs et avis clients.",
        "Pas besoin de développeur : renseignez vos informations et publiez votre lien.",
        "Ajoutez le bouton « Réserver » pour transformer les visiteurs en clients.",
        "Bookedforreal inclut un mini-site optimisé SEO avec chaque compte.",
      ],
    },
    en: {
      title: "Create a mini-site for your salon in 5 minutes",
      description: "A simple page with services, prices, reviews and a Book button.",
      content: [
        "Your mini-site is your storefront: name, photos, services, prices and client reviews.",
        "No developer needed: fill in your details and publish your link.",
        "Add the “Book” button to turn visitors into clients.",
        "Bookedforreal includes an SEO-optimized mini-site with every account.",
      ],
    },
  },
  {
    slug: "rappels-sms-whatsapp-salon",
    category: "Rappels",
    publishedAt: "2026-01-02",
    fr: {
      title: "Rappels SMS et WhatsApp : pourquoi c'est essentiel",
      description: "Les clients oublient ; les rappels automatiques sauvent votre agenda.",
      content: [
        "Entre 10 et 30 % des rendez-vous sont manqués sans rappel. Un SMS change tout.",
        "WhatsApp est le canal préféré de vos clients : ouvert, lu, efficace.",
        "Automatisez un rappel 24h avant et une confirmation immédiate.",
        "Le plan Pro de Bookedforreal inclut 100 crédits SMS/WhatsApp par mois.",
      ],
    },
    en: {
      title: "SMS and WhatsApp reminders: why they're essential",
      description: "Clients forget; automatic reminders save your calendar.",
      content: [
        "Between 10 and 30% of appointments are missed without a reminder. An SMS changes everything.",
        "WhatsApp is your clients' favorite channel: opened, read, effective.",
        "Automate a reminder 24h before and an instant confirmation.",
        "Bookedforreal's Pro plan includes 100 SMS/WhatsApp credits per month.",
      ],
    },
  },
  {
    slug: "avantages-reservation-en-ligne",
    category: "Réservation",
    publishedAt: "2025-12-28",
    fr: {
      title: "Les 5 avantages de la réservation en ligne pour votre salon",
      description: "Temps gagné, agenda rempli, clients satisfaits.",
      content: [
        "1. Réservations 24h/24, même quand le salon est fermé.",
        "2. Moins d'appels : vous vous concentrez sur vos clients en fauteuil.",
        "3. Moins de no-shows grâce aux rappels automatiques.",
        "4. Des données clients propres et conformes RGPD.",
        "5. Un avantage concurrentiel face aux salons qui ne proposent pas le digital.",
      ],
    },
    en: {
      title: "5 benefits of online booking for your salon",
      description: "Time saved, calendar filled, happy clients.",
      content: [
        "1. Bookings 24/7, even when the salon is closed.",
        "2. Fewer calls: you focus on clients in the chair.",
        "3. Fewer no-shows thanks to automatic reminders.",
        "4. Clean, GDPR-compliant client data.",
        "5. A competitive edge over salons that don't offer digital.",
      ],
    },
  },
  {
    slug: "gagner-du-temps-gestion-salon",
    category: "Gestion",
    publishedAt: "2025-12-20",
    fr: {
      title: "Gagner du temps dans la gestion de votre salon",
      description: "Automatisez l'administratif et recentrez-vous sur votre métier.",
      content: [
        "La gestion manuelle des rendez-vous peut prendre 10 heures par semaine.",
        "Un agenda en ligne centralise réservations, annulations et modifications.",
        "Les rappels et confirmations partent tout seuls, sans relance manuelle.",
        "Bookedforreal vous rend ce temps pour vos clients et votre vie personnelle.",
      ],
    },
    en: {
      title: "Save time managing your salon",
      description: "Automate admin and refocus on your craft.",
      content: [
        "Manual appointment management can take 10 hours a week.",
        "An online calendar centralizes bookings, cancellations and changes.",
        "Reminders and confirmations go out automatically, with no manual follow-up.",
        "Bookedforreal gives that time back for your clients and your life.",
      ],
    },
  },
  {
    slug: "fideliser-clients-salon",
    category: "Fidélisation",
    publishedAt: "2025-12-12",
    fr: {
      title: "Comment fidéliser les clients de votre salon",
      description: "Simplicité, rappels et suivi : les clés de la fidélité.",
      content: [
        "Un client qui réserve en 3 clics revient plus facilement.",
        "Gardez un historique : services préférés, dernière visite, notes.",
        "Relancez automatiquement après quelques semaines d'absence.",
        "La satisfaction naît d'une expérience fluide, du premier clic au rappel.",
      ],
    },
    en: {
      title: "How to retain your salon clients",
      description: "Simplicity, reminders and follow-up: the keys to loyalty.",
      content: [
        "A client who books in 3 clicks comes back more easily.",
        "Keep a history: favorite services, last visit, notes.",
        "Follow up automatically after a few weeks of absence.",
        "Satisfaction comes from a smooth experience, from first click to reminder.",
      ],
    },
  },
  {
    slug: "seo-local-coiffeur-barbier",
    category: "SEO",
    publishedAt: "2025-12-05",
    fr: {
      title: "SEO local pour coiffeurs et barbiers : le guide",
      description: "Soyez visible quand on cherche « coiffeur près de moi ».",
      content: [
        "Le SEO local vous rend visible sur Google Maps et dans les recherches de proximité.",
        "Optimisez votre fiche Google Business et votre mini-site avec les bons mots-clés.",
        "Les avis clients et les pages par ville renforcent votre positionnement.",
        "Bookedforreal génère des pages SEO locales (coiffeur + ville) automatiquement.",
      ],
    },
    en: {
      title: "Local SEO for hairdressers and barbers: the guide",
      description: "Be visible when people search “hairdresser near me”.",
      content: [
        "Local SEO makes you visible on Google Maps and in nearby searches.",
        "Optimize your Google Business profile and mini-site with the right keywords.",
        "Client reviews and city pages strengthen your ranking.",
        "Bookedforreal generates local SEO pages (hairdresser + city) automatically.",
      ],
    },
  },
  {
    slug: "application-mobile-salon",
    category: "Mobile",
    publishedAt: "2025-11-28",
    fr: {
      title: "Pourquoi gérer votre salon depuis une application mobile",
      description: "Votre agenda dans votre poche, où que vous soyez.",
      content: [
        "Consultez et gérez vos rendez-vous depuis votre téléphone, entre deux clients.",
        "Recevez une notification à chaque nouvelle réservation.",
        "Modifiez un créneau, confirmez ou annulez en un geste.",
        "L'application Bookedforreal est disponible sur iOS et Android.",
      ],
    },
    en: {
      title: "Why manage your salon from a mobile app",
      description: "Your calendar in your pocket, wherever you are.",
      content: [
        "View and manage appointments from your phone, between clients.",
        "Get a notification for every new booking.",
        "Move a slot, confirm or cancel with one tap.",
        "The Bookedforreal app is available on iOS and Android.",
      ],
    },
  },
];

export function getArticle(slug: string): BlogArticle | undefined {
  return blogArticles.find((article) => article.slug === slug);
}
