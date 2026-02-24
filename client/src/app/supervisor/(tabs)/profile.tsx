import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../../constants";
import { useTheme } from "../../../context/ThemeContext";
import { styles as commonStyles } from "../../style/stylesheet1";

export default function SupervisorProfile() {
    const router = useRouter();
    const { theme, toggleTheme, isDark } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

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
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Validation", "New password must be at least 6 characters.");
            return;
        }

        try {
            setIsChangingPassword(true);
            const token = await AsyncStorage.getItem("token");

            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            let data;
            const textResponse = await response.text();
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                console.error("Non-JSON response from server:", textResponse);
                Alert.alert("Server Error", "Received an unexpected response from the server. Please manually restart the backend server so it can load the new API endpoint.");
                setIsChangingPassword(false);
                return;
            }

            if (response.ok) {
                Alert.alert("Success", "Password changed successfully!");
                setIsPasswordModalVisible(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                Alert.alert("Error", data.error || "Failed to change password");
            }
        } catch (error) {
            console.error("Change password error:", error);
            Alert.alert("Error", "Unable to connect to server");
        } finally {
            setIsChangingPassword(false);
        }
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

    const localStyles = getStyles(isDark);
    const userRole = user?.role || "Supervisor";

    return (
        <SafeAreaView style={[commonStyles.mainContainer, { backgroundColor: isDark ? "#121212" : "#f5f5f5" }]}>
            <ScrollView
                contentContainerStyle={commonStyles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a84ff']} />
                }
            >
                <Text style={[commonStyles.header, { color: isDark ? "#ffffff" : "#000000" }]}>Profile</Text>

                {user && (
                    <View style={localStyles.userCard}>
                        <Text style={localStyles.userName}>{user.name}</Text>
                        <Text style={localStyles.userInfo}>Role: {user.role}</Text>
                        <Text style={localStyles.userInfo}>Phone: {user.phone}</Text>
                    </View>
                )}

                <View style={[localStyles.themeRow, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
                    <Text style={[localStyles.themeLabel, { color: isDark ? "#ffffff" : "#000000" }]}>Dark Mode</Text>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: "#ccc", true: "#0a84ff" }}
                        thumbColor={isDark ? "#fff" : "#f4f3f4"}
                    />
                </View>
                <View style={localStyles.actions}>
                    <TouchableOpacity style={localStyles.actionBtn} onPress={() => setIsPasswordModalVisible(true)}>
                        <Text style={localStyles.actionText}>Change Password</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[commonStyles.optionCard, { justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#3f1a1a' : '#fee2e2', marginTop: 20 }]}
                    onPress={handleLogout}
                >
                    <Text style={{ color: isDark ? '#ef4444' : '#ef4444', fontSize: 16, fontWeight: '600' }}>Logout</Text>
                </TouchableOpacity>

                {/* Change Password Modal */}
                <Modal
                    visible={isPasswordModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setIsPasswordModalVisible(false)}
                >
                    <View style={localStyles.modalOverlay}>
                        <View style={localStyles.modalContent}>
                            <View style={localStyles.modalHeader}>
                                <Text style={localStyles.modalTitle}>Change Password</Text>
                                <Pressable onPress={() => setIsPasswordModalVisible(false)}>
                                    <Text style={localStyles.closeText}>Cancel</Text>
                                </Pressable>
                            </View>

                            <View style={localStyles.inputGroup}>
                                <Text style={localStyles.label}>Current Password</Text>
                                <TextInput
                                    style={[localStyles.input, { color: isDark ? "#fff" : "#000" }]}
                                    placeholder="Enter current password"
                                    placeholderTextColor={isDark ? "#888" : "#999"}
                                    secureTextEntry
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                />
                            </View>

                            <View style={localStyles.inputGroup}>
                                <Text style={localStyles.label}>New Password</Text>
                                <TextInput
                                    style={[localStyles.input, { color: isDark ? "#fff" : "#000" }]}
                                    placeholder="Enter new password"
                                    placeholderTextColor={isDark ? "#888" : "#999"}
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                            </View>

                            <View style={localStyles.inputGroup}>
                                <Text style={localStyles.label}>Confirm New Password</Text>
                                <TextInput
                                    style={[localStyles.input, { color: isDark ? "#fff" : "#000" }]}
                                    placeholder="Confirm new password"
                                    placeholderTextColor={isDark ? "#888" : "#999"}
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>

                            <TouchableOpacity
                                style={localStyles.saveBtn}
                                onPress={handleChangePassword}
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={localStyles.saveBtnText}>Save Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    userCard: {
        backgroundColor: isDark ? "#1e1e1e" : "#fff",
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    userName: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 10,
        color: isDark ? "#ffffff" : "#000000"
    },
    userInfo: {
        fontSize: 16,
        color: isDark ? "#aaaaaa" : "#666666",
        marginBottom: 5
    },
    themeRow: {
        width: "100%",
        padding: 20,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    themeLabel: {
        fontSize: 16,
        fontWeight: "500",
    },
    actions: { flexDirection: "row", marginTop: 20 },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: "#0a84ff",
        borderRadius: 8,
        alignItems: "center",
    },
    actionText: { color: "#fff", fontWeight: "700" },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: isDark ? "#1e1e1e" : "#fff",
        borderRadius: 12,
        padding: 20,
        width: "100%",
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", color: isDark ? "#ffffff" : "#000000" },
    closeText: { color: "#0a84ff", fontWeight: "600" },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, color: isDark ? "#aaaaaa" : "#666666", marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: isDark ? "#444" : "#ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: isDark ? "#2a2a2a" : "#fff",
    },
    saveBtn: {
        backgroundColor: "#0a84ff",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
    },
    saveBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
});
