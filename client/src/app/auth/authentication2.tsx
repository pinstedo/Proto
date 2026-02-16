import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { API_URL } from "../../constants";
import { styles } from "../style/stylesheet";

function onPressBackButton() {
	router.back();
}



const App = () => {
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");

	const handleSignIn = async () => {
		if (!phone.trim()) {
			Alert.alert("Validation Error", "Please enter your phone number.");
			return;
		}
		if (!password.trim()) {
			Alert.alert("Validation Error", "Please enter your password.");
			return;
		}
		// Simple length check for phone (adjust as needed for locale)
		if (phone.trim().length < 10) {
			Alert.alert("Validation Error", "Phone number must be at least 10 digits.");
			return;
		}

		try {
			const response = await fetch(`${API_URL}/auth/signin`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone, password }),
			});

			const data = await response.json();
			console.log('Signin response data:', data);

			if (response.ok) {
				// Store user data and token
				await AsyncStorage.setItem("userData", JSON.stringify(data.user));
				await AsyncStorage.setItem("token", String(data.accessToken));
				await AsyncStorage.setItem("refreshToken", String(data.refreshToken));

				if (data.user.role === 'admin') {
					router.replace("/(tabs)/home");
				} else if (data.user.role === 'supervisor') {
					router.replace("/supervisor/(tabs)/home");
				} else {
					router.replace("/(tabs)/home");
				}
			} else {
				Alert.alert("Sign In Failed", data.error || "Invalid credentials");
			}
		} catch (error) {
			console.error("Sign in error:", error);
			Alert.alert("Error", "Unable to connect to server");
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<TouchableOpacity onPress={onPressBackButton} style={styles.backButton}>
					<Text style={styles.backArrow}>←</Text>
				</TouchableOpacity>
				<Text style={styles.head1}>Sign in</Text>
				<Text style={styles.head}>To continue</Text>
				<Text style={styles.labelname}>Phone Number</Text>
				<TextInput
					style={styles.valbox}
					onChangeText={(text) => setPhone(text)}
					value={phone}
					placeholder="Enter 10 digit phone number"
					keyboardType="phone-pad"
				/>
				<Text style={styles.labelname}>Password</Text>
				<TextInput
					style={styles.valbox}
					onChangeText={(text) => setPassword(text)}
					value={password}
					secureTextEntry
				/>
				<TouchableOpacity onPress={handleSignIn}>
					<Text style={styles.buttonText}>Sign In</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => { }}>
					<Text>forgot Password</Text>
				</TouchableOpacity>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default App;
