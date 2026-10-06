import type { AppLocale } from "@/i18n/routing";

/**
 * Trust / legal content pages ("Who created this site?" signals Google's
 * E-E-A-T guidance asks for). Content is authored here, per locale, so the
 * pages stay cheap to render and identical between FR and EN routes.
 *
 * ⚠️ The legal pages contain `[placeholders]` that MUST be replaced with the
 * company's real details before going live.
 */
export interface PageSection {
  title: string;
  body: string[];
}

export interface LocalizedPage {
  title: string;
  description: string;
  intro: string;
  sections: PageSection[];
}

export type SitePageSlug = "about" | "contact" | "legal" | "privacy" | "terms";

export const SITE_PAGES: Record<SitePageSlug, Record<AppLocale, LocalizedPage>> = {
  about: {
    fr: {
      title: "À propos de Bookedforreal",
      description:
        "Qui nous sommes, pourquoi nous avons créé Bookedforreal et nos engagements pour les salons de coiffure et de barbiers.",
      intro:
        "Bookedforreal est un logiciel de réservation en ligne conçu avec et pour les coiffeurs et les barbiers.",
      sections: [
        {
          title: "Notre mission",
          body: [
            "Faire gagner du temps aux coiffeurs et aux barbiers, pour qu'ils se concentrent sur ce qu'ils font le mieux : couper.",
            "Bookedforreal est né d'un constat simple : entre deux coupes, on ne devrait pas avoir à décrocher le téléphone pour noter un rendez-vous sur un coin de nappe.",
          ],
        },
        {
          title: "Ce que fait Bookedforreal",
          body: [
            "Un mini-site à votre nom, une réservation en ligne 24 h/24, des rappels automatiques et un agenda toujours à jour.",
            "Le tout pensé pour rester simple : vos clients réservent en 3 clics, vous gérez tout depuis votre téléphone.",
          ],
        },
        {
          title: "Nos engagements",
          body: [
            "Sans engagement : vous arrêtez quand vous voulez, y compris pendant l'essai.",
            "Vos données et celles de vos clients sont hébergées en France et traitées conformément au RGPD.",
            "Un support humain, en français, qui connaît le métier.",
          ],
        },
      ],
    },
    en: {
      title: "About Bookedforreal",
      description:
        "Who we are, why we built Bookedforreal, and our commitments to hair salons and barbershops.",
      intro:
        "Bookedforreal is an online booking software built with, and for, hairdressers and barbers.",
      sections: [
        {
          title: "Our mission",
          body: [
            "Save hairdressers and barbers time, so they can focus on what they do best: cutting hair.",
            "Bookedforreal started from a simple observation: between two haircuts, nobody should have to pick up the phone to scribble an appointment on the corner of a notepad.",
          ],
        },
        {
          title: "What Bookedforreal does",
          body: [
            "A mini-site under your name, 24/7 online booking, automatic reminders and a calendar that stays up to date.",
            "Everything is kept simple: clients book in 3 clicks, and you manage it all from your phone.",
          ],
        },
        {
          title: "Our commitments",
          body: [
            "No commitment: cancel whenever you want, including during the trial.",
            "Your data and your clients' data are hosted in France and processed in line with GDPR.",
            "Human support, in French, from people who know the trade.",
          ],
        },
      ],
    },
  },

  contact: {
    fr: {
      title: "Contacter Bookedforreal",
      description:
        "Une question, une démo, un devis pour plusieurs boutiques ? Contactez l'équipe Bookedforreal.",
      intro: "Une question ? Nous répondons vite, et en français.",
      sections: [
        {
          title: "Par email",
          body: ["contact@bookedforreal.com — nous répondons sous 24 h ouvrées."],
        },
        {
          title: "Par téléphone",
          body: [
            "Laissez votre numéro via le formulaire de rappel en bas de la page d'accueil : un vrai humain vous rappelle.",
          ],
        },
        {
          title: "Plusieurs boutiques ?",
          body: [
            "Pour les groupes, franchises et besoins premium, nous établissons un devis sur mesure.",
            "Écrivez-nous en précisant le nombre de boutiques et vos besoins.",
          ],
        },
      ],
    },
    en: {
      title: "Contact Bookedforreal",
      description:
        "A question, a demo, a quote for several shops? Get in touch with the Bookedforreal team.",
      intro: "A question? We answer quickly, in French or English.",
      sections: [
        {
          title: "By email",
          body: ["contact@bookedforreal.com — we reply within one business day."],
        },
        {
          title: "By phone",
          body: [
            "Leave your number through the callback form at the bottom of the home page: a real human calls you back.",
          ],
        },
        {
          title: "Several shops?",
          body: [
            "For groups, franchises and premium needs, we prepare a tailored quote.",
            "Email us with the number of shops and what you need.",
          ],
        },
      ],
    },
  },

  legal: {
    fr: {
      title: "Mentions légales",
      description: "Mentions légales du site Bookedforreal.",
      intro: "Informations légales relatives à l'éditeur et à l'hébergement du site Bookedforreal.",
      sections: [
        {
          title: "Éditeur du site",
          body: [
            "[Raison sociale] — [forme juridique] au capital de [montant] €",
            "[Adresse du siège social]",
            "SIRET : [numéro] — RCS : [ville] — TVA : [numéro]",
            "Directeur de la publication : [nom]",
            "Contact : contact@bookedforreal.com",
          ],
        },
        {
          title: "Hébergement",
          body: [
            "Le site est hébergé par [nom de l'hébergeur].",
            "[Adresse de l'hébergeur]",
            "La base de données est hébergée par Neon (PostgreSQL serverless).",
          ],
        },
        {
          title: "Propriété intellectuelle",
          body: [
            "L'ensemble des contenus de ce site (textes, logos, éléments graphiques) est protégé par le droit d'auteur.",
            "Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite est interdite.",
          ],
        },
      ],
    },
    en: {
      title: "Legal notice",
      description: "Legal notice for the Bookedforreal website.",
      intro: "Legal information about the publisher and the hosting of the Bookedforreal website.",
      sections: [
        {
          title: "Publisher",
          body: [
            "[Company name] — [legal form] with a share capital of [amount] €",
            "[Registered office address]",
            "Company number: [number] — Trade register: [city] — VAT: [number]",
            "Publication manager: [name]",
            "Contact: contact@bookedforreal.com",
          ],
        },
        {
          title: "Hosting",
          body: [
            "The website is hosted by [host name].",
            "[Host address]",
            "The database is hosted by Neon (serverless PostgreSQL).",
          ],
        },
        {
          title: "Intellectual property",
          body: [
            "All content on this site (text, logos, graphic elements) is protected by copyright.",
            "Any reproduction or representation, in whole or in part, without written permission is prohibited.",
          ],
        },
      ],
    },
  },

  privacy: {
    fr: {
      title: "Politique de confidentialité",
      description:
        "Comment Bookedforreal collecte, utilise et protège vos données personnelles (RGPD).",
      intro:
        "Nous ne collectons que les données nécessaires au fonctionnement du service, et nous ne les revendons jamais.",
      sections: [
        {
          title: "Données collectées",
          body: [
            "Pour un salon : nom du salon, email, mot de passe (haché avec Argon2id), services, horaires.",
            "Pour un client qui réserve : nom, téléphone, email et détails du rendez-vous.",
            "Aucune donnée n'est revendue ni transmise à des tiers à des fins publicitaires.",
          ],
        },
        {
          title: "Finalités et durée de conservation",
          body: [
            "Les données servent à gérer votre compte, vos réservations et l'envoi des rappels (WhatsApp ou SMS).",
            "Elles sont conservées pendant la durée d'utilisation du service, puis supprimées sur demande.",
          ],
        },
        {
          title: "Vos droits",
          body: [
            "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et de portabilité.",
            "Pour exercer ces droits, écrivez à contact@bookedforreal.com.",
          ],
        },
        {
          title: "Cookies",
          body: [
            "Le site utilise uniquement des cookies techniques nécessaires (session, préférence de langue).",
            "Aucun cookie publicitaire n'est déposé sans votre consentement.",
          ],
        },
      ],
    },
    en: {
      title: "Privacy policy",
      description: "How Bookedforreal collects, uses and protects your personal data (GDPR).",
      intro: "We only collect the data needed to run the service, and we never sell it.",
      sections: [
        {
          title: "Data we collect",
          body: [
            "For a salon: salon name, email, password (hashed with Argon2id), services, opening hours.",
            "For a booking client: name, phone, email and the appointment details.",
            "No data is sold or shared with third parties for advertising.",
          ],
        },
        {
          title: "Purpose and retention",
          body: [
            "Data is used to manage your account, your bookings and to send reminders (WhatsApp or SMS).",
            "It is kept for as long as you use the service, then deleted on request.",
          ],
        },
        {
          title: "Your rights",
          body: [
            "Under the GDPR you have the right to access, rectify, erase, restrict and port your data.",
            "To exercise these rights, email contact@bookedforreal.com.",
          ],
        },
        {
          title: "Cookies",
          body: [
            "The site only uses strictly necessary technical cookies (session, language preference).",
            "No advertising cookies are set without your consent.",
          ],
        },
      ],
    },
  },

  terms: {
    fr: {
      title: "Conditions générales de vente",
      description: "Conditions d'abonnement et d'utilisation du logiciel Bookedforreal.",
      intro: "Ces conditions régissent l'utilisation de Bookedforreal par les salons abonnés.",
      sections: [
        {
          title: "Objet et abonnement",
          body: [
            "Bookedforreal est un service par abonnement donnant accès à un mini-site, un agenda en ligne et des rappels automatiques.",
            "Les tarifs sont indiqués sur la page Tarifs, en euros, hors taxes.",
          ],
        },
        {
          title: "Essai gratuit et résiliation",
          body: [
            "Chaque nouveau salon bénéficie d'un essai gratuit de 7 jours, sans carte bancaire.",
            "L'abonnement est sans engagement : vous pouvez résilier à tout moment, y compris pendant l'essai, depuis votre espace client.",
          ],
        },
        {
          title: "Responsabilité",
          body: [
            "Bookedforreal met tout en œuvre pour assurer la disponibilité du service, sans obligation de résultat.",
            "Le salon reste responsable du contenu publié sur son mini-site et du traitement des données de ses clients.",
          ],
        },
      ],
    },
    en: {
      title: "Terms of service",
      description: "Subscription and usage terms for the Bookedforreal software.",
      intro: "These terms govern the use of Bookedforreal by subscribing salons.",
      sections: [
        {
          title: "Scope and subscription",
          body: [
            "Bookedforreal is a subscription service giving access to a mini-site, an online calendar and automatic reminders.",
            "Prices are listed on the Pricing page, in euros, excluding tax.",
          ],
        },
        {
          title: "Free trial and cancellation",
          body: [
            "Every new salon gets a 7-day free trial, no credit card required.",
            "The subscription has no commitment: you can cancel at any time, including during the trial, from your account.",
          ],
        },
        {
          title: "Liability",
          body: [
            "Bookedforreal makes every effort to keep the service available, without any obligation of result.",
            "The salon remains responsible for the content published on its mini-site and for processing its clients' data.",
          ],
        },
      ],
    },
  },
};

/** Returns the localized content for a trust/legal page. */
export function getSitePage(slug: SitePageSlug): Record<AppLocale, LocalizedPage> {
  return SITE_PAGES[slug];
}
