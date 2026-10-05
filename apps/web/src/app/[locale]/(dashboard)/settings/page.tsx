"use client";

import { useState } from "react";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api-client";
import type { Salon } from "@/lib/api-types";

export default function SettingsPage() {
  const { data, loading } = useApiData<{ salon: Salon }>("/salons/me");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  if (loading || !data) {
    return <p className="text-muted-foreground">…</p>;
  }

  const salon = data.salon;

  async function save() {
    await apiFetch("/salons/me", { method: "PATCH", body: JSON.stringify({ name }) });
    setSaved(true);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Profil du salon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" defaultValue={salon.name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground">Slug : {salon.slug}</p>
          <Button onClick={save} disabled={!name}>
            Save
          </Button>
          {saved ? <p className="text-sm text-green-600">✓ Enregistré</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
