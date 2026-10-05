import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="absolute bottom-0 w-full rounded-t-3xl bg-white p-6">{children}</View>
    </Modal>
  );
}
