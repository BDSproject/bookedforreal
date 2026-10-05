import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useAvailability, useSalon } from "@/hooks/use-salons";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { addStoredAppointment } from "@/lib/store";
import type { Service, Slot } from "@/lib/types";

type Step = "service" | "datetime" | "contact";

export default function Booking() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data: salon } = useSalon(slug ?? "");

  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const staffId = salon?.staff?.[0]?.id ?? "";
  const { data: availability } = useAvailability(slug ?? "", date, service?.id, staffId);
  const slots = (availability?.slots[staffId] ?? []) as Slot[];

  async function confirm() {
    if (!service || !slot || !salon) return;
    try {
      await apiFetch(`/public/salons/${salon.slug}/appointments`, {
        method: "POST",
        body: JSON.stringify({ serviceId: service.id, staffId, name, phone, email, startAt: slot.startAt }),
      });
      await addStoredAppointment({ id: Date.now().toString(), slug: salon.slug, date, time: slot.time });
      router.replace("/(tabs)/appointments");
    } catch {
      // Slot already taken (kept minimal for the scaffold).
    }
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900">{t("booking.title")}</Text>

        {step === "service" ? (
          <View className="mt-6">
            <Text className="font-semibold text-gray-700">{t("booking.service")}</Text>
            {salon?.services?.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  setService(s);
                  setStep("datetime");
                }}
                className="mt-2 rounded-xl border border-gray-200 p-4"
              >
                <Text className="font-medium">{s.nameFr}</Text>
                <Text className="text-gray-500">
                  {(s.priceCents / 100).toFixed(2)} € · {s.durationMin} min
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === "datetime" ? (
          <View className="mt-6">
            <Text className="font-semibold text-gray-700">{t("booking.date")}</Text>
            <View className="mt-2">
              <Calendar onSelect={setDate} />
            </View>

            <Text className="mt-6 font-semibold text-gray-700">{t("booking.time")}</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {slots.map((s) => (
                <Pressable
                  key={s.startAt}
                  onPress={() => {
                    setSlot(s);
                    setStep("contact");
                  }}
                  className={`rounded-xl px-4 py-3 ${slot?.startAt === s.startAt ? "bg-primary" : "border border-gray-200"}`}
                >
                  <Text className={slot?.startAt === s.startAt ? "text-white" : "text-gray-900"}>{s.time}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === "contact" ? (
          <View className="mt-6 gap-4">
            <Text className="font-semibold text-gray-700">{t("booking.contact")}</Text>
            <Input label={t("booking.name")} value={name} onChangeText={setName} />
            <Input label={t("booking.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label={t("booking.email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Button label={t("booking.confirm")} size="xl" onPress={confirm} disabled={!name} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
