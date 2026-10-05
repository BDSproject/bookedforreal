import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { useLogout } from "@/hooks/use-auth";
import { getLocale, setLocale, t, type AppLocale } from "@/lib/i18n";

const LOCALES: AppLocale[] = ["fr", "en"];

export default function Profile() {
  const [locale, setLocaleState] = useState<AppLocale>(getLocale());
  const [notifications, setNotifications] = useState(true);
  const logout = useLogout();

  function switchLocale(next: AppLocale) {
    setLocale(next);
    setLocaleState(next);
  }

  return (
    <View className="flex-1 bg-surface px-4 pt-6">
      <Text className="text-2xl font-bold text-gray-900">{t("profile.title")}</Text>

      <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
        <Text className="font-medium text-gray-900">{t("profile.language")}</Text>
        <View className="mt-3 flex-row gap-2">
          {LOCALES.map((l) => (
            <Pressable
              key={l}
              onPress={() => switchLocale(l)}
              className={`rounded-full px-4 py-2 ${locale === l ? "bg-primary" : "bg-gray-100"}`}
            >
              <Text className={locale === l ? "text-white" : "text-gray-700"}>{l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white p-4">
        <Text className="font-medium text-gray-900">{t("profile.notifications")}</Text>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>

      <Pressable className="mt-8" onPress={logout}>
        <Text className="text-center font-semibold text-red-500">{t("profile.logout")}</Text>
      </Pressable>
    </View>
  );
}
