import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { setOnboarded } from "@/lib/store";

function slides() {
  return [
    { title: t("onboarding.title1"), subtitle: t("onboarding.subtitle1") },
    { title: t("onboarding.title2"), subtitle: t("onboarding.subtitle2") },
    { title: t("onboarding.title3"), subtitle: t("onboarding.subtitle3") },
  ];
}

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const data = slides();
  const isLast = index === data.length - 1;

  async function finish() {
    await setOnboarded(true);
    router.replace("/(tabs)");
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-primary mb-8 h-32 w-32 items-center justify-center rounded-3xl">
          <Text className="text-6xl font-bold text-white">B</Text>
        </View>
        <Text className="text-center text-3xl font-extrabold text-gray-900">
          {data[index]!.title}
        </Text>
        <Text className="mt-4 text-center text-lg text-gray-500">{data[index]!.subtitle}</Text>
      </View>

      <View className="flex-row justify-center gap-2">
        {data.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full ${i === index ? "bg-primary w-6" : "w-2 bg-gray-300"}`}
          />
        ))}
      </View>

      <View className="p-6">
        {isLast ? (
          <Button label={t("onboarding.getStarted")} size="xl" onPress={finish} />
        ) : (
          <Button label={t("common.next")} size="xl" onPress={() => setIndex(index + 1)} />
        )}
        {!isLast ? (
          <Pressable className="mt-3 items-center" onPress={finish}>
            <Text className="text-gray-500">{t("onboarding.skip")}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
