import { useState } from "react";
import { Text, View } from "react-native";
import { Link, useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/use-auth";
import { t } from "@/lib/i18n";

export default function Login() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    try {
      await login.mutateAsync({ email, password });
      router.replace("/(tabs)");
    } catch {
      // Keep the scaffold minimal; a real app shows an inline error.
    }
  }

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="text-3xl font-extrabold text-gray-900">{t("auth.login")}</Text>

      <View className="mt-6 gap-4">
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
        <Button label={t("auth.login")} size="xl" onPress={submit} disabled={login.isPending} />
      </View>

      <Link href="/auth/register" className="text-primary mt-4 text-center">
        {t("auth.noAccount")} {t("auth.register")}
      </Link>
    </View>
  );
}
