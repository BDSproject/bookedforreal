import Link from "next/link";

/** 404 rendered inside the locale layout (keeps the navbar + branding). */
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-primary text-7xl font-extrabold">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="text-muted-foreground mt-2">Cette page n’existe pas ou a été déplacée.</p>
      <Link
        href="/"
        className="bg-primary hover:bg-primary/90 mt-8 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
      >
        Retour à l’accueil
      </Link>
    </main>
  );
}
