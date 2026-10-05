"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import type { Client } from "@/lib/api-types";

export default function ClientsPage() {
  const t = useTranslations("dashboard.clients");
  const { data, loading } = useApiData<Client[]>("/clients");

  if (loading || !data) {
    return <p className="text-muted-foreground">…</p>;
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <div className="mt-6 space-y-3">
        {data.map((client) => (
          <Card key={client.id}>
            <CardContent>
              <p className="font-semibold">{client.name}</p>
              <p className="text-sm text-muted-foreground">{client.phone ?? client.email ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
