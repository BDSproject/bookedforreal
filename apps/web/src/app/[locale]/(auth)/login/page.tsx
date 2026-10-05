"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@bookedforreal/ui";

import { useRouter } from "@/i18n/navigation";
import { apiFetch, setToken } from "@/lib/api-client";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const te = useTranslations("errors");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.accessToken);
      router.push("/dashboard");
    } catch {
      setError(te("invalidCredentials"));
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
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" size="xl" className="w-full" disabled={loading}>
              {t("submit")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-primary">
              {t("register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
