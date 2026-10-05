import AsyncStorage from "@react-native-async-storage/async-storage";

/** Lightweight local persistence for non-sensitive app state. */

export async function hasOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem("onboarded")) === "true";
}

export async function setOnboarded(value: boolean): Promise<void> {
  await AsyncStorage.setItem("onboarded", String(value));
}

export interface StoredAppointment {
  id: string;
  slug: string;
  date: string;
  time: string;
}

/** Guest appointments are tracked locally (no account required to book). */
export async function getStoredAppointments(): Promise<StoredAppointment[]> {
  const raw = await AsyncStorage.getItem("appointments");
  return raw ? (JSON.parse(raw) as StoredAppointment[]) : [];
}

export async function addStoredAppointment(appointment: StoredAppointment): Promise<void> {
  const list = await getStoredAppointments();
  await AsyncStorage.setItem("appointments", JSON.stringify([appointment, ...list]));
}
