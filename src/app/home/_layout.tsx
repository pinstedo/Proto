import { Stack } from "expo-router/stack";
import { default as React } from "react";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerTitle: "Home", headerShown: false }}
      />
    </Stack>
  );
}