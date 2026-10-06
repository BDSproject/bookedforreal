import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-primary text-7xl font-extrabold">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        La page que vous cherchez n’existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="bg-primary hover:bg-primary/90 mt-8 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
      >
        Retour à l’accueil
      </Link>
    </main>
  );
}
