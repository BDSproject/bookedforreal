import { useState } from "react";
import { Text, View } from "react-native";
import { Link, useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/use-auth";
import { t } from "@/lib/i18n";

export default function Register() {
  const router = useRouter();
  const register = useRegister();
  const [salonName, setSalonName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    try {
      await register.mutateAsync({ email, password, salonName });
      router.replace("/auth/login");
    } catch {
      // Keep the scaffold minimal.
    }
  }

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="text-3xl font-extrabold text-gray-900">{t("auth.register")}</Text>

      <View className="mt-6 gap-4">
        <Input label={t("auth.salonName")} value={salonName} onChangeText={setSalonName} />
        <Input
          label={t("auth.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          label={t("auth.register")}
          size="xl"
          onPress={submit}
          disabled={register.isPending}
        />
      </View>

      <Link href="/auth/login" className="text-primary mt-4 text-center">
        {t("auth.haveAccount")} {t("auth.login")}
      </Link>
    </View>
  );
}
