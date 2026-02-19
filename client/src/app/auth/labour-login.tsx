import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { API_URL } from "../../constants";
import { styles } from "../style/stylesheet";

const LabourLogin = () => {
    const router = useRouter();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const handleLogin = async () => {
        if (!name.trim()) {
            Alert.alert("Validation Error", "Please enter your name.");
            return;
        }
        if (!phone.trim()) {
            Alert.alert("Validation Error", "Please enter your phone number.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/labour-signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store user data and token
                await AsyncStorage.setItem("userData", JSON.stringify(data.user));
                await AsyncStorage.setItem("token", data.accessToken);
                await AsyncStorage.setItem("refreshToken", data.refreshToken);
                await AsyncStorage.setItem("userRole", "labour");

                router.replace("/(labour)/dashboard");
            } else {
                Alert.alert("Login Failed", data.error || "Failed to login");
            }
        } catch (error) {
            console.error("Login error:", error);
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
                <Text style={styles.head1}>Labour Access</Text>
                <Text style={styles.head}>Sign in to continue</Text>

                <Text style={styles.labelname}>Name</Text>
                <TextInput
                    style={styles.valbox}
                    placeholder="Enter your name"
                    onChangeText={(text: string) => setName(text)}
                    value={name}
                />

                <Text style={styles.labelname}>Phone Number</Text>
                <TextInput
                    style={styles.valbox}
                    placeholder="Enter your phone number"
                    onChangeText={(text: string) => setPhone(text)}
                    value={phone}
                    keyboardType="phone-pad"
                />

                <TouchableOpacity onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.linkstyle}>Back to Supervisor/Admin Login</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LabourLogin;
