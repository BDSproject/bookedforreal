"use client";

import { useTranslations } from "next-intl";

import { Badge, Card, CardContent } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api-client";
import type { Appointment } from "@/lib/api-types";

const STATUS_VARIANT: Record<
  Appointment["status"],
  "secondary" | "success" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  CONFIRMED: "success",
  CANCELLED: "destructive",
  DONE: "outline",
  NO_SHOW: "destructive",
};

export default function AppointmentsPage() {
  const t = useTranslations("dashboard.appointments");
  const ts = useTranslations("booking.status");
  const { data, loading } = useApiData<Appointment[]>("/appointments");

  async function setStatus(id: string, status: Appointment["status"]) {
    await apiFetch(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    window.location.reload();
  }

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
        {data.map((appointment) => (
          <Card key={appointment.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{appointment.client?.name ?? "—"}</p>
                <p className="text-muted-foreground text-sm">
                  {new Date(appointment.startAt).toLocaleString()} ·{" "}
                  {appointment.service?.nameFr ?? ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[appointment.status]}>{ts(appointment.status)}</Badge>
                <select
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                  value={appointment.status}
                  onChange={(e) =>
                    setStatus(appointment.id, e.target.value as Appointment["status"])
                  }
                >
                  <option value="PENDING">{ts("PENDING")}</option>
                  <option value="CONFIRMED">{ts("CONFIRMED")}</option>
                  <option value="DONE">{ts("DONE")}</option>
                  <option value="CANCELLED">{ts("CANCELLED")}</option>
                  <option value="NO_SHOW">{ts("NO_SHOW")}</option>
                </select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
