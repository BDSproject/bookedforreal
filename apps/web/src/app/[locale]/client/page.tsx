"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent } from "@bookedforreal/ui";

import { Link } from "@/i18n/navigation";
import { clearClientToken, clientApiFetch, getClientToken } from "@/lib/api-client";

interface Booking {
  id: string;
  startAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "DONE" | "NO_SHOW";
  salon: { name: string; slug: string };
  service: { nameFr: string; nameEn: string };
  staff: { name: string };
}

interface MeResponse {
  account: { name: string; email: string; emailVerified: boolean } | null;
  bookings: Booking[];
}

/** The customer's space: their profile and their bookings across salons. */
export default function ClientSpacePage() {
  const t = useTranslations("client");
  const ts = useTranslations("booking.status");
  const [data, setData] = useState<MeResponse | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!getClientToken()) {
      setUnauthorized(true);
      return;
    }
    clientApiFetch<MeResponse>("/client/me")
      .then(setData)
      .catch(() => setUnauthorized(true));
  }, []);

  if (unauthorized) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("loginSubtitle")}</p>
        <Button asChild size="xl" className="mt-6 rounded-full px-8">
          <Link href="/client/login">{t("signIn")}</Link>
        </Button>
      </main>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground p-16 text-center">…</p>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data.account?.name
              ? `${t("appointmentsTitle")}, ${data.account.name}`
              : t("appointmentsTitle")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {data.account?.email}{" "}
            {data.account?.emailVerified ? `· ${t("emailVerified")}` : `· ${t("emailNotVerified")}`}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            clearClientToken();
            window.location.href = "/client/login";
          }}
        >
          {t("logout")}
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {data.bookings.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            {t("appointmentsEmpty")}
          </p>
        ) : (
          data.bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-semibold">{booking.salon.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {booking.service.nameFr} · {booking.staff.name} ·{" "}
                    {new Date(booking.startAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-muted-foreground text-sm">{ts(booking.status)}</span>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href="/">{t("backToBooking")}</Link>
        </Button>
      </div>
    </main>
  );
}
