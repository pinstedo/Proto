import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../../constants";
import { styles } from "../../style/stylesheet1";

export default function SupervisorProfile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async (isRefresh = false) => {
        try {
            const userData = await AsyncStorage.getItem("userData");
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        } finally {
            if (isRefresh) setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadUser(true);
    };

    const handleLogout = async () => {
        Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    try {
                        const refreshToken = await AsyncStorage.getItem("refreshToken");
                        if (refreshToken) {
                            await fetch(`${API_URL}/auth/logout`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ refreshToken }),
                            });
                        }
                    } catch (error) {
                        console.error("Logout error:", error);
                    } finally {
                        await AsyncStorage.clear();
                        router.replace("/auth/authentication2" as any);
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a84ff']} />
                }
            >
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
            </ScrollView>
        </SafeAreaView>
    );
}
