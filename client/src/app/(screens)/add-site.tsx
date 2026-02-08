import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_URL } from "../../constants";
import { styles as globalStyles } from "../style/stylesheet";

export default function AddSite() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");

    const onSubmit = async () => {
        if (!name.trim()) {
            Alert.alert("Validation", "Please enter the site name.");
            return;
        }

        try {
            const payload = { name, address, description };
            const response = await fetch(`${API_URL}/sites`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                Alert.alert("Success", "Site added successfully.", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            } else {
                const errorData = await response.json();
                Alert.alert("Error", errorData.error || "Failed to add site");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to connect to server");
        }
    };

    return (
        <ScrollView contentContainerStyle={local.container}>
            <View style={local.header}>
                <Text style={globalStyles.head1}>Add Site</Text>
                <Text style={local.sub}>Enter site details below</Text>
            </View>

            <View style={local.form}>
                <Text style={local.label}>Site Name *</Text>
                <TextInput
                    style={local.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g., Construction Site A"
                />

                <Text style={local.label}>Address</Text>
                <TextInput
                    style={local.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Site address or location"
                />

                <Text style={local.label}>Description</Text>
                <TextInput
                    style={[local.input, { height: 90 }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Optional description or notes"
                    multiline
                />

                <TouchableOpacity style={local.cancelBtn} onPress={() => router.back()}>
                    <Text style={local.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={local.submitBtn} onPress={onSubmit}>
                    <Text style={local.submitText}>Add Site</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const local = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 40,
        minHeight: "100%",
        backgroundColor: "#fff",
    },
    header: {
        alignItems: "center",
        marginBottom: 20,
    },
    sub: {
        color: "#666",
        marginTop: 6,
        fontSize: 16,
    },
    form: {
        marginTop: 6,
    },
    label: {
        marginTop: 12,
        marginBottom: 6,
        color: "#333",
        fontWeight: "500",
    },
    input: {
        borderWidth: 1,
        borderColor: "#e6e6e6",
        padding: 12,
        borderRadius: 8,
        backgroundColor: "#fafafa",
        fontSize: 16,
    },
    cancelBtn: {
        marginTop: 18,
        backgroundColor: "#ddd",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    cancelText: {
        color: "#333",
        fontWeight: "700",
    },
    submitBtn: {
        marginTop: 12,
        backgroundColor: "#0a84ff",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    submitText: {
        color: "#fff",
        fontWeight: "700",
    },
});
