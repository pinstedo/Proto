import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { API_URL } from "../../constants";
import { LabourCard } from "../components/LabourCard";

interface Labour {
    id: number;
    name: string;
    phone: string;
    trade: string;
    rate?: number;
    site: string;
    site_id?: number;
    status?: 'active' | 'terminated' | 'blacklisted';
}

export default function Advance() {
    const router = useRouter();
    const { supervisorId } = useLocalSearchParams();
    const [labours, setLabours] = useState<Labour[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Advance Modal State
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useFocusEffect(
        useCallback(() => {
            checkRoleAndFetch();
        }, [supervisorId])
    );

    const checkRoleAndFetch = async () => {
        try {
            const userDataStr = await AsyncStorage.getItem("userData");
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                setIsAdmin(userData.role === "admin");
                setCurrentUserId(userData.id);
                fetchLabours(userData.role === "supervisor" ? userData.id : supervisorId);
            }
        } catch (error) {
            console.error("Error loading user role:", error);
        }
    };

    const fetchLabours = async (supId?: string | string[]) => {
        try {
            setLoading(true);
            let url = `${API_URL}/labours?status=active`; // Only active labours can get advances
            if (supId) {
                url += `&supervisor_id=${supId}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) {
                setLabours(data);
            }
        } catch (error) {
            console.error("Failed to fetch labours", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdvance = (labour: Labour) => {
        setSelectedLabour(labour);
        setAmount("");
        setNotes("");
        setShowAdvanceModal(true);
    };

    const handleSubmitAdvance = async () => {
        if (!selectedLabour || !amount) {
            Alert.alert("Error", "Please enter an amount");
            return;
        }

        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch(`${API_URL}/labours/${selectedLabour.id}/advance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Number(amount),
                    date: new Date().toISOString(), // Use current date/time
                    notes: notes,
                    created_by: currentUserId
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", `Added advance of ₹${amount} to ${selectedLabour.name}`);
                setShowAdvanceModal(false);
            } else {
                Alert.alert("Error", data.error || "Failed to add advance");
            }
        } catch (error) {
            console.error("Advance error:", error);
            Alert.alert("Error", "Unable to connect to server");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={local.container}>
            <View style={local.headerRow}>
                <Pressable onPress={() => router.back()} style={local.backBtn}>
                    <Text style={local.backText}>← Back</Text>
                </Pressable>
                <Text style={local.header}>Manage Advances</Text>
                <View style={{ width: 50 }} />
            </View>

            <FlatList
                data={labours}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <LabourCard
                        labour={item}
                        onAdvance={handleOpenAdvance}
                    />
                )}
                contentContainerStyle={local.listContent}
                ListEmptyComponent={
                    !loading ? (
                        <Text style={local.emptyText}>No active labours found.</Text>
                    ) : null
                }
            />

            {/* Advance Modal */}
            <Modal visible={showAdvanceModal} transparent animationType="slide">
                <View style={local.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={local.keyboardView}
                    >
                        <View style={local.modalContent}>
                            <View style={local.modalHeader}>
                                <Text style={local.modalTitle}>
                                    Add Advance for {selectedLabour?.name}
                                </Text>
                                <TouchableOpacity onPress={() => setShowAdvanceModal(false)}>
                                    <MaterialIcons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView>
                                <View style={local.inputGroup}>
                                    <Text style={local.label}>Amount (₹)</Text>
                                    <TextInput
                                        style={local.input}
                                        keyboardType="numeric"
                                        placeholder="Enter amount"
                                        value={amount}
                                        onChangeText={setAmount}
                                    />
                                </View>

                                <View style={local.inputGroup}>
                                    <Text style={local.label}>Notes (Optional)</Text>
                                    <TextInput
                                        style={[local.input, local.textArea]}
                                        placeholder="Enter notes"
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[local.submitBtn, submitting && local.disabledBtn]}
                                    onPress={handleSubmitAdvance}
                                    disabled={submitting}
                                >
                                    <Text style={local.submitBtnText}>
                                        {submitting ? "Saving..." : "Save Advance"}
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const local = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
        backgroundColor: "#f5f5f5",
    },
    headerRow: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    backBtn: { paddingVertical: 6, paddingHorizontal: 8 },
    backText: { color: "#0a84ff", fontWeight: "600", fontSize: 16 },
    header: { fontSize: 20, fontWeight: "700", color: "#333" },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        color: "#999",
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    keyboardView: {
        width: '100%',
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#333",
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    submitBtn: {
        backgroundColor: "#0a84ff",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
    },
    disabledBtn: {
        backgroundColor: "#ccc",
    },
    submitBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
