import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { API_URL } from "../../constants";
import { api } from "../../services/api";

// Helper for date formatting
const formatDate = (date: Date) => date.toISOString().split('T')[0];

interface Labour {
	id: number;
	name: string;
	role: string;
	site?: string;
	site_id?: number;
	rate?: number;
}

interface OvertimeRecord {
	id?: number;
	labour_id: number;
	hours: number;
	amount: number;
	notes?: string;
}

export default function OvertimeScreen() {
	const router = useRouter();
	const { siteId, siteName } = useLocalSearchParams();
	const [labours, setLabours] = useState<Labour[]>([]);
	const [overtimeData, setOvertimeData] = useState<Map<number, OvertimeRecord>>(new Map());
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [date, setDate] = useState(new Date());
	const [isAdmin, setIsAdmin] = useState(false);

	const isGlobalView = !siteId;

	useEffect(() => {
		checkRole();
		fetchLabours();
	}, [siteId]);

	useEffect(() => {
		fetchExistingOvertime();
	}, [date, siteId]);

	const checkRole = async () => {
		try {
			const userDataStr = await AsyncStorage.getItem("userData");
			if (userDataStr) {
				const userData = JSON.parse(userDataStr);
				setIsAdmin(userData.role === "admin");
			}
		} catch (error) {
			console.error("Error loading user role:", error);
		}
	};

	const fetchLabours = async () => {
		try {
			setLoading(true);
			let url = `${API_URL}/labours?status=active`;
			if (siteId) {
				// If backend supports filtering by site
				url = `${API_URL}/sites/${siteId}/labours`;
			}

			const response = await api.fetch(url);
			const data = await response.json();

			if (response.ok) {
				setLabours(data);
			} else {
				Alert.alert("Error", "Failed to fetch labours");
			}
		} catch (error) {
			console.error("Fetch labours error:", error);
			Alert.alert("Error", "Unable to connect to server");
		} finally {
			setLoading(false);
		}
	};

	const fetchExistingOvertime = async () => {
		try {
			const dateStr = formatDate(date);
			let url = `${API_URL}/overtime?date=${dateStr}`;
			if (siteId) {
				url += `&site_id=${siteId}`;
			}

			const response = await api.fetch(url);
			const data = await response.json();

			if (response.ok && Array.isArray(data)) {
				const newMap = new Map();
				data.forEach((record: any) => {
					newMap.set(record.labour_id, record);
				});
				setOvertimeData(newMap);
			}
		} catch (error) {
			console.error("Fetch overtime error:", error);
		}
	};

	const handleHoursChange = (labour: Labour, text: string) => {
		const hours = parseFloat(text);
		if (isNaN(hours) && text !== "") return;

		setOvertimeData(prev => {
			const newMap = new Map(prev);
			const current = newMap.get(labour.id) || { labour_id: labour.id, hours: 0, amount: 0 };

			if (text === "") {
				newMap.set(labour.id, {
					...current,
					hours: 0,
					amount: 0
				});
			} else {
				const rate = labour.rate || 0;
				newMap.set(labour.id, {
					...current,
					hours: hours,
					amount: hours * rate
				});
			}
			return newMap;
		});
	};

	const handleSubmit = async () => {
		if (overtimeData.size === 0) {
			Alert.alert("Info", "No overtime data to save");
			return;
		}

		try {
			setSubmitting(true);
			const userDataStr = await AsyncStorage.getItem("userData");
			if (!userDataStr) return;
			const userData = JSON.parse(userDataStr);

			const bulkData: any[] = [];

			// Prepare bulk data
			for (const [labourId, record] of overtimeData.entries()) {
				// Find labour to get site_id if global view
				const labour = labours.find(l => l.id === labourId);
				const recordSiteId = siteId || labour?.site_id;

				if (!recordSiteId) {
					console.warn(`Site ID missing for labour ${labourId}`);
					continue;
				}

				// Send all records, even if hours is 0 (to allow updates/clearing)
				bulkData.push({
					labour_id: labourId,
					site_id: recordSiteId,
					date: formatDate(date),
					hours: record.hours,
					amount: record.amount,
					notes: record.notes,
					created_by: userData.id
				});
			}

			if (bulkData.length === 0) {
				Alert.alert("Info", "No overtime data to save");
				return;
			}

			const response = await api.post("/overtime", bulkData);

			if (response.ok) {
				Alert.alert("Success", "Overtime saved successfully");
				fetchExistingOvertime(); // Refresh
			} else {
				const data = await response.json();
				Alert.alert("Error", data.error || "Failed to save");
			}
		} catch (error) {
			console.error("Save overtime error:", error);
			Alert.alert("Error", "Unable to connect to server");
		} finally {
			setSubmitting(false);
		}
	};

	const renderItem = ({ item }: { item: Labour }) => {
		const record = overtimeData.get(item.id);
		const hours = record ? record.hours.toString() : "0";
		const amount = record ? record.amount.toFixed(2) : "0.00";
		const rate = item.rate || 0;

		return (
			<View style={styles.card}>
				<View style={styles.cardHeader}>
					<View>
						<Text style={styles.labourName}>{item.name}</Text>
						<Text style={styles.labourRole}>{item.role}</Text>
						{isGlobalView && item.site && (
							<Text style={styles.siteInfo}>Site: {item.site}</Text>
						)}
						{isAdmin && (
							<Text style={styles.rateInfo}>Rate: ₹{rate}/hr</Text>
						)}
					</View>
				</View>

				<View style={styles.inputRow}>
					<View style={styles.inputContainer}>
						<Text style={styles.label}>Hours</Text>
						<TextInput
							style={styles.input}
							value={hours}
							onChangeText={(text) => handleHoursChange(item, text)}
							keyboardType="numeric"
							placeholder="0"
						/>
					</View>

					{isAdmin && (
						<View style={styles.inputContainer}>
							<Text style={styles.label}>Amount</Text>
							<TextInput
								style={[styles.input, styles.readOnlyInput]}
								value={amount}
								editable={false}
							/>
						</View>
					)}

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
				<Text style={styles.headerTitle}>Overtime</Text>
				<View style={{ width: 24 }} />
			</View>

			<View style={styles.subHeader}>
				{siteName ? (
					<Text style={styles.siteName}>{decodeURIComponent(siteName as string)}</Text>
				) : (
					<Text style={styles.siteName}>All Sites</Text>
				)}
				{/* Simple Date Display/Control */}
				<View style={styles.dateContainer}>
					<Text style={styles.dateLabel}>Date:</Text>
					<Text style={styles.dateText}>{formatDate(date)}</Text>
				</View>
			</View>

			<FlatList
				data={labours}
				renderItem={renderItem}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.listContent}
				ListEmptyComponent={
					!loading ? <Text style={styles.emptyText}>No labours found.</Text> : null
				}
			/>

			<View style={styles.footer}>
				<Pressable
					style={[styles.submitBtn, submitting && styles.disabledBtn]}
					onPress={handleSubmit}
					disabled={submitting}
				>
					<Text style={styles.submitBtnText}>
						{submitting ? "Submitting..." : "Submit Overtime"}
					</Text>
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
		backgroundColor: "#f0f0f0",
		padding: 8,
		borderRadius: 8,
	},
	dateLabel: {
		fontSize: 14,
		color: "#666",
		marginRight: 8,
	},
	dateText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#333",
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
		elevation: 1,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
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
	siteInfo: {
		fontSize: 12,
		color: "#0a84ff",
		marginTop: 2,
	},
	rateInfo: {
		fontSize: 12,
		color: "#4CAF50",
		marginTop: 2,
		fontWeight: "bold",
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 12,
	},
	inputContainer: {
		flex: 1,
	},
	label: {
		fontSize: 12,
		color: "#666",
		marginBottom: 4,
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		padding: 10,
		fontSize: 16,
		backgroundColor: "#fff",
	},
	readOnlyInput: {
		backgroundColor: "#f9f9f9",
		color: "#666",
	},

	emptyText: {
		textAlign: "center",
		marginTop: 40,
		color: "#999",
		fontSize: 16,
	},
	footer: {
		padding: 16,
		backgroundColor: "#fff",
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
	submitBtn: {
		backgroundColor: "#0a84ff",
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: "center",
		elevation: 2,
	},
	disabledBtn: {
		backgroundColor: "#a0cfff",
	},
	submitBtnText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
});
