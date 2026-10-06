import { useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";

import { SalonCard } from "@/components/salon-card";
import { useSalons } from "@/hooks/use-salons";
import { t } from "@/lib/i18n";

export default function Search() {
  const [city, setCity] = useState("");
  const { data } = useSalons(city || undefined);

  return (
    <View className="bg-surface flex-1 px-4 pt-6">
      <Text className="text-2xl font-bold text-gray-900">{t("search.title")}</Text>
      <TextInput
        className="mt-4 h-12 rounded-xl border border-gray-300 bg-white px-4 text-gray-900"
        placeholder={t("search.placeholder")}
        value={city}
        onChangeText={setCity}
      />

      <FlatList
        className="mt-4"
        data={data ?? []}
        keyExtractor={(salon) => salon.id}
        renderItem={({ item }) => <SalonCard salon={item} />}
      />
    </View>
  );
}
