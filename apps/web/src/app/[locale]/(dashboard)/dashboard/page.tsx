"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import type { DashboardStats, StaffStatsReport } from "@/lib/api-types";

/** Formats cents as a French euro amount. */
function euros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard.stats");
  const tt = useTranslations("dashboard.teamStats");
  const { data, loading } = useApiData<DashboardStats>("/stats/dashboard");
  const { data: report, loading: reportLoading } = useApiData<StaffStatsReport>("/stats/staff");

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
    <div className="max-w-4xl">
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

      {/* What each hairdresser actually did, month to date. */}
      <h2 className="mt-10 text-xl font-bold tracking-tight">{tt("title")}</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        {tt("subtitle")}
        {report ? ` · ${report.from} → ${report.to}` : ""}
      </p>

      {reportLoading || !report ? (
        <p className="text-muted-foreground mt-4">…</p>
      ) : report.staff.length === 0 ? (
        <p className="text-muted-foreground mt-4 rounded-xl border border-dashed p-6 text-center text-sm">
          {tt("empty")}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-2 pr-4 font-medium">{tt("staff")}</th>
                <th className="py-2 pr-4 text-right font-medium">{tt("bookings")}</th>
                <th className="py-2 pr-4 text-right font-medium">{tt("completed")}</th>
                <th className="py-2 pr-4 text-right font-medium">{tt("upcoming")}</th>
                <th className="py-2 pr-4 text-right font-medium">{tt("noShow")}</th>
                <th className="py-2 text-right font-medium">{tt("revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {report.staff.map((row) => (
                <tr key={row.staffId} className="border-b last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{row.name}</td>
                  <td className="py-2.5 pr-4 text-right">{row.bookings}</td>
                  <td className="py-2.5 pr-4 text-right">{row.completed}</td>
                  <td className="py-2.5 pr-4 text-right">{row.upcoming}</td>
                  <td className="py-2.5 pr-4 text-right">{row.noShow}</td>
                  <td className="text-primary py-2.5 text-right font-semibold">
                    {euros(row.revenueCents)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2.5 pr-4">{tt("total")}</td>
                <td className="py-2.5 pr-4 text-right">{report.totals.bookings}</td>
                <td className="py-2.5 pr-4 text-right">{report.totals.completed}</td>
                <td className="py-2.5 pr-4 text-right" />
                <td className="py-2.5 pr-4 text-right" />
                <td className="text-primary py-2.5 text-right">
                  {euros(report.totals.revenueCents)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
