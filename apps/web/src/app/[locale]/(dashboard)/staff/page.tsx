"use client";

import { Badge, Card, CardContent } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import type { Staff } from "@/lib/api-types";

export default function StaffPage() {
  const { data, loading } = useApiData<Staff[]>("/staff");

  if (loading || !data) {
    return <p className="text-muted-foreground">…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
      <div className="mt-6 space-y-3">
        {data.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between">
              <p className="font-semibold">{member.name}</p>
              <Badge variant={member.active ? "success" : "outline"}>{member.active ? "Actif" : "Inactif"}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
