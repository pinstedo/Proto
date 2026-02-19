import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { API_URL } from "../../constants";
import { EditProfileModal } from "../components/EditProfileModal";
import { styles } from "../style/stylesheet";

const LabourDashboard = () => {
    const router = useRouter();
    const [labour, setLabour] = useState<any>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

    const fetchData = async () => {
        try {
            setError(null);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                router.replace("/auth/labour-login" as any);
                return;
            }

            // Fetch Labour Details
            const labourRes = await fetch(`${API_URL}/labours/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const labourData = await labourRes.json();

            if (labourRes.ok) {
                setLabour(labourData);
            } else {
                if (labourRes.status === 401 || labourRes.status === 403) {
                    await handleLogout();
                    return;
                }
                const errorMessage = labourData.error || "Failed to fetch labour details";
                console.log("Fetch error:", errorMessage);
                setError(errorMessage);
                return;
            }

            // Fetch Attendance
            const attRes = await fetch(`${API_URL}/attendance/my-attendance`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const attData = await attRes.json();

            if (attRes.ok) {
                setAttendance(attData);
                if (attData.length > 0) {
                    setSelectedAttendance(attData[0]);
                }
            } else {
                console.error("Failed to fetch attendance:", attData.error);
                // Non-critical error, don't block dashboard
            }

        } catch (error: any) {
            console.error("Error fetching data:", error);
            setError(error.message || "Network error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace("/auth/authentication");
    };

    const handleUpdateProfile = async (updatedData: any) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(`${API_URL}/labours/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                const updatedLabour = await response.json();
                setLabour(updatedLabour);
                setShowEditProfile(false);
            } else {
                const errorData = await response.json();
                alert(`Update failed: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update profile");
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                <Text style={{ fontSize: 18, color: 'red', marginBottom: 10, textAlign: 'center' }}>
                    {error}
                </Text>
                <TouchableOpacity
                    onPress={fetchData}
                    style={{
                        backgroundColor: '#007bff',
                        padding: 10,
                        borderRadius: 5,
                        marginBottom: 10,
                        width: '100%',
                        alignItems: 'center'
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                        backgroundColor: '#6c757d',
                        padding: 10,
                        borderRadius: 5,
                        width: '100%',
                        alignItems: 'center'
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Logout</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'full': return 'green';
            case 'half': return 'orange';
            case 'absent': return 'red';
            default: return 'gray';
        }
    };

    const renderDateCircle = (item: any, index: number) => {
        // Extract day from date string (assuming YYYY-MM-DD or similar)
        const day = new Date(item.date).getDate();
        const isSelected = selectedAttendance && selectedAttendance.date === item.date;

        return (
            <TouchableOpacity
                key={index}
                onPress={() => setSelectedAttendance(item)}
                style={{
                    width: '18%', // Approx 5 items per row with margins
                    aspectRatio: 1,
                    borderRadius: 50,
                    backgroundColor: isSelected ? getStatusColor(item.status) : 'white',
                    borderWidth: 2,
                    borderColor: getStatusColor(item.status),
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '1%',
                }}
            >
                <Text style={{
                    color: isSelected ? 'white' : 'black',
                    fontWeight: 'bold'
                }}>
                    {day}
                </Text>
            </TouchableOpacity>
        );
    };

    const calculateAge = (dobString: string) => {
        if (!dobString) return '-';
        const dob = new Date(dobString);
        const diffMs = Date.now() - dob.getTime();
        const ageDate = new Date(diffMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Dashboard</Text>
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
            >
                {/* Personal Details Card */}
                {labour && (
                    <View style={[styles.card, { marginBottom: 20 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.cardTitle}>Personal Details</Text>
                            <TouchableOpacity onPress={() => setShowEditProfile(true)}>
                                <MaterialIcons name="edit" size={24} color="#007bff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.divider} />

                        <View style={{ alignItems: 'center', marginBottom: 15 }}>
                            {labour.profile_image ? (
                                <Image source={{ uri: labour.profile_image }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                            ) : (
                                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
                                    <MaterialIcons name="person" size={50} color="#ccc" />
                                </View>
                            )}
                        </View>

                        <DetailRow label="Name" value={labour.name} />
                        <DetailRow label="Phone" value={labour.phone} />
                        <DetailRow label="Age" value={labour.date_of_birth ? `${calculateAge(labour.date_of_birth)} yrs` : '-'} />
                        <DetailRow label="Emergency Contact" value={labour.emergency_phone} />
                        <DetailRow label="Trade" value={labour.trade} />
                        <DetailRow label="Rate" value={`₹${labour.rate}/day`} />
                        <DetailRow label="Status" value={labour.status} />
                    </View>
                )}

                {/* Attendance Section */}
                <Text style={[styles.head, { fontSize: 20, marginBottom: 10 }]}>
                    Attendance History
                </Text>

                {attendance.length === 0 ? (
                    <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
                        No attendance records found.
                    </Text>
                ) : (
                    <View>
                        {/* Date Circles Rows */}
                        <View style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-start',
                            marginBottom: 20
                        }}>
                            {attendance.map((item, index) => renderDateCircle(item, index))}
                        </View>

                        {/* Detailed View */}
                        {selectedAttendance && (
                            <View style={[styles.card, { padding: 15, backgroundColor: "#fff" }]}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                                    {selectedAttendance.date} Details
                                </Text>
                                <View style={styles.divider} />
                                <DetailRow label="Date" value={selectedAttendance.date} />
                                <DetailRow label="Status" value={selectedAttendance.status.toUpperCase()} />
                                <DetailRow label="Site" value={selectedAttendance.site_name || "Unknown Site"} />
                                <DetailRow label="Supervisor" value={selectedAttendance.supervisor_name || "N/A"} />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Logout Button at Bottom */}
            <View style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
                <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                        backgroundColor: '#FF3B30',
                        padding: 15,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Logout</Text>
                </TouchableOpacity>
            </View>

            <EditProfileModal
                visible={showEditProfile}
                onClose={() => setShowEditProfile(false)}
                labour={labour}
                onSave={handleUpdateProfile}
            />
        </View>
    );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View
        style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8,
        }}
    >
        <Text style={{ color: "#666", fontWeight: "600" }}>{label}</Text>
        <Text style={{ fontWeight: "bold" }}>{value || "-"}</Text>
    </View>
);

export default LabourDashboard;
