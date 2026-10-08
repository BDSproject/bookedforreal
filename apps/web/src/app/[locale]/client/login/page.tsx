"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, Input, Label } from "@bookedforreal/ui";

import { GoogleSignInButton } from "@/components/google-sign-in";
import { apiFetch, setClientToken } from "@/lib/api-client";

export default function ClientLoginPage() {
  const t = useTranslations("client");
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function finish(token: string) {
    setClientToken(token);
    router.push("/client");
  }

  /** Signs in with the ID token Google returned. */
  async function signInWithGoogle(credential: string) {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<{ token: string }>("/auth/client/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });
      finish(data.token);
    } catch {
      setError(t("verifyError"));
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const path = mode === "login" ? "/auth/client/login" : "/auth/client/register";
      const payload =
        mode === "login" ? { email, password } : { email, password, firstName, lastName };
      const data = await apiFetch<{ token: string }>(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      finish(data.token);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(message.includes("EMAIL_TAKEN") ? t("verifyError") : t("verifyError"));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("loginTitle")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("loginSubtitle")}</p>

      <Card className="mt-8">
        <CardContent className="space-y-4 pt-6">
          <GoogleSignInButton onCredential={signInWithGoogle} />

          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="border-border h-px flex-1 border-t" />
            {t("or")}
            <span className="border-border h-px flex-1 border-t" />
          </div>

          <form className="space-y-3" onSubmit={submit}>
            {mode === "register" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">{t("firstName")}</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">{t("lastName")}</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === "register" ? 8 : undefined}
                required
              />
            </div>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "login" ? t("signIn") : t("register")}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            {mode === "login" ? t("noAccount") : t("haveAccount")}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
