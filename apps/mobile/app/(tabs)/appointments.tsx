import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

import { t } from "@/lib/i18n";
import { getStoredAppointments, type StoredAppointment } from "@/lib/store";

export default function Appointments() {
  const [items, setItems] = useState<StoredAppointment[]>([]);

  useEffect(() => {
    getStoredAppointments().then(setItems);
  }, []);

  return (
    <View className="flex-1 bg-surface px-4 pt-6">
      <Text className="text-2xl font-bold text-gray-900">{t("appointments.title")}</Text>

      {items.length === 0 ? (
        <Text className="mt-4 text-gray-500">{t("appointments.empty")}</Text>
      ) : (
        <FlatList
          className="mt-4"
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
              <Text className="font-semibold text-gray-900">
                {item.date} · {item.time}
              </Text>
              <Text className="mt-1 text-gray-500">{item.slug}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
