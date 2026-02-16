import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { api } from "../../services/api";
import { styles as globalStyles } from "../style/stylesheet";

export default function HomeScreen() {
	const router = useRouter();
	const today = new Date().toLocaleDateString(undefined, {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const [query, setQuery] = useState("");
	const { newActivity } = useLocalSearchParams();

	const [stats, setStats] = useState({
		workers: 0,
		jobs: 0,
		attendance: 0,
		approvals: 0,
	});

	const [recent, setRecent] = useState<string[]>([]);

	useFocusEffect(
		useCallback(() => {
			const fetchData = async () => {
				try {
					const statsRes = await api.get("/dashboard/stats");
					const statsData = await statsRes.json();
					if (statsRes.ok) setStats(statsData);

					const recentRes = await api.get("/dashboard/recent");
					const recentData = await recentRes.json();
					if (recentRes.ok) setRecent(recentData);
				} catch (error) {
					console.error("Failed to fetch dashboard data:", error);
				}
			};

			fetchData();
		}, [])
	);

	const statsDisplay = [
		{ key: "workers", label: "Workers", value: stats.workers },
		{ key: "jobs", label: "Active workers", value: stats.jobs },
		{
			key: "attendance",
			label: "Today Present",
			value: stats.attendance,
			onPress: () => router.push("/(screens)/reports/site-attendance" as any),
		},
		{ key: "approvals", label: "Total site", value: stats.approvals },
	];

	// Optional: if newActivity param is passed, we might want to manually add it 
	// or just refetch. Refetching is safer to ensure consistency.
	// But sticking to existing logic for "instant feedback" feel if desired:
	React.useEffect(() => {
		if (newActivity) {
			const entry = `${newActivity} • ${new Date().toLocaleTimeString()}`;
			setRecent((r) => [entry, ...r]);
			router.replace("/home");
		}
	}, [newActivity, router]);

	const filteredRecent = recent.filter((r) =>
		r.toLowerCase().includes(query.trim().toLowerCase())
	);

	return (
		<ScrollView contentContainerStyle={local.container}>
			<View style={local.header}>
				<Text style={globalStyles.head1}>labour manage</Text>
				<Text style={local.date}>{today}</Text>

				<TextInput
					style={local.searchInput}
					placeholder="Search activities or workers..."
					value={query}
					onChangeText={setQuery}
					clearButtonMode="while-editing"
				/>
			</View>

			<View style={local.cardsRow}>
				{statsDisplay.map((s) => (
					<TouchableOpacity
						key={s.key}
						style={local.card}
						onPress={s.onPress}
						disabled={!s.onPress}
					>
						<Text style={local.cardValue}>{s.value}</Text>
						<Text style={local.cardLabel}>{s.label}</Text>
					</TouchableOpacity>
				))}
			</View>

			<View style={local.actions}>
				<Text style={local.sectionTitle}>Quick Actions</Text>
				<View style={local.actionsRow}>
					<TouchableOpacity
						style={local.actionButton}
						onPress={() => router.push("/(screens)/labours")}
					>
						<Text style={local.actionText}>Labours</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={local.actionButton}
						onPress={() => router.push("/(screens)/add-supervisor" as any)}
					>
						<Text style={local.actionText}>Add Supervisor</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[local.actionButton, { marginRight: 0 }]}
						onPress={() => router.push("/(screens)/reports/labour_summary" as any)}
					>
						<Text style={local.actionText}>Reports</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View style={local.recent}>
				<Text style={local.sectionTitle}>Recent Activity</Text>
				{filteredRecent.length === 0 ? (
					<Text style={{ color: "#888", fontStyle: "italic" }}>No recent activity</Text>
				) : (
					filteredRecent.map((r, i) => (
						<View key={i} style={local.recentItem}>
							<Text style={local.recentText}>{r}</Text>
						</View>
					))
				)}
			</View>

			<View style={{ height: 40 }} />
		</ScrollView>
	);
}

const local = StyleSheet.create({
	container: {
		padding: 20,
		paddingTop: 40,
		backgroundColor: "#fff",
		minHeight: "100%",
	},
	header: {
		alignItems: "center",
		marginBottom: 20,
	},
	date: {
		color: "#666",
		marginTop: 6,
	},
	searchInput: {
		width: "100%",
		backgroundColor: "#f1f1f1",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		marginTop: 12,
	},
	cardsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginBottom: 18,
	},
	card: {
		width: "48%",
		backgroundColor: "#f7f7f7",
		borderRadius: 8,
		padding: 14,
		marginBottom: 10,
	},
	cardValue: {
		fontSize: 22,
		fontWeight: "700",
		color: "#222",
	},
	cardLabel: {
		marginTop: 6,
		color: "#666",
	},
	actions: {
		marginVertical: 10,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 8,
	},
	actionsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	actionButton: {
		backgroundColor: "#eb9834",
		padding: 12,
		borderRadius: 8,
		flex: 1,
		marginRight: 8,
	},
	actionText: {
		color: "#fff",
		textAlign: "center",
		fontWeight: "700",
	},
	recent: {
		marginTop: 12,
	},
	recentItem: {
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	recentText: {
		color: "#333",
	},
});
