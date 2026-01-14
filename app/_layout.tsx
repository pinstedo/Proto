import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown:false }}>
      <Stack.Screen name="auth/splashScreen" />
      <Stack.Screen name="auth/authentication" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-labour" />
      <Stack.Screen name="labours" />
    </Stack>
  );
}
