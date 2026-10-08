#!/usr/bin/env node
/**
 * Creates the Stripe products and prices Bookedforreal expects, then prints the
 * environment block to paste into the API environment.
 *
 * Stripe prices are immutable: running this twice reuses the prices it already
 * created instead of duplicating them, so it is safe to re-run.
 *
 *   node scripts/setup-stripe.mjs --dry-run              # show the plan, no API call
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.mjs
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe.mjs --live
 *
 * Amounts come from `apps/api/src/lib/plans.ts` and `packages/i18n/messages/*.json`.
 * If you change a price, create the new one in Stripe and update the env var —
 * you never edit an existing price.
 */

const API = "https://api.stripe.com/v1";

/**
 * `env` is the variable `apps/api/src/lib/plans.ts` reads.
 * `label` is only used in the console output.
 */
const CATALOG = [
  {
    env: "STRIPE_PRICE_USAGE",
    label: "À l'usage — 0,50 € par RDV",
    product: "Bookedforreal — À l'usage",
    nickname: "0,50 € par rendez-vous en ligne",
    unitAmount: 50,
    interval: "month",
    metered: true,
  },
  {
    env: "STRIPE_PRICE_SOLO",
    label: "Solo — 19 € / mois",
    product: "Bookedforreal — Solo",
    nickname: "Solo mensuel",
    unitAmount: 1900,
    interval: "month",
    metered: false,
  },
  {
    env: "STRIPE_PRICE_SOLO_YEARLY",
    label: "Solo — 180 € / an (15 € par mois)",
    product: "Bookedforreal — Solo",
    nickname: "Solo annuel",
    unitAmount: 18000,
    interval: "year",
    metered: false,
  },
  {
    env: "STRIPE_PRICE_SALON",
    label: "Salon — 39 € / mois",
    product: "Bookedforreal — Salon",
    nickname: "Salon mensuel",
    unitAmount: 3900,
    interval: "month",
    metered: false,
  },
  {
    env: "STRIPE_PRICE_SALON_YEARLY",
    label: "Salon — 372 € / an (31 € par mois)",
    product: "Bookedforreal — Salon",
    nickname: "Salon annuel",
    unitAmount: 37200,
    interval: "year",
    metered: false,
  },
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const allowLive = args.includes("--live");

/** Formats cents as a French euro amount. */
function euros(cents) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function printEnv(values) {
  console.log("\n# --- Stripe (collez ce bloc dans l'environnement de l'API) ---");
  for (const item of CATALOG) {
    console.log(`${item.env}="${values[item.env] ?? ""}"`);
  }
  console.log("");
}

function die(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

/** Calls the Stripe API with form-encoded parameters. */
async function stripe(method, path, params, secretKey) {
  const url = new URL(`${API}${path}`);
  const init = {
    method,
    headers: { Authorization: `Bearer ${secretKey}` },
  };

  if (method === "GET" || method === "DELETE") {
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, String(value));
    }
  } else {
    init.headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = new URLSearchParams(
      Object.entries(params ?? {}).map(([key, value]) => [key, String(value)]),
    ).toString();
  }

  const response = await fetch(url, init);
  const body = await response.json();
  if (!response.ok) {
    die(`Stripe ${response.status}: ${body?.error?.message ?? JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  console.log("Stripe — Bookedforreal\n");

  if (dryRun) {
    console.log("Mode simulation : aucun appel à l'API Stripe.\n");
    for (const item of CATALOG) {
      const kind = item.metered ? "au compteur" : "abonnement";
      console.log(
        `  ${item.label.padEnd(34)} ${euros(item.unitAmount).padStart(9)}  /${item.interval}  (${kind})`,
      );
      console.log(`  ${"".padEnd(34)} → ${item.env}`);
    }
    printEnv({});
    console.log(
      "Relancez sans --dry-run, avec STRIPE_SECRET_KEY, pour créer les produits et les prix.",
    );
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    die("STRIPE_SECRET_KEY est absent. Exportez-le ou utilisez --dry-run.");
  }
  if (secretKey.startsWith("sk_live_") && !allowLive) {
    die("Clé live détectée. Relancez avec --live si c'est bien ce que vous voulez.");
  }

  const live = secretKey.startsWith("sk_live_");
  console.log(`Compte : ${live ? "LIVE" : "TEST"}\n`);

  // Products are matched by name so the script stays idempotent.
  const products = await stripe("GET", "/products", { limit: 100, active: true }, secretKey);
  const byName = new Map(products.data.map((product) => [product.name, product]));

  const values = {};

  for (const item of CATALOG) {
    let product = byName.get(item.product);
    if (!product) {
      product = await stripe(
        "POST",
        "/products",
        { name: item.product, "metadata[bookedforreal_plan]": item.env },
        secretKey,
      );
      byName.set(item.product, product);
      console.log(`  + produit créé      ${item.product}`);
    }

    const prices = await stripe(
      "GET",
      `/prices?product=${product.id}&active=true&limit=100`,
      {},
      secretKey,
    );
    const matches = (price) =>
      price.currency === "eur" &&
      price.unit_amount === item.unitAmount &&
      price.recurring?.interval === item.interval &&
      (price.recurring?.usage_type === "metered") === item.metered;

    let price = prices.data.find(matches);
    if (price) {
      console.log(`  = prix réutilisé    ${item.label} → ${price.id}`);
    } else {
      price = await stripe(
        "POST",
        "/prices",
        {
          product: product.id,
          currency: "eur",
          unit_amount: item.unitAmount,
          nickname: item.nickname,
          tax_behavior: "exclusive",
          "recurring[interval]": item.interval,
          ...(item.metered
            ? { "recurring[usage_type]": "metered", "recurring[aggregate_usage]": "sum" }
            : {}),
        },
        secretKey,
      );
      console.log(`  + prix créé         ${item.label} → ${price.id}`);
    }

    values[item.env] = price.id;
  }

  printEnv(values);
  console.log("Il reste deux réglages à faire dans le tableau de bord Stripe :");
  console.log("  1. Développeurs → Webhooks : ajoutez /webhooks/stripe sur votre domaine");
  console.log("     et abonnez-vous à checkout.session.completed, invoice.paid,");
  console.log("     invoice.payment_failed et customer.subscription.deleted");
  console.log("  2. Paramètres → Portail client : activez l'annulation et le changement de carte");
  console.log("\nDétail complet : docs/STRIPE.md\n");
}

main().catch((error) => die(error instanceof Error ? error.message : String(error)));
