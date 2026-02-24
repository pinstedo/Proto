import { Stack } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
	return (
		<ThemeProvider>
			<SafeAreaView style={{ flex: 1 }}>
				<Stack screenOptions={{ headerShown: false }} />
			</SafeAreaView>
		</ThemeProvider>
	);
}
