import { Pressable, Text } from "react-native";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "ghost";
  size?: "md" | "lg" | "xl";
  disabled?: boolean;
}

/** Large, rounded button (primary violet). */
export function Button({ label, onPress, variant = "primary", size = "lg", disabled }: ButtonProps) {
  const variants = {
    primary: "bg-primary",
    outline: "border border-primary bg-white",
    ghost: "bg-transparent",
  };
  const sizes = {
    md: "h-11 px-6",
    lg: "h-12 px-8",
    xl: "h-14 px-10",
  };
  const textVariants = {
    primary: "text-white",
    outline: "text-primary",
    ghost: "text-primary",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center justify-center rounded-xl ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50" : ""}`}
    >
      <Text className={`text-lg font-bold ${textVariants[variant]}`}>{label}</Text>
    </Pressable>
  );
}
