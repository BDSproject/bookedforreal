import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { useSalon } from "@/hooks/use-salons";
import { t } from "@/lib/i18n";

export default function SalonDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data: salon } = useSalon(slug ?? "");

  if (!salon) {
    return <View className="flex-1 bg-white" />;
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900">{salon.name}</Text>
        <Text className="mt-1 text-gray-500">
          {salon.city}
          {salon.district ? ` · ${salon.district}` : ""}
        </Text>
        {salon.description ? <Text className="mt-2 text-gray-600">{salon.description}</Text> : null}

        <Text className="mt-8 text-xl font-semibold">{t("salon.services")}</Text>
        {salon.services?.map((service) => (
          <View key={service.id} className="mt-2 flex-row justify-between rounded-xl border border-gray-200 p-4">
            <Text className="font-medium text-gray-900">{service.nameFr}</Text>
            <Text className="text-gray-500">
              {(service.priceCents / 100).toFixed(2)} € · {service.durationMin} min
            </Text>
          </View>
        ))}

        <Text className="mt-8 text-xl font-semibold">{t("salon.staff")}</Text>
        <Text className="mt-2 text-gray-600">{salon.staff?.map((s) => s.name).join(", ")}</Text>
      </View>

      <View className="p-6">
        <Button label={t("salon.book")} size="xl" onPress={() => router.push(`/booking/${salon.slug}`)} />
      </View>
    </ScrollView>
  );
}
