import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../../services/api";

interface SiteReport {
    site_id: number;
    site_name: string;
    total_labourers: number;
    present_count: number;
    absent_count: number;
    is_submitted: number; // 0 or 1
}

export default function SiteAttendanceReport() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [reports, setReports] = useState<SiteReport[]>([]);

    const fetchReports = async (selectedDate: Date) => {
        setLoading(true);
        try {
            const dateStr = selectedDate.toISOString().split("T")[0];
            const response = await api.get(`/reports/site-attendance?date=${dateStr}`);
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            } else {
                Alert.alert("Error", "Failed to load reports");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "An error occurred while fetching reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(date);
    }, [date]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const formatDate = (d: Date) => {
        return d.toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const changeDate = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        setDate(newDate);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: "Site Attendance Report" }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowBtn}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateDisplay}>
                    <Ionicons name="calendar-outline" size={20} color="#555" style={{ marginRight: 8 }} />
                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowBtn}>
                    <Ionicons name="chevron-forward" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#eb9834" style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {reports.map((site) => (
                        <View key={site.site_id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.siteName}>{site.site_name}</Text>
                                {site.is_submitted ? (
                                    <View style={[styles.badge, styles.badgeSubmitted]}>
                                        <Ionicons name="checkmark-circle" size={14} color="#155724" />
                                        <Text style={styles.badgeTextSubmitted}>Submitted</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.badge, styles.badgePending]}>
                                        <Ionicons name="time" size={14} color="#856404" />
                                        <Text style={styles.badgeTextPending}>Pending</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Present</Text>
                                    <Text style={[styles.statValue, { color: '#28a745' }]}>{site.present_count}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Absent</Text>
                                    <Text style={[styles.statValue, { color: '#dc3545' }]}>{site.absent_count}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Total</Text>
                                    <Text style={styles.statValue}>{site.total_labourers}</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {reports.length === 0 && (
                        <Text style={styles.emptyText}>No sites found.</Text>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f6f8",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 15,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    arrowBtn: {
        padding: 10,
    },
    dateDisplay: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    dateText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    scrollContent: {
        padding: 15,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 15,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    siteName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#222",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    badgeSubmitted: {
        backgroundColor: "#d4edda",
    },
    badgePending: {
        backgroundColor: "#fff3cd",
    },
    badgeTextSubmitted: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#155724",
    },
    badgeTextPending: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#856404",
    },
    divider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 10,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    statItem: {
        alignItems: "center",
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    emptyText: {
        textAlign: "center",
        color: "#999",
        marginTop: 50,
        fontSize: 16,
    },
});
