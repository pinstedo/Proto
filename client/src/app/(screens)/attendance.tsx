import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Calendar } from "../../components/Calendar";
import { CustomModal, ModalType } from "../../components/CustomModal";
import { API_URL } from "../../constants";
import { api } from "../../services/api";

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
	const [foodProvided, setFoodProvided] = useState(false);
	const [filter, setFilter] = useState<'all' | 'full' | 'half' | 'absent'>('all');

	// State for calendar summary
	const [markedDates, setMarkedDates] = useState<string[]>([]);
	const [showCalendar, setShowCalendar] = useState(false);
	const [modalConfig, setModalConfig] = useState<{
		visible: boolean;
		title?: string;
		message?: string;
		type?: ModalType;
		actions?: any[];
	}>({ visible: false });

	const showModal = (title: string, message: string, type: ModalType = 'default', actions?: any[]) => {
		setModalConfig({
			visible: true,
			title,
			message,
			type,
			actions: actions || [{ text: 'OK', onPress: () => setModalConfig(prev => ({ ...prev, visible: false })), style: 'default' }]
		});
	};

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
				url = `${API_URL}/sites/${siteId}/labours`;
			}

			const response = await api.fetch(url);
			const data = await response.json();

			if (response.ok) {
				setLabours(data);
				// fetchExistingAttendance(data); // Removed argument as it's not used in implementation, and useEffect calls it anyway
			} else {
				showModal("Error", "Failed to fetch labours", 'error');
			}
		} catch (error) {
			console.error("Fetch labours error:", error);
			showModal("Error", error instanceof Error ? error.message : "Unable to connect to server", 'error');
		} finally {
			setLoading(false);
		}
	};

	const fetchLockStatus = async () => {
		if (!siteId) return;
		try {
			// Using local time date string for consistency with Calendar component
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const dateStr = `${year}-${month}-${day}`;

			const response = await api.get(`/attendance/lock-status?site_id=${siteId}&date=${dateStr}`);
			if (response.ok) {
				const data = await response.json();
				setLocked(data.is_locked);
				setFoodProvided(data.food_provided);
			}
		} catch (error) {
			console.error("Fetch lock status error:", error);
		}
	};

	const fetchAttendanceSummary = async (month: number, year: number) => {
		if (!siteId) return;
		try {
			const response = await api.get(`/attendance/summary?site_id=${siteId}&month=${month}&year=${year}`);
			if (response.ok) {
				const data = await response.json();
				setMarkedDates(data.dates || []);
			}
		} catch (error) {
			console.error("Fetch summary error:", error);
		}
	};

	const fetchExistingAttendance = async () => {
		try {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const dateStr = `${year}-${month}-${day}`;

			let url = `${API_URL}/attendance?date=${dateStr}`;
			if (siteId) {
				url += `&site_id=${siteId}`;
			}

			const response = await api.fetch(url);
			const data = await response.json();

			if (response.ok && Array.isArray(data)) {
				const newAttendance = new Map();
				data.forEach((record: any) => {
					newAttendance.set(record.labour_id, record.status);
				});
				setAttendance(newAttendance);
			} else {
				// If fetching fails or empty (new day), clear attendance map
				setAttendance(new Map());
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
			showModal("Warning", "No attendance marked.", 'warning');
			return;
		}

		try {
			setSubmitting(true);
			const userDataStr = await AsyncStorage.getItem("userData");
			if (!userDataStr) {
				showModal("Error", "User session not found.", 'error');
				return;
			}
			const userData = JSON.parse(userDataStr);

			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const dateStr = `${year}-${month}-${day}`;

			const records = Array.from(attendance.entries()).map(([labourId, status]) => ({
				labour_id: labourId,
				site_id: siteId,
				supervisor_id: userData.id,
				date: dateStr,
				status
			}));

			const response = await api.post("/attendance", { records, food_provided: foodProvided });

			if (response.ok) {
				showModal("Success", "Attendance marked successfully", 'success', [
					{
						text: "OK", onPress: () => {
							setModalConfig(prev => ({ ...prev, visible: false }));
							fetchLockStatus(); // Refresh lock status
							// Refresh calendar to show green
							fetchAttendanceSummary(date.getMonth() + 1, date.getFullYear());
						},
						style: 'default'
					}
				]);
			} else {
				const data = await response.json();
				showModal("Error", data.error || "Failed to submit attendance", 'error');
			}
		} catch (error) {
			console.error("Submit attendance error:", error);
			showModal("Error", error instanceof Error ? error.message : "Unable to connect to server", 'error');
		} finally {
			setSubmitting(false);
		}
	};

	const getFilteredLabours = () => {
		if (filter === 'all') return labours;
		return labours.filter(l => {
			const status = attendance.get(l.id);
			if (filter === 'absent') return !status || status === 'absent';
			return status === filter;
		});
	};

	const renderItem = ({ item }: { item: Labour }) => {
		const status = attendance.get(item.id);
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

	const onDateSelect = (selectedDate: Date) => {
		setDate(selectedDate);
		setShowCalendar(false);
	};

	// Header component for FlatList to avoid nesting ScrollViews
	const ListHeader = () => (
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
				<View>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
						<Text style={styles.siteName}>{decodeURIComponent(siteName as string)}</Text>

						<Pressable
							style={styles.dateSelector}
							onPress={() => setShowCalendar(true)}
						>
							<MaterialIcons name="calendar-today" size={20} color="#0a84ff" />
							<Text style={styles.dateSelectorText}>{date.toLocaleDateString()}</Text>
						</Pressable>
					</View>

					<View style={styles.foodToggleContainer}>
						<Text style={styles.foodToggleText}>Food Provided by Supervisor</Text>
						<Switch
							value={foodProvided}
							onValueChange={(val) => { if (!locked) setFoodProvided(val); }}
							disabled={locked}
							trackColor={{ false: "#767577", true: "#81b0ff" }}
							thumbColor={foodProvided ? "#0a84ff" : "#f4f3f4"}
						/>
					</View>
				</View>
			)}
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backBtn}>
					<MaterialIcons name="arrow-back" size={24} color="#333" />
				</Pressable>
				<Text style={styles.headerTitle}>{isGlobalView ? "All Attendance" : "Mark Attendance"}</Text>
				<View style={{ width: 24 }} />
			</View>

			<FlatList
				data={getFilteredLabours()}
				renderItem={renderItem}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.listContent}
				ListHeaderComponent={ListHeader}
				ListEmptyComponent={
					!loading ? (
						<Text style={styles.emptyText}>No labours found.</Text>
					) : null
				}
			/>

			<CustomModal
				visible={showCalendar}
				onClose={() => setShowCalendar(false)}
				title="Select Date"
				// type="date"
				actions={[
					{ text: "Cancel", onPress: () => setShowCalendar(false), style: "cancel" }
				]}
			>
				<Calendar
					selectedDate={date}
					onDateSelect={onDateSelect}
					markedDates={markedDates}
					onMonthChange={fetchAttendanceSummary}
				/>
			</CustomModal>

			<CustomModal
				visible={modalConfig.visible}
				onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
				title={modalConfig.title}
				message={modalConfig.message}
				type={modalConfig.type}
				actions={modalConfig.actions}
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
	},
	siteName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#0a84ff",
		marginBottom: 8,
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
	// New Styles
	dateSelector: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#e8f4ff',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		gap: 8,
	},
	dateSelectorText: {
		fontSize: 14,
		color: '#0a84ff',
		fontWeight: '600',
	},
	foodToggleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#eee',
	},
	foodToggleText: {
		fontSize: 14,
		color: '#333',
		flex: 1,
		marginRight: 8,
	}
});
