"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import type { DashboardStats } from "@/lib/api-types";

export default function DashboardPage() {
  const t = useTranslations("dashboard.stats");
  const { data, loading } = useApiData<DashboardStats>("/stats/dashboard");

  if (loading || !data) {
    return <p className="text-muted-foreground">…</p>;
  }

  const stats = [
    { label: t("today"), value: data.appointmentsToday },
    { label: t("upcoming"), value: data.upcoming },
    { label: t("clients"), value: data.clients },
    { label: t("services"), value: data.services },
    { label: t("staff"), value: data.staff },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t("today")}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
