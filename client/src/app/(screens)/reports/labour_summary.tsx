import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar } from "../../../components/Calendar";
import { api } from "../../../services/api";

interface ReportItem {
    id: number;
    name: string;
    rate: number;
    full_days: number;
    half_days: number;
    absent_days: number;
    wage: number;
    overtime_amount: number;
    advance_amount: number;
    net_payable: number;
}

export default function LabourSummaryScreen() {
    const router = useRouter();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [generated, setGenerated] = useState(false);

    // Dummy marked dates for calendar, or could fetch holidays/attendance if needed
    const [markedDates, setMarkedDates] = useState<string[]>([]);

    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const fetchReport = async () => {
        try {
            setLoading(true);
            const startStr = formatDate(startDate);
            const endStr = formatDate(endDate);

            // Validate range
            if (startDate > endDate) {
                Alert.alert("Error", "Start date cannot be after end date");
                setLoading(false);
                return;
            }

            const response = await api.get(`/reports/labour-summary?startDate=${startStr}&endDate=${endStr}`);

            if (response.ok) {
                const data = await response.json();
                setReportData(data);
                setGenerated(true);
            } else {
                const err = await response.json();
                Alert.alert("Error", err.error || "Failed to fetch report");
            }
        } catch (error) {
            console.error("Report fetch error:", error);
            Alert.alert("Error", "Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: ReportItem }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.netPay}>₹{item.net_payable.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>₹{item.rate}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Days (F/H)</Text>
                    <Text style={styles.detailValue}>{item.full_days} / {item.half_days}</Text>
                </View>
            </View>
            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Wage</Text>
                    <Text style={styles.detailValue}>₹{item.wage.toFixed(2)}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Overtime</Text>
                    <Text style={styles.detailValue}>+₹{item.overtime_amount.toFixed(2)}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Advance</Text>
                    <Text style={styles.detailValue}>-₹{item.advance_amount.toFixed(2)}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>Labour Summary</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.filterSection}>
                <View style={styles.dateRow}>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowStartCalendar(true)}
                    >
                        <Text style={styles.dateLabel}>From:</Text>
                        <View style={styles.dateValueContainer}>
                            <MaterialIcons name="event" size={20} color="#0a84ff" />
                            <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowEndCalendar(true)}
                    >
                        <Text style={styles.dateLabel}>To:</Text>
                        <View style={styles.dateValueContainer}>
                            <MaterialIcons name="event" size={20} color="#0a84ff" />
                            <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={fetchReport}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.generateBtnText}>Generate Report</Text>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={reportData}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    generated && !loading ? (
                        <Text style={styles.emptyText}>No data found for this period.</Text>
                    ) : (
                        !generated ? (
                            <Text style={styles.emptyText}>Select dates and generate report.</Text>
                        ) : null
                    )
                }
            />

            {/* Start Date Modal */}
            <Modal
                visible={showStartCalendar}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowStartCalendar(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowStartCalendar(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Select Start Date</Text>
                        <Calendar
                            selectedDate={startDate}
                            onDateSelect={(date) => {
                                setStartDate(date);
                                setShowStartCalendar(false);
                            }}
                            markedDates={markedDates}
                            onMonthChange={() => { }}
                        />
                        <Pressable
                            style={styles.closeBtn}
                            onPress={() => setShowStartCalendar(false)}
                        >
                            <Text style={styles.closeBtnText}>Cancel</Text>
                        </Pressable>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* End Date Modal */}
            <Modal
                visible={showEndCalendar}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowEndCalendar(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowEndCalendar(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Select End Date</Text>
                        <Calendar
                            selectedDate={endDate}
                            onDateSelect={(date) => {
                                setEndDate(date);
                                setShowEndCalendar(false);
                            }}
                            markedDates={markedDates}
                            onMonthChange={() => { }}
                        />
                        <Pressable
                            style={styles.closeBtn}
                            onPress={() => setShowEndCalendar(false)}
                        >
                            <Text style={styles.closeBtnText}>Cancel</Text>
                        </Pressable>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        elevation: 2,
        marginTop: 20
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    filterSection: {
        padding: 16,
        backgroundColor: "#fff",
        marginBottom: 8,
    },
    dateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 12,
    },
    dateInput: {
        flex: 1,
        backgroundColor: "#f9f9f9",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#eee",
    },
    dateLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    dateValueContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    generateBtn: {
        backgroundColor: "#0a84ff",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    generateBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    netPay: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2e7d32", // Green
    },
    divider: {
        height: 1,
        backgroundColor: "#eee",
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: "#888",
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "500",
        color: "#444",
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        color: "#999",
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#333',
    },
    closeBtn: {
        marginTop: 10,
        alignItems: 'center',
        padding: 10,
    },
    closeBtnText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    }
});
