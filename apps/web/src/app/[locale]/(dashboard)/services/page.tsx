"use client";

import { Card, CardContent } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import type { Service } from "@/lib/api-types";

export default function ServicesPage() {
  const { data, loading } = useApiData<Service[]>("/services");

  if (loading || !data) {
    return <p className="text-muted-foreground">…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Services</h1>
      <div className="mt-6 space-y-3">
        {data.map((service) => (
          <Card key={service.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{service.nameFr}</p>
                <p className="text-sm text-muted-foreground">
                  {service.nameEn} · {service.durationMin} min
                </p>
              </div>
              <p className="font-semibold text-primary">{(service.priceCents / 100).toFixed(2)} €</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
