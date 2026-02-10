import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
	Alert,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";
import { API_URL } from "../../constants";
import { LabourCard } from "../components/LabourCard";

interface Site {
	id: number;
	name: string;
}

interface Labour {
	id: number;
	name: string;
	phone: string;
	trade: string;
	rate?: number;
	site: string;
	site_id?: number;
	status?: 'active' | 'terminated' | 'blacklisted';
	created_at?: string;
}

export default function Labours() {
	const router = useRouter();
	const { newLabour, supervisorId } = useLocalSearchParams();
	const [viewType, setViewType] = useState<'active' | 'inactive'>('active');
	const [labours, setLabours] = useState<Labour[]>([]);
	const [loading, setLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);

	// Assignment Modal State
	const [showSitePicker, setShowSitePicker] = useState(false);
	const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);
	const [sites, setSites] = useState<Site[]>([]);
	const [assigning, setAssigning] = useState(false);
	useFocusEffect(
		useCallback(() => {
			checkRoleAndFetch();
		}, [supervisorId, viewType]) // Add viewType dependency
	);

	const checkRoleAndFetch = async () => {
		try {
			const userDataStr = await AsyncStorage.getItem("userData");
			if (userDataStr) {
				const userData = JSON.parse(userDataStr);
				setIsAdmin(userData.role === "admin");
				fetchLabours(userData.role === "supervisor" ? userData.id : supervisorId);
				if (userData.role === "admin") {
					fetchSites();
				}
			}
		} catch (error) {
			console.error("Error loading user role:", error);
		}
	};

	const fetchLabours = async (supId?: string | string[]) => {
		try {
			setLoading(true);
			let url = `${API_URL}/labours?status=${viewType}`; // Add status param
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

	const fetchSites = async () => {
		try {
			const response = await fetch(`${API_URL}/sites`);
			const data = await response.json();
			if (response.ok) {
				setSites(data);
			}
		} catch (error) {
			console.error("Failed to fetch sites", error);
		}
	};

	const handleMove = (labour: Labour) => {
		setSelectedLabour(labour);
		setShowSitePicker(true);
	};

	const handleAssignSite = async (site: Site) => {
		if (!selectedLabour) return;

		try {
			setAssigning(true);
			const response = await fetch(`${API_URL}/labours/${selectedLabour.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...selectedLabour,
					site: site.name,
					site_id: site.id,
				}),
			});

			if (response.ok) {
				Alert.alert("Success", `Moved ${selectedLabour.name} to ${site.name}`);
				setShowSitePicker(false);
				fetchLabours(supervisorId); // Refresh list
			} else {
				const data = await response.json();
				Alert.alert("Error", data.error || "Failed to move labour");
			}
		} catch (error) {
			console.error("Move labour error:", error);
			Alert.alert("Error", "Unable to connect to server");
		} finally {
			setAssigning(false);
		}
	};

	const handleStatusChange = async (labour: Labour, newStatus: string) => {
		try {
			const response = await fetch(`${API_URL}/labours/${labour.id}/status`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (response.ok) {
				Alert.alert("Success", `Labour marked as ${newStatus}`);
				fetchLabours(supervisorId); // Refresh list
			} else {
				const data = await response.json();
				Alert.alert("Error", data.error || "Failed to update status");
			}
		} catch (error) {
			console.error("Status update error:", error);
			Alert.alert("Error", "Unable to connect to server");
		}
	};

	const handleTerminate = (labour: Labour) => {
		Alert.alert(
			"Confirm Terminate",
			`Are you sure you want to terminate ${labour.name}?`,
			[
				{ text: "Cancel", style: "cancel" },
				{ text: "Terminate", style: "destructive", onPress: () => handleStatusChange(labour, 'terminated') }
			]
		);
	};

	const handleBlacklist = (labour: Labour) => {
		Alert.alert(
			"Confirm Blacklist",
			`Are you sure you want to blacklist ${labour.name}?`,
			[
				{ text: "Cancel", style: "cancel" },
				{ text: "Blacklist", style: "destructive", onPress: () => handleStatusChange(labour, 'blacklisted') }
			]
		);
	};

	return (
		<View style={local.container}>
			<View style={local.headerRow}>
				<Pressable onPress={() => router.back()} style={local.backBtn}>
					<Text style={local.backText}>← Back</Text>
				</Pressable>
				<Text style={local.header}>
					{supervisorId ? "My Labours" : "Manage Labours"}
				</Text>
				{isAdmin ? (
					<Pressable onPress={() => router.push("/(screens)/add-labour")} style={local.backBtn}>
						<Text style={local.backText}>+ New</Text>
					</Pressable>
				) : <View style={{ width: 50 }} />}
			</View>

			{/* Toggle for Active/Inactive - Only for Admins or if we want supervisors to see inactive? Limit to Admin for now based on context */}
			{isAdmin && !supervisorId && (
				<View style={local.toggleContainer}>
					<TouchableOpacity
						style={[local.toggleBtn, viewType === 'active' && local.toggleBtnActive]}
						onPress={() => setViewType('active')}
					>
						<Text style={[local.toggleText, viewType === 'active' && local.toggleTextActive]}>Active</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[local.toggleBtn, viewType === 'inactive' && local.toggleBtnActive]}
						onPress={() => setViewType('inactive')}
					>
						<Text style={[local.toggleText, viewType === 'inactive' && local.toggleTextActive]}>Inactive</Text>
					</TouchableOpacity>
				</View>
			)}

			<FlatList
				data={labours}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<LabourCard
						labour={item}
						showMoveAction={isAdmin}
						onMove={handleMove}
						onTerminate={handleTerminate}
						onBlacklist={handleBlacklist}
						onRevoke={(labour) => handleStatusChange(labour, 'active')}
					/>
				)}
				contentContainerStyle={local.listContent}
				ListEmptyComponent={
					!loading ? (
						<Text style={local.emptyText}>No {viewType} labours found.</Text>
					) : null
				}
			/>

			{/* Site Picker Modal */}
			<Modal visible={showSitePicker} transparent animationType="slide">
				<View style={local.modalOverlay}>
					<View style={local.modalContent}>
						<View style={local.modalHeader}>
							<Text style={local.modalTitle}>
								Move {selectedLabour?.name} to...
							</Text>
							<TouchableOpacity onPress={() => setShowSitePicker(false)}>
								<MaterialIcons name="close" size={24} color="#333" />
							</TouchableOpacity>
						</View>

						{assigning ? (
							<Text style={local.loadingText}>Assigning...</Text>
						) : (
							<FlatList
								data={sites}
								style={{ maxHeight: 300 }}
								keyExtractor={(item) => item.id.toString()}
								renderItem={({ item }) => (
									<TouchableOpacity
										style={local.siteOption}
										onPress={() => handleAssignSite(item)}
									>
										<MaterialIcons
											name="location-city"
											size={20}
											color={selectedLabour?.site_id === item.id ? "#0a84ff" : "#666"}
										/>
										<Text
											style={[
												local.siteOptionName,
												selectedLabour?.site_id === item.id && { color: "#0a84ff", fontWeight: "600" },
											]}
										>
											{item.name}
										</Text>
										{selectedLabour?.site_id === item.id && (
											<MaterialIcons name="check" size={20} color="#0a84ff" />
										)}
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
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: "#fff",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		maxHeight: "80%",
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
	},
	siteOption: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#f9f9f9",
		gap: 12,
	},
	siteOptionName: {
		fontSize: 16,
		color: "#333",
		flex: 1,
	},
	loadingText: {
		textAlign: "center",
		padding: 20,
		color: "#666",
	},
	toggleContainer: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		marginBottom: 10,
		backgroundColor: '#fff',
		paddingBottom: 10,
	},
	toggleBtn: {
		flex: 1,
		paddingVertical: 10,
		alignItems: 'center',
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
	},
	toggleBtnActive: {
		borderBottomColor: '#0a84ff',
	},
	toggleText: {
		fontSize: 16,
		color: '#666',
		fontWeight: '500',
	},
	toggleTextActive: {
		color: '#0a84ff',
		fontWeight: '700',
	}
});
