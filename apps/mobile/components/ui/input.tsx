import { Text, TextInput, View, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <View className="w-full">
      {label ? <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text> : null}
      <TextInput
        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-gray-900"
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
}
