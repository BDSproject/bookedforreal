import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Primary brand color, kept in sync with the web app theme (#7C3AED).
 * TODO: move to a shared design-token package once the mobile theme grows.
 */
const PRIMARY = "#7C3AED";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.brand}>
        <Text style={styles.logo}>B</Text>
      </View>
      <Text style={styles.title}>Bookedforreal</Text>
      <Text style={styles.subtitle}>Book your haircut in 3 clicks</Text>
      <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={() => undefined}>
        <Text style={styles.buttonLabel}>Book now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  brand: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E1B4B",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginTop: 32,
    minWidth: 240,
    alignItems: "center",
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
