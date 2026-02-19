
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

interface Labour {
    id: number;
    name: string;
    phone: string;
    aadhaar: string;
    trade: string;
    rate: number;
    site: string;
    site_id: number;
    status: 'active' | 'terminated' | 'blacklisted';
    profile_image?: string;
    date_of_birth?: string;
    emergency_phone?: string;
    notes?: string;
}

export default function LabourDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [labour, setLabour] = useState<Labour | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Labour>>({});

    useEffect(() => {
        fetchLabourDetails();
    }, [id]);

    const fetchLabourDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/labours/${id}`);
            if (response.ok) {
                const data = await response.json();
                setLabour(data);
                setFormData(data);
            } else {
                Alert.alert("Error", "Failed to fetch labour details");
                router.back();
            }
        } catch (error) {
            console.error("Error fetching labour:", error);
            Alert.alert("Error", "Unable to connect to server");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name?.trim() || !formData.phone?.trim()) {
            Alert.alert("Error", "Name and Phone are required");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                rate: Number(formData.rate), // Ensure numeric
            };

            const response = await api.put(`/labours/${id}`, payload);
            const data = await response.json();

            if (response.ok) {
                setLabour(data as Labour);
                setIsEditing(false);
                Alert.alert("Success", "Labour details updated successfully");
            } else {
                Alert.alert("Error", data.error || "Failed to update labour");
            }
        } catch (error) {
            console.error("Error updating labour:", error);
            Alert.alert("Error", "Unable to connect to server");
        } finally {
            setSaving(false);
        }
    };

    const calculateAge = (dobString?: string) => {
        if (!dobString) return null;
        const dob = new Date(dobString);
        const diffMs = Date.now() - dob.getTime();
        const ageDate = new Date(diffMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0a84ff" />
            </View>
        );
    }

    if (!labour) return null;

    const DetailItem = ({ label, value, icon, isEditable = false, field, keyboardType = 'default' }: any) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputContainer, !isEditing && styles.readOnlyContainer]}>
                <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} />
                {isEditing && isEditable ? (
                    <TextInput
                        style={styles.input}
                        value={String(field ? (formData as any)[field] || "" : value)}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, [field]: text }))}
                        editable={true}
                        keyboardType={keyboardType}
                    />
                ) : (
                    <Text style={styles.inputText}>{value || "-"}</Text>
                )}
            </View>
        </View>
    );

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
                    <Text style={styles.title}>Labour Details</Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (isEditing) {
                                // If cancelling edit, reset form data
                                setFormData(labour);
                                setIsEditing(false);
                            } else {
                                setIsEditing(true);
                            }
                        }}
                        style={styles.editButton}
                    >
                        <Text style={styles.editButtonText}>{isEditing ? "Cancel" : "Edit"}</Text>
                    </TouchableOpacity>
                </View>

                {/* Profile Header Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {/* Placeholder for avatar, or use image if available */}
                        <Ionicons name="person" size={40} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.profileName}>{labour.name}</Text>
                        <Text style={styles.profileId}>ID: {labour.id}</Text>
                        <View style={[styles.statusBadge,
                        { backgroundColor: labour.status === 'active' ? '#2e7d32' : labour.status === 'terminated' ? '#e53935' : '#424242' }
                        ]}>
                            <Text style={styles.statusText}>{labour.status.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <DetailItem
                        label="Full Name"
                        value={labour.name}
                        field="name"
                        icon="person-outline"
                        isEditable={true}
                    />

                    <DetailItem
                        label="Phone Number"
                        value={labour.phone}
                        field="phone"
                        icon="call-outline"
                        isEditable={true}
                        keyboardType="phone-pad"
                    />

                    <DetailItem
                        label="Date of Birth (YYYY-MM-DD)"
                        value={labour.date_of_birth}
                        field="date_of_birth"
                        icon="calendar-outline"
                        isEditable={true}
                    />

                    {labour.date_of_birth && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Age</Text>
                            <View style={[styles.inputContainer, styles.readOnlyContainer]}>
                                <Ionicons name="hourglass-outline" size={20} color="#666" style={styles.inputIcon} />
                                <Text style={styles.inputText}>{calculateAge(labour.date_of_birth)} yrs</Text>
                            </View>
                        </View>
                    )}

                    <DetailItem
                        label="Aadhaar Number"
                        value={labour.aadhaar}
                        field="aadhaar"
                        icon="card-outline"
                        isEditable={true}
                        keyboardType="numeric"
                    />

                    <DetailItem
                        label="Emergency Contact"
                        value={labour.emergency_phone}
                        field="emergency_phone"
                        icon="medical-outline"
                        isEditable={true}
                        keyboardType="phone-pad"
                    />

                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Work Details</Text>

                    <DetailItem
                        label="Trade / Role"
                        value={labour.trade}
                        field="trade"
                        icon="briefcase-outline"
                        isEditable={true}
                    />

                    <DetailItem
                        label="Daily Rate (₹)"
                        value={String(labour.rate || 0)}
                        field="rate"
                        icon="cash-outline"
                        isEditable={true}
                        keyboardType="numeric"
                    />

                    <DetailItem
                        label="Current Site"
                        value={labour.site}
                        field="site" // Note: Editing site name directly might disconnect from site_id if not careful, but for now simple text edit. Ideally dropdown.
                        icon="location-outline"
                        isEditable={true}
                    />

                    <DetailItem
                        label="Status"
                        value={labour.status}
                        // Status editing might be better via buttons, but let's allow text for flexibility if admin needs to fix data manually, 
                        // or better: force readonly and use the buttons on the main list? 
                        // The user asked for "editable form", so let's allow it but maybe read-only for now to avoid invalid states.
                        // Actually, let's keep it read-only for now as status has specific logic (terminated/blacklisted).
                        icon="flag-outline"
                        isEditable={false}
                    />

                    <View style={styles.divider} />
                    <DetailItem
                        label="Notes"
                        value={labour.notes}
                        field="notes"
                        icon="document-text-outline"
                        isEditable={true}
                    />

                    {isEditing && (
                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <Text style={styles.saveButtonText}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Text>
                        </TouchableOpacity>
                    )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        marginTop: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    editButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#e3f2fd",
    },
    editButtonText: {
        color: "#0a84ff",
        fontWeight: "600",
        fontSize: 14,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2d3436",
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#bdbdbd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    profileId: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#636e72",
        marginBottom: 20,
        marginTop: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#636e72",
        marginBottom: 6,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e1e1e1",
        paddingHorizontal: 15,
        height: 50,
    },
    readOnlyContainer: {
        backgroundColor: "#f8f9fa",
        borderColor: "#f0f0f0",
        borderWidth: 0,
    },
    inputIcon: {
        marginRight: 10,
        width: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#2d3436",
        height: "100%",
    },
    inputText: {
        flex: 1,
        fontSize: 16,
        color: "#2d3436",
    },
    divider: {
        height: 1,
        backgroundColor: "#f0f0f0",
        marginVertical: 20,
    },
    saveButton: {
        backgroundColor: "#0a84ff",
        borderRadius: 12,
        height: 55,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
        shadowColor: "#0a84ff",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: "#a0cfff",
        shadowOpacity: 0,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
});
