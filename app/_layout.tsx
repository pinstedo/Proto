import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="authentication" options={{ title: "next" }} />
        <Stack.Screen name="home" options={{ title: "Home" }} />
        <Stack.Screen name="index" options={{ title: "profile" }} />
      </Stack>
    </SafeAreaView>
  );
};