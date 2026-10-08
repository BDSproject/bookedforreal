import type { AppLocale } from "@/i18n/routing";

/**
 * The public "go live in 10 minutes" guide.
 *
 * Authored here per locale, like the trust pages, so it renders statically and
 * stays identical between the FR and EN routes. It follows the real order of the
 * dashboard navigation — if a screen moves, this file must move with it.
 */
export interface GuideStep {
  title: string;
  /** Rough time for this step, already formatted for display. */
  duration: string;
  body: string;
  tips?: string[];
}

export interface GuideContent {
  title: string;
  description: string;
  intro: string;
  promise: string;
  checklistTitle: string;
  checklist: string[];
  stepsTitle: string;
  steps: GuideStep[];
  afterTitle: string;
  after: string[];
  cta: string;
  ctaNote: string;
}

export const GUIDE: Record<AppLocale, GuideContent> = {
  fr: {
    title: "Votre salon en ligne en 10 minutes",
    description:
      "Le guide de démarrage Bookedforreal : créez votre compte, ajoutez vos prestations, votre équipe et vos horaires, puis partagez votre lien de réservation.",
    intro:
      "Pas d'installation, pas de formation, pas de carte bancaire. Six étapes et votre salon accepte ses premières réservations en ligne.",
    promise: "Environ 10 minutes",
    checklistTitle: "À avoir sous la main",
    checklist: [
      "Le nom de votre salon, sa ville et son adresse",
      "Le numéro de téléphone qui recevra les alertes de rendez-vous",
      "La liste de vos prestations, avec la durée et le tarif",
      "Les prénoms des personnes qui prennent des rendez-vous",
      "Vos horaires d'ouverture, pause déjeuner comprise",
    ],
    stepsTitle: "Les six étapes",
    steps: [
      {
        title: "Créez votre compte",
        duration: "1 min",
        body: "Renseignez votre email, un mot de passe et le nom de votre salon. Aucune carte bancaire n'est demandée : vous avez 7 jours pour essayer, et vous arrivez directement sur votre tableau de bord.",
        tips: ["Choisissez bien le nom : il apparaît sur votre page de réservation"],
      },
      {
        title: "Ajoutez vos prestations",
        duration: "3 min",
        body: "Dans Prestations, ajoutez ce que vos clients peuvent réserver : nom, durée et tarif. Le temps de nettoyage est le délai dont vous avez besoin entre deux rendez-vous pour ranger le poste.",
        tips: [
          "Comptez large sur la durée : un créneau trop court vous met en retard toute la journée",
        ],
      },
      {
        title: "Ajoutez votre équipe",
        duration: "1 min",
        body: "Dans Équipe, ajoutez un prénom par personne qui prend des rendez-vous. Si vous travaillez seul, une seule fiche suffit : mettez votre prénom.",
      },
      {
        title: "Ouvrez vos horaires",
        duration: "2 min",
        body: "Dans Horaires, indiquez pour chaque personne les plages où elle reçoit. Un jour sans plage n'est pas réservable : c'est ainsi que vous fermez le dimanche et le lundi.",
        tips: [
          "Réglez un jour, puis « Copier sur tous les jours » : vous n'ajustez ensuite que les exceptions",
          "Ajoutez une pause entre midi et deux pour que personne ne réserve pendant votre déjeuner",
        ],
      },
      {
        title: "Vérifiez vos rappels",
        duration: "1 min",
        body: "Dans Réglages, renseignez le téléphone du salon puis cliquez sur « Recevoir un message de test ». Les rappels partent sur WhatsApp, et basculent en SMS si le client n'a pas WhatsApp.",
        tips: [
          "La confirmation part dès la réservation et le rappel la veille : c'est ce qui fait tomber les lapins",
        ],
      },
      {
        title: "Partagez votre lien",
        duration: "30 s",
        body: "Votre page de réservation est en ligne à l'adresse bookedforreal.com/s/votre-salon. Mettez-la partout : bio Instagram, fiche Google, story, signature d'email, et un QR code sur la vitrine.",
      },
    ],
    afterTitle: "Ensuite, tout roule",
    after: [
      "Vos clients réservent seuls, 24 h sur 24, en trois clics",
      "La confirmation et le rappel partent automatiquement sur WhatsApp",
      "Vous recevez une alerte à chaque nouveau rendez-vous",
      "Votre agenda et vos clients sont dans le tableau de bord et dans l'app mobile",
    ],
    cta: "Créer mon salon",
    ctaNote: "7 jours gratuits, sans carte bancaire",
  },
  en: {
    title: "Your salon online in 10 minutes",
    description:
      "The Bookedforreal setup guide: create your account, add your services, your team and your opening hours, then share your booking link.",
    intro:
      "No install, no training, no credit card. Six steps and your salon takes its first online bookings.",
    promise: "About 10 minutes",
    checklistTitle: "Have these ready",
    checklist: [
      "Your salon name, city and address",
      "The phone number that will receive booking alerts",
      "Your list of services, with duration and price",
      "The names of the people who take bookings",
      "Your opening hours, lunch break included",
    ],
    stepsTitle: "The six steps",
    steps: [
      {
        title: "Create your account",
        duration: "1 min",
        body: "Enter your email, a password and your salon name. No credit card is required: you get 7 days to try, and you land straight on your dashboard.",
        tips: ["Pick the name carefully: it shows on your booking page"],
      },
      {
        title: "Add your services",
        duration: "3 min",
        body: "In Services, add what your clients can book: name, duration and price. The clean-up time is the gap you need between two appointments to reset your station.",
        tips: ["Round the duration up: a slot that is too short puts you behind all day"],
      },
      {
        title: "Add your team",
        duration: "1 min",
        body: "In Team, add one name per person who takes bookings. If you work alone, a single entry is enough: use your own name.",
      },
      {
        title: "Open your hours",
        duration: "2 min",
        body: "In Opening hours, set the windows when each person is available. A day with no window cannot be booked: that is how you close Sunday and Monday.",
        tips: [
          "Set one day, then use “Copy to every day” and only adjust the exceptions",
          "Add a break around lunch so nobody books while you eat",
        ],
      },
      {
        title: "Check your reminders",
        duration: "1 min",
        body: "In Settings, fill in the salon phone number and click “Send me a test message”. Reminders go out on WhatsApp and fall back to SMS when the client is not on WhatsApp.",
        tips: [
          "The confirmation goes out at booking time and the reminder the day before: that is what kills no-shows",
        ],
      },
      {
        title: "Share your link",
        duration: "30 s",
        body: "Your booking page is live at bookedforreal.com/s/your-salon. Put it everywhere: Instagram bio, Google listing, stories, email signature, and a QR code in the window.",
      },
    ],
    afterTitle: "Then it runs itself",
    after: [
      "Your clients book on their own, 24/7, in three clicks",
      "The confirmation and the reminder go out automatically on WhatsApp",
      "You get an alert on every new booking",
      "Your calendar and your clients live in the dashboard and the mobile app",
    ],
    cta: "Create my salon",
    ctaNote: "7-day free trial, no credit card",
  },
};

export function getGuide(locale: AppLocale): GuideContent {
  return GUIDE[locale];
}
