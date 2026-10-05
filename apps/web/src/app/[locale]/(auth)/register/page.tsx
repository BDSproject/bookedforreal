"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@bookedforreal/ui";

import { useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const te = useTranslations("errors");
  const router = useRouter();
  const [salonName, setSalonName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, salonName }),
      });
      router.push("/login");
    } catch {
      setError(te("generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salonName">{t("salonName")}</Label>
              <Input id="salonName" value={salonName} onChange={(e) => setSalonName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" size="xl" className="w-full" disabled={loading}>
              {t("submit")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-primary">
              {t("login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
