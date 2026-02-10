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
	site?: string;
}

export default function AttendanceScreen() {
	const router = useRouter();
	const { siteId, siteName } = useLocalSearchParams();
	const [labours, setLabours] = useState<Labour[]>([]);
	const [attendance, setAttendance] = useState<Map<number, 'full' | 'half' | 'absent'>>(new Map());
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [date, setDate] = useState(new Date());
	const [locked, setLocked] = useState(false);
	const [filter, setFilter] = useState<'all' | 'full' | 'half' | 'absent'>('all');

	const isGlobalView = !siteId;

	useEffect(() => {
		fetchLabours();
		if (!isGlobalView) {
			fetchLockStatus();
		}
	}, [siteId]);

	useEffect(() => {
		if (!isGlobalView) {
			fetchLockStatus();
		}
		// If global view, we need to refetch attendance when date changes
		// For site view, fetchLabours calls fetchExistingAttendance initially, but date change should also trigger it
		fetchExistingAttendance();
	}, [date]);

	const fetchLabours = async () => {
		try {
			setLoading(true);
			let url = `${API_URL}/labours?status=active`;
			if (siteId) {
				// The backend /labours endpoint might not filter by siteId directly unless we update it or use /sites/:id/labours
				// Validating previous code: line 58 used /sites/${siteId}/labours
				url = `${API_URL}/sites/${siteId}/labours`;
			} else {
				// Global view: fetch all active labours
				// url is already set to /labours?status=active
			}

			const response = await fetch(url);
			const data = await response.json();

			if (response.ok) {
				setLabours(data);
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

	const fetchLockStatus = async () => {
		if (!siteId) return;
		try {
			const dateStr = date.toISOString().split('T')[0];
			const response = await fetch(`${API_URL}/attendance/lock-status?site_id=${siteId}&date=${dateStr}`);
			if (response.ok) {
				const data = await response.json();
				setLocked(data.is_locked);
			}
		} catch (error) {
			console.error("Fetch lock status error:", error);
		}
	};

	const fetchExistingAttendance = async (currentLabours?: Labour[]) => {
		try {
			const dateStr = date.toISOString().split('T')[0];
			let url = `${API_URL}/attendance?date=${dateStr}`;
			if (siteId) {
				url += `&site_id=${siteId}`;
			}

			const response = await fetch(url);
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
		if (isGlobalView) return; // Read-only in global view

		setAttendance(prev => {
			const newMap = new Map(prev);
			newMap.set(labourId, status);
			return newMap;
		});
	};

	const handleSubmit = async () => {
		if (isGlobalView) return;

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
					{
						text: "OK", onPress: () => {
							fetchLockStatus(); // Refresh lock status
							router.back();
						}
					}
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

	const getFilteredLabours = () => {
		if (filter === 'all') return labours;
		return labours.filter(l => {
			const status = attendance.get(l.id);
			if (filter === 'absent') return !status || status === 'absent'; // Treat undefined as absent for filter? Or strict? 
			// Let's say undefined is "Not Marked", but user asked for Red=Absent. 
			// Usually undefined means absent in these systems if not marked 'full' or 'half'.
			// But for strict filtering:
			return status === filter;
		});
	};

	const renderItem = ({ item }: { item: Labour }) => {
		const status = attendance.get(item.id);

		// Global view read-only opacity
		const itemLocked = locked || isGlobalView;

		return (
			<View style={styles.card}>
				<View style={styles.labourInfo}>
					<Text style={styles.labourName}>{item.name}</Text>
					<Text style={styles.labourRole}>{item.role}</Text>
					{isGlobalView && item.site && (
						<Text style={styles.siteInfo}>Site: {item.site}</Text>
					)}
				</View>

				<View style={styles.statusContainer}>
					<Pressable
						style={[styles.statusBtn, status === 'full' && styles.statusBtnActive, { backgroundColor: status === 'full' ? '#4CAF50' : '#f0f0f0', opacity: itemLocked ? 0.6 : 1 }]}
						onPress={() => !itemLocked && handleStatusChange(item.id, 'full')}
						disabled={itemLocked}
					>
						<Text style={[styles.statusText, status === 'full' && styles.statusTextActive]}>Full</Text>
					</Pressable>

					<Pressable
						style={[styles.statusBtn, status === 'half' && styles.statusBtnActive, { backgroundColor: status === 'half' ? '#FFC107' : '#f0f0f0', opacity: itemLocked ? 0.6 : 1 }]}
						onPress={() => !itemLocked && handleStatusChange(item.id, 'half')}
						disabled={itemLocked}
					>
						<Text style={[styles.statusText, status === 'half' && styles.statusTextActive]}>Half</Text>
					</Pressable>

					<Pressable
						style={[styles.statusBtn, status === 'absent' && styles.statusBtnActive, { backgroundColor: status === 'absent' ? '#F44336' : '#f0f0f0', opacity: itemLocked ? 0.6 : 1 }]}
						onPress={() => !itemLocked && handleStatusChange(item.id, 'absent')}
						disabled={itemLocked}
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
				<Text style={styles.headerTitle}>{isGlobalView ? "All Attendance" : "Mark Attendance"}</Text>
				<View style={{ width: 24 }} />
			</View>

			<View style={styles.subHeader}>
				{isGlobalView ? (
					<View style={styles.filterContainer}>
						<Text style={styles.filterLabel}>Filter:</Text>
						<Pressable onPress={() => setFilter(f => {
							if (f === 'all') return 'full';
							if (f === 'full') return 'half';
							if (f === 'half') return 'absent';
							return 'all';
						})} style={styles.filterBtn}>
							<Text style={styles.filterText}>{filter.toUpperCase()}</Text>
						</Pressable>
					</View>
				) : (
					<Text style={styles.siteName}>{decodeURIComponent(siteName as string)}</Text>
				)}
				<DatePicker date={date} onDateChange={setDate} />
			</View>

			<FlatList
				data={getFilteredLabours()}
				renderItem={renderItem}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.listContent}
				ListEmptyComponent={
					!loading ? (
						<Text style={styles.emptyText}>No labours found.</Text>
					) : null
				}
			/>

			{!isGlobalView && (
				<View style={styles.footer}>
					<Pressable
						style={[styles.submitBtn, (submitting || locked) && styles.submitBtnDisabled]}
						onPress={handleSubmit}
						disabled={submitting || locked}
					>
						<Text style={styles.submitBtnText}>
							{submitting ? "Submitting..." : locked ? "Attendance Locked" : "Submit Attendance"}
						</Text>
					</Pressable>
				</View>
			)}
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
	filterContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	filterLabel: {
		fontSize: 14,
		color: "#666",
	},
	filterBtn: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: "#e0e0e0",
		borderRadius: 16,
	},
	filterText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#333",
	},
	siteInfo: {
		fontSize: 12,
		color: "#0a84ff",
		marginTop: 2,
		fontWeight: "500",
	},
});
