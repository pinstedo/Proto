import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { JSX, useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { api } from "../../../services/api";
import { getStyles } from "../../style/stylesheet1";

interface Site {
    id: number;
    name: string;
    address: string;
}

const options = [
    { key: "attendance", icon: "check-circle", title: "Attendance", desc: "Record and view attendance" },
    { key: "labours", icon: "group", title: "Labours", desc: "View assigned labours" },
    { key: "overtime", icon: "timer", title: "Overtime", desc: "Log overtime hours" },
    { key: "advance", icon: "account-balance-wallet", title: "Advance", desc: "Manage advances" },
    { key: "add-labour", icon: "person-add", title: "Add Labours", desc: "Add new labours to the system" },
];

export default function SupervisorHome(): JSX.Element {
    const router = useRouter();
    const { isDark } = useTheme();
    const styles = getStyles(isDark);
    const [assignedSites, setAssignedSites] = useState<Site[]>([]);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAssignedSites = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            // Get supervisor ID from stored user data
            const userDataStr = await AsyncStorage.getItem("userData");
            if (!userDataStr) {
                Alert.alert("Error", "User session not found. Please login again.");
                return;
            }

            const userData = JSON.parse(userDataStr);
            const response = await api.get(`/sites/supervisor/${userData.id}`);
            const data = await response.json();

            if (response.ok) {
                setAssignedSites(data);
                if (data.length > 0 && !selectedSite) {
                    setSelectedSite(data[0]);
                }
            } else {
                console.error("Failed to fetch sites:", data.error);
            }
        } catch (error) {
            console.error("Fetch assigned sites error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchAssignedSites(true);
    };

    useFocusEffect(
        useCallback(() => {
            fetchAssignedSites();
        }, [])
    );

    const onPress = (key: string) => {
        if (key === "add-labour") {
            // Pass selected site ID if available
            if (selectedSite) {
                router.push(`/(screens)/add-labour?siteId=${selectedSite.id}&siteName=${encodeURIComponent(selectedSite.name)}` as any);
            } else {
                router.push("/(screens)/add-labour");
            }
            return;
        }
        if (key === "attendance") {
            if (selectedSite) {
                router.push(`/(screens)/attendance?siteId=${selectedSite.id}&siteName=${encodeURIComponent(selectedSite.name)}` as any);
            } else {
                Alert.alert("Error", "Please select a site first.");
            }
            return;
        }
        if (key === "overtime") {
            router.push("/(screens)/overtime");
            return;
        }
        if (key === "labours") {
            // Navigate to shared labours screen, it will handle fetching based on role/id
            router.push("/(screens)/labours");
            return;
        }
        if (key === "advance") {
            router.push("/(screens)/advance");
            return;
        }
        // navigate to dedicated management screen (ensure routes exist or create them)
        router.push(`/manage/${key}` as any);
    };

    const localStyles = {
        siteSection: {
            marginBottom: 20,
            backgroundColor: isDark ? "#1e1e1e" : "#fff",
            padding: 16,
            borderRadius: 12,
        } as const,
        siteLabel: {
            fontSize: 14,
            fontWeight: "600" as const,
            color: isDark ? "#fff" : "#333",
            marginBottom: 12,
        },
        siteScroll: {
            flexDirection: "row" as const,
        },
        siteChip: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: isDark ? "#333" : "#e8f4ff",
            borderRadius: 20,
            marginRight: 10,
            gap: 6,
        },
        siteChipActive: {
            backgroundColor: "#0a84ff",
        },
        siteChipText: {
            fontSize: 14,
            color: isDark ? "#4da6ff" : "#0a84ff",
            fontWeight: "500" as const,
        },
        siteChipTextActive: {
            color: "#fff",
        },
        noSitesContainer: {
            alignItems: "center" as const,
            padding: 32,
            backgroundColor: isDark ? "#1e1e1e" : "#fff",
            borderRadius: 12,
            marginBottom: 20,
        },
        noSitesText: {
            fontSize: 16,
            color: isDark ? "#aaa" : "#666",
            marginTop: 12,
        },
        noSitesSubtext: {
            fontSize: 14,
            color: isDark ? "#777" : "#999",
            marginTop: 4,
        },
    };

    return (
        <View style={styles.mainContainer}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a84ff']} />
                }
            >
                <Text style={styles.header}>Supervisor Dashboard</Text>

                {/* Site Selector */}
                {assignedSites.length > 0 && (
                    <View style={localStyles.siteSection}>
                        <Text style={localStyles.siteLabel}>Assigned Sites</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.siteScroll}>
                            {assignedSites.map((site) => (
                                <Pressable
                                    key={site.id}
                                    style={[
                                        localStyles.siteChip,
                                        selectedSite?.id === site.id && localStyles.siteChipActive
                                    ]}
                                    onPress={() => setSelectedSite(site)}
                                >
                                    <MaterialIcons
                                        name="location-city"
                                        size={16}
                                        color={selectedSite?.id === site.id ? "#fff" : (isDark ? "#4da6ff" : "#0a84ff")}
                                    />
                                    <Text style={[
                                        localStyles.siteChipText,
                                        selectedSite?.id === site.id && localStyles.siteChipTextActive
                                    ]}>
                                        {site.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {assignedSites.length === 0 && !loading && (
                    <View style={localStyles.noSitesContainer}>
                        <MaterialIcons name="location-off" size={48} color={isDark ? "#555" : "#ccc"} />
                        <Text style={localStyles.noSitesText}>No sites assigned to you yet</Text>
                        <Text style={localStyles.noSitesSubtext}>Contact your admin to get assigned to a site</Text>
                    </View>
                )}

                <View style={styles.grid}>
                    {options.map((opt) => (
                        <Pressable
                            key={opt.key}
                            style={styles.optionCard}
                            onPress={() => onPress(opt.key)}
                            accessibilityRole="button"
                            accessibilityLabel={opt.title}
                        >
                            <View style={styles.optionIconWrap}>
                                <MaterialIcons name={opt.icon as any} size={20} color={isDark ? "#4da6ff" : "#0a84ff"} />
                            </View>

                            <Text style={styles.optionTitle}>{opt.title}</Text>
                            <Text style={styles.optionDesc}>{opt.desc}</Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

