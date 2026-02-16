import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../services/api";

export default function AddSupervisorScreen() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

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

        setLoading(true);
        try {
            const response = await api.post("/auth/add-supervisor", {
                name,
                phone,
                password,
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Add Supervisor</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>New Account Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: John Doe"
                                placeholderTextColor="#999"
                                onChangeText={setName}
                                value={name}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="10 digit number"
                                placeholderTextColor="#999"
                                onChangeText={setPhone}
                                value={phone}
                                keyboardType="phone-pad"
                                maxLength={15}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Min 6 characters"
                                placeholderTextColor="#999"
                                onChangeText={setPassword}
                                value={password}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleAddSupervisor}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? "Creating..." : "Create Account"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa",
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
        marginTop: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#fff",
        marginRight: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2d3436",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#636e72",
        marginBottom: 20,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2d3436",
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f6fa",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e1e1e1",
        paddingHorizontal: 15,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#2d3436",
        height: "100%",
    },
    eyeIcon: {
        padding: 8,
    },
    submitButton: {
        backgroundColor: "#eb8934",
        borderRadius: 12,
        height: 55,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#eb8934",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: "#fab1a0",
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
});
