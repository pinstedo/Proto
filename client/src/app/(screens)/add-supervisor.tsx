import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from "../../constants";
import { styles as globalStyles } from "../style/stylesheet";

export default function AddSupervisorScreen() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const handleAddSupervisor = async () => {
        if (!name.trim()) {
            Alert.alert("Validation Error", "Please enter the supervisor's name.");
            return;
        }
        if (!phone.trim()) {
            Alert.alert("Validation Error", "Please enter the phone number.");
            return;
        }
        if (phone.trim().length < 10) {
            Alert.alert("Validation Error", "Phone number must be at least 10 digits.");
            return;
        }
        if (!password.trim()) {
            Alert.alert("Validation Error", "Please enter a password.");
            return;
        }
        if (password.trim().length < 6) {
            Alert.alert("Validation Error", "Password must be at least 6 characters.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/add-supervisor`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, password }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Supervisor added successfully!", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            } else {
                Alert.alert("Error", data.error || "Failed to add supervisor");
            }
        } catch (error) {
            console.error("Add supervisor error:", error);
            Alert.alert("Error", "Unable to connect to server");
        }
    };

    return (
        <View style={globalStyles.container}>
            <TouchableOpacity onPress={() => router.back()} style={localStyles.backButton}>
                <Text style={localStyles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={globalStyles.head1}>Add Supervisor</Text>
            <Text style={globalStyles.head}>Create a new supervisor account</Text>

            <Text style={globalStyles.labelname}>Full Name</Text>
            <TextInput
                style={globalStyles.valbox}
                placeholder="Supervisor Name"
                onChangeText={setName}
                value={name}
            />

            <Text style={globalStyles.labelname}>Phone Number</Text>
            <TextInput
                style={globalStyles.valbox}
                onChangeText={setPhone}
                value={phone}
                placeholder="10 digit phone number"
                keyboardType="phone-pad"
            />

            <Text style={globalStyles.labelname}>Initial Password</Text>
            <TextInput
                style={globalStyles.valbox}
                onChangeText={setPassword}
                value={password}
                placeholder="At least 6 characters"
                secureTextEntry
            />

            <TouchableOpacity onPress={handleAddSupervisor}>
                <Text style={globalStyles.buttonText}>Add Supervisor</Text>
            </TouchableOpacity>
        </View>
    );
}

const localStyles = StyleSheet.create({
    backButton: {
        marginBottom: 20,
    },
    backArrow: {
        fontSize: 24,
        color: "#000",
    },
});
