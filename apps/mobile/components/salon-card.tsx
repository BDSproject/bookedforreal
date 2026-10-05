import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import type { Salon } from "@/lib/types";

export function SalonCard({ salon }: { salon: Salon }) {
  const router = useRouter();
  const label = salon.type === "BARBER_SHOP" ? "Barbier" : "Coiffeur";

  return (
    <Pressable
      onPress={() => router.push(`/salon/${salon.slug}`)}
      className="mb-3 rounded-2xl border border-gray-200 bg-white p-4"
    >
      <Text className="text-lg font-bold text-gray-900">{salon.name}</Text>
      <Text className="mt-1 text-sm text-gray-500">
        {label} · {salon.city}
        {salon.district ? ` · ${salon.district}` : ""}
      </Text>
      {salon.description ? (
        <Text numberOfLines={2} className="mt-1 text-sm text-gray-500">
          {salon.description}
        </Text>
      ) : null}
    </Pressable>
  );
}
