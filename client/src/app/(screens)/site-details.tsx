import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../services/api";

interface Supervisor {
    id: number;
    name: string;
    phone: string;
    assigned_at?: string;
}

interface Labour {
    id: number;
    name: string;
    phone: string;
    trade: string;
}

interface SiteDetails {
    id: number;
    name: string;
    address: string;
    description: string;
    supervisors: Supervisor[];
    labours: Labour[];
}

export default function SiteDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [site, setSite] = useState<SiteDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editAddress, setEditAddress] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [availableSupervisors, setAvailableSupervisors] = useState<Supervisor[]>([]);

    const fetchSiteDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/sites/${id}`);
            const data = await response.json();

            if (response.ok) {
                setSite(data);
                setEditName(data.name);
                setEditAddress(data.address || "");
                setEditDescription(data.description || "");
            } else {
                Alert.alert("Error", data.error || "Failed to fetch site details");
            }
        } catch (error) {
            console.error("Fetch site details error:", error);
            Alert.alert("Error", "Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableSupervisors = async () => {
        try {
            const response = await api.get("/auth/supervisors");
            const data = await response.json();
            if (response.ok) {
                // Filter out already assigned supervisors
                const assignedIds = site?.supervisors.map(s => s.id) || [];
                const available = data.filter((s: Supervisor) => !assignedIds.includes(s.id));
                setAvailableSupervisors(available);
            }
        } catch (error) {
            console.error("Fetch supervisors error:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSiteDetails();
        }, [id])
    );

    const handleUpdate = async () => {
        try {
            const response = await api.put(`/sites/${id}`, {
                name: editName,
                address: editAddress,
                description: editDescription,
            });

            if (response.ok) {
                Alert.alert("Success", "Site updated successfully");
                setIsEditing(false);
                fetchSiteDetails();
            } else {
                const data = await response.json();
                Alert.alert("Error", data.error || "Failed to update site");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to connect to server");
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Site",
            "Are you sure you want to delete this site? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await api.delete(`/sites/${id}`);

                            if (response.ok) {
                                Alert.alert("Success", "Site deleted", [
                                    { text: "OK", onPress: () => router.back() },
                                ]);
                            } else {
                                const data = await response.json();
                                Alert.alert("Error", data.error || "Failed to delete site");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Failed to connect to server");
                        }
                    },
                },
            ]
        );
    };

    const handleAssignSupervisor = async (supervisorId: number) => {
        try {
            const response = await api.post(`/sites/${id}/assign`, { supervisor_id: supervisorId });

            if (response.ok) {
                Alert.alert("Success", "Supervisor assigned to site");
                setShowAssignModal(false);
                fetchSiteDetails();
            } else {
                const data = await response.json();
                Alert.alert("Error", data.error || "Failed to assign supervisor");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to connect to server");
        }
    };

    const handleUnassignSupervisor = (supervisorId: number, name: string) => {
        Alert.alert(
            "Remove Supervisor",
            `Remove ${name} from this site?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await api.delete(
                                `/sites/${id}/unassign/${supervisorId}`
                            );

                            if (response.ok) {
                                fetchSiteDetails();
                            } else {
                                const data = await response.json();
                                Alert.alert("Error", data.error || "Failed to remove supervisor");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Failed to connect to server");
                        }
                    },
                },
            ]
        );
    };

    const openAssignModal = () => {
        fetchAvailableSupervisors();
        setShowAssignModal(true);
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0a84ff" />
            </View>
        );
    }

    if (!site) {
        return (
            <View style={styles.container}>
                <Text>Site not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Site Details</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
                    <MaterialIcons name={isEditing ? "close" : "edit"} size={24} color="#0a84ff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={[{ key: "content" }]}
                renderItem={() => (
                    <View style={styles.content}>
                        {/* Site Info Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Site Information</Text>
                            {isEditing ? (
                                <View style={styles.editForm}>
                                    <Text style={styles.label}>Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editName}
                                        onChangeText={setEditName}
                                    />
                                    <Text style={styles.label}>Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editAddress}
                                        onChangeText={setEditAddress}
                                    />
                                    <Text style={styles.label}>Description</Text>
                                    <TextInput
                                        style={[styles.input, { height: 80 }]}
                                        value={editDescription}
                                        onChangeText={setEditDescription}
                                        multiline
                                    />
                                    <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                                        <Text style={styles.saveBtnText}>Save Changes</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.infoCard}>
                                    <Text style={styles.siteName}>{site.name}</Text>
                                    {site.address && <Text style={styles.siteAddress}>{site.address}</Text>}
                                    {site.description && <Text style={styles.siteDesc}>{site.description}</Text>}
                                </View>
                            )}
                        </View>

                        {/* Supervisors Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Assigned Supervisors</Text>
                                <TouchableOpacity onPress={openAssignModal} style={styles.addBtn}>
                                    <MaterialIcons name="add" size={20} color="#0a84ff" />
                                    <Text style={styles.addBtnText}>Assign</Text>
                                </TouchableOpacity>
                            </View>
                            {site.supervisors.length === 0 ? (
                                <Text style={styles.emptyText}>No supervisors assigned</Text>
                            ) : (
                                site.supervisors.map((sup) => (
                                    <View key={sup.id} style={styles.personCard}>
                                        <View style={styles.personIconWrap}>
                                            <MaterialIcons name="person" size={20} color="#0a84ff" />
                                        </View>
                                        <View style={styles.personInfo}>
                                            <Text style={styles.personName}>{sup.name}</Text>
                                            <Text style={styles.personPhone}>{sup.phone}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleUnassignSupervisor(sup.id, sup.name)}
                                            style={styles.removeBtn}
                                        >
                                            <MaterialIcons name="remove-circle" size={24} color="#ff3b30" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Labours Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Labours at this Site</Text>
                            {site.labours.length === 0 ? (
                                <Text style={styles.emptyText}>No labours assigned to this site</Text>
                            ) : (
                                site.labours.map((labour) => (
                                    <View key={labour.id} style={styles.personCard}>
                                        <View style={styles.personIconWrap}>
                                            <MaterialIcons name="engineering" size={20} color="#34c759" />
                                        </View>
                                        <View style={styles.personInfo}>
                                            <Text style={styles.personName}>{labour.name}</Text>
                                            <Text style={styles.personPhone}>{labour.phone || labour.trade}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Delete Button */}
                        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                            <MaterialIcons name="delete" size={20} color="#fff" />
                            <Text style={styles.deleteBtnText}>Delete Site</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Assign Supervisor Modal */}
            <Modal visible={showAssignModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Assign Supervisor</Text>
                            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                                <MaterialIcons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {availableSupervisors.length === 0 ? (
                            <Text style={styles.emptyText}>No available supervisors to assign</Text>
                        ) : (
                            <FlatList
                                data={availableSupervisors}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.supervisorOption}
                                        onPress={() => handleAssignSupervisor(item.id)}
                                    >
                                        <View style={styles.personIconWrap}>
                                            <MaterialIcons name="person" size={20} color="#0a84ff" />
                                        </View>
                                        <View style={styles.personInfo}>
                                            <Text style={styles.personName}>{item.name}</Text>
                                            <Text style={styles.personPhone}>{item.phone}</Text>
                                        </View>
                                        <MaterialIcons name="add-circle" size={24} color="#34c759" />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    editButton: {
        padding: 8,
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
    },
    siteName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
        marginBottom: 8,
    },
    siteAddress: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    siteDesc: {
        fontSize: 14,
        color: "#888",
        marginTop: 8,
    },
    editForm: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#e6e6e6",
        padding: 12,
        borderRadius: 8,
        backgroundColor: "#fafafa",
        fontSize: 16,
    },
    saveBtn: {
        backgroundColor: "#0a84ff",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 16,
    },
    saveBtnText: {
        color: "#fff",
        fontWeight: "700",
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    addBtnText: {
        color: "#0a84ff",
        fontWeight: "600",
    },
    emptyText: {
        color: "#999",
        fontSize: 14,
        textAlign: "center",
        padding: 16,
    },
    personCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    personIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#e8f4ff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    personInfo: {
        flex: 1,
    },
    personName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    personPhone: {
        fontSize: 12,
        color: "#666",
    },
    removeBtn: {
        padding: 4,
    },
    deleteBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ff3b30",
        padding: 14,
        borderRadius: 8,
        gap: 8,
        marginTop: 16,
    },
    deleteBtnText: {
        color: "#fff",
        fontWeight: "700",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "70%",
        padding: 16,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    supervisorOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
});
