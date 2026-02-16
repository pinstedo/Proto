import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../style/stylesheet1";

export default function SupervisorProfile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem("userData");
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    const handleLogout = async () => {
        Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await AsyncStorage.clear();
                    router.replace("/auth/authentication2");
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.content}>
                <Text style={styles.header}>Profile</Text>

                {user && (
                    <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>{user.name}</Text>
                        <Text style={{ fontSize: 16, color: "#666", marginBottom: 5 }}>Role: {user.role}</Text>
                        <Text style={{ fontSize: 16, color: "#666" }}>Phone: {user.phone}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.optionCard, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fee2e2' }]}
                    onPress={handleLogout}
                >
                    <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600' }}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
