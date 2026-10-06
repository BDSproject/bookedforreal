import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";

/** Simple 14-day horizontal date picker (returns ISO "YYYY-MM-DD"). */
export function Calendar({ onSelect }: { onSelect: (date: string) => void }) {
  const [selected, setSelected] = useState(0);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {days.map((d, i) => {
        const iso = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
        const active = i === selected;

        return (
          <Pressable
            key={iso}
            onPress={() => {
              setSelected(i);
              onSelect(iso);
            }}
            className={`mr-2 items-center rounded-xl px-4 py-3 ${active ? "bg-primary" : "border border-gray-200 bg-white"}`}
          >
            <Text className={`font-semibold ${active ? "text-white" : "text-gray-900"}`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
