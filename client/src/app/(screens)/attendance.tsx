import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { API_URL } from "../../constants";

// Simple custom date picker since we want to avoid extra dependencies if possible
// or use a standard text input for date
const DatePicker = ({ date, onDateChange }: { date: Date, onDateChange: (date: Date) => void }) => {
	const formatDate = (date: Date) => {
		return date.toISOString().split('T')[0];
	};

	// For simplicity in this proto, we'll just show today's date
	// A real app would use a proper date picker library
	return (
		<View style={styles.dateContainer}>
			<Text style={styles.dateLabel}>Date:</Text>
			<View style={styles.dateDisplay}>
				<Text style={styles.dateText}>{formatDate(date)}</Text>
			</View>
		</View>
	);
};

interface Labour {
	id: number;
	name: string;
	role: string;
}

export default function AttendanceScreen() {
	const router = useRouter();
	const { siteId, siteName } = useLocalSearchParams();
	const [labours, setLabours] = useState<Labour[]>([]);
	const [attendance, setAttendance] = useState<Map<number, 'full' | 'half' | 'absent'>>(new Map());
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [date, setDate] = useState(new Date());

	useEffect(() => {
		fetchLabours();
	}, [siteId]);

	const fetchLabours = async () => {
		if (!siteId) return;

		try {
			setLoading(true);
			const response = await fetch(`${API_URL}/sites/${siteId}/labours`);
			const data = await response.json();

			if (response.ok) {
				setLabours(data);
				// Initialize all as absent or fetch existing attendance
				// For now, default to empty (user must select)
				fetchExistingAttendance(data);
			} else {
				Alert.alert("Error", "Failed to fetch labours");
			}
		} catch (error) {
			console.error("Fetch labours error:", error);
			Alert.alert("Error", error instanceof Error ? error.message : "Unable to connect to server");
		} finally {
			setLoading(false);
		}
	};

	const fetchExistingAttendance = async (currentLabours: Labour[]) => {
		try {
			const dateStr = date.toISOString().split('T')[0];
			const response = await fetch(`${API_URL}/attendance?site_id=${siteId}&date=${dateStr}`);
			const data = await response.json();

			if (response.ok && Array.isArray(data)) {
				const newAttendance = new Map();
				data.forEach((record: any) => {
					newAttendance.set(record.labour_id, record.status);
				});
				setAttendance(newAttendance);
			}
		} catch (error) {
			console.error("Fetch existing attendance error", error);
		}
	}

	const handleStatusChange = (labourId: number, status: 'full' | 'half' | 'absent') => {
		setAttendance(prev => {
			const newMap = new Map(prev);
			newMap.set(labourId, status);
			return newMap;
		});
	};

	const handleSubmit = async () => {
		if (attendance.size === 0) {
			Alert.alert("Warning", "No attendance marked.");
			return;
		}

		try {
			setSubmitting(true);
			const userDataStr = await AsyncStorage.getItem("userData");
			if (!userDataStr) {
				Alert.alert("Error", "User session not found.");
				return;
			}
			const userData = JSON.parse(userDataStr);

			const records = Array.from(attendance.entries()).map(([labourId, status]) => ({
				labour_id: labourId,
				site_id: siteId,
				supervisor_id: userData.id,
				date: date.toISOString().split('T')[0],
				status
			}));

			const response = await fetch(`${API_URL}/attendance`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ records }),
			});

			if (response.ok) {
				Alert.alert("Success", "Attendance marked successfully", [
					{ text: "OK", onPress: () => router.back() }
				]);
			} else {
				const data = await response.json();
				Alert.alert("Error", data.error || "Failed to submit attendance");
			}
		} catch (error) {
			console.error("Submit attendance error:", error);
			Alert.alert("Error", error instanceof Error ? error.message : "Unable to connect to server");
		} finally {
			setSubmitting(false);
		}
	};

	const renderItem = ({ item }: { item: Labour }) => {
		const status = attendance.get(item.id);

		return (
			<View style={styles.card}>
				<View style={styles.labourInfo}>
					<Text style={styles.labourName}>{item.name}</Text>
					<Text style={styles.labourRole}>{item.role}</Text>
				</View>

				<View style={styles.statusContainer}>
					<Pressable
						style={[styles.statusBtn, status === 'full' && styles.statusBtnActive, { backgroundColor: status === 'full' ? '#4CAF50' : '#f0f0f0' }]}
						onPress={() => handleStatusChange(item.id, 'full')}
					>
						<Text style={[styles.statusText, status === 'full' && styles.statusTextActive]}>Full</Text>
					</Pressable>

					<Pressable
						style={[styles.statusBtn, status === 'half' && styles.statusBtnActive, { backgroundColor: status === 'half' ? '#FFC107' : '#f0f0f0' }]}
						onPress={() => handleStatusChange(item.id, 'half')}
					>
						<Text style={[styles.statusText, status === 'half' && styles.statusTextActive]}>Half</Text>
					</Pressable>

					<Pressable
						style={[styles.statusBtn, status === 'absent' && styles.statusBtnActive, { backgroundColor: status === 'absent' ? '#F44336' : '#f0f0f0' }]}
						onPress={() => handleStatusChange(item.id, 'absent')}
					>
						<Text style={[styles.statusText, status === 'absent' && styles.statusTextActive]}>Absent</Text>
					</Pressable>
				</View>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backBtn}>
					<MaterialIcons name="arrow-back" size={24} color="#333" />
				</Pressable>
				<Text style={styles.headerTitle}>Mark Attendance</Text>
				<View style={{ width: 24 }} />
			</View>

			<View style={styles.subHeader}>
				<Text style={styles.siteName}>{decodeURIComponent(siteName as string)}</Text>
				<DatePicker date={date} onDateChange={setDate} />
			</View>

			<FlatList
				data={labours}
				renderItem={renderItem}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.listContent}
				ListEmptyComponent={
					!loading ? (
						<Text style={styles.emptyText}>No labours found for this site.</Text>
					) : null
				}
			/>

			<View style={styles.footer}>
				<Pressable
					style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
					onPress={handleSubmit}
					disabled={submitting}
				>
					<Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit Attendance"}</Text>
				</Pressable>
			</View>
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
	subHeader: {
		padding: 16,
		backgroundColor: "#fff",
		marginTop: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	siteName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#0a84ff",
	},
	dateContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	dateLabel: {
		fontSize: 14,
		color: "#666",
		marginRight: 8,
	},
	dateDisplay: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: "#f0f0f0",
		borderRadius: 6,
	},
	dateText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#333",
	},
	listContent: {
		padding: 16,
		paddingBottom: 100,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		elevation: 1,
	},
	labourInfo: {
		marginBottom: 12,
	},
	labourName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
	},
	labourRole: {
		fontSize: 14,
		color: "#666",
		marginTop: 2,
	},
	statusContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 8,
	},
	statusBtn: {
		flex: 1,
		paddingVertical: 8,
		alignItems: "center",
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "transparent",
	},
	statusBtnActive: {
		borderColor: "rgba(0,0,0,0.1)",
	},
	statusText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#666",
	},
	statusTextActive: {
		color: "#fff",
		fontWeight: "bold",
	},
	footer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		padding: 16,
		elevation: 4,
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
	submitBtn: {
		backgroundColor: "#0a84ff",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	submitBtnDisabled: {
		backgroundColor: "#a0cfff",
	},
	submitBtnText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	emptyText: {
		textAlign: "center",
		marginTop: 40,
		color: "#999",
		fontSize: 16,
	},
});
