import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { styles as globalStyles } from "../style/stylesheet";

export default function HomeScreen() {
	const router = useRouter();
	const today = new Date().toLocaleDateString();
	const [query, setQuery] = useState("");
	const { newActivity } = useLocalSearchParams();

	const stats = [
		{ key: "workers", label: "Workers", value: 0 },
		{ key: "jobs", label: "Active workers", value: 0 },
		{ key: "attendance", label: "Today Present", value: 0 },
		{ key: "approvals", label: "Total site", value: 0 },
	];

	const [recent, setRecent] = useState<string[]>([
		"John Doe checked in",
		"New job posted: Site A",
		"Timesheet submitted by Jane",
		"Approval requested: Material purchase",
	]);

	useEffect(() => {
		if (newActivity) {
			const entry = `${newActivity} • ${new Date().toLocaleTimeString()}`;
			setRecent((r) => [entry, ...r]);
			// clear the param so it doesn't reapply on refresh
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
				{stats.map((s) => (
					<View key={s.key} style={local.card}>
						<Text style={local.cardValue}>{s.value}</Text>
						<Text style={local.cardLabel}>{s.label}</Text>
					</View>
				))}
			</View>

			<View style={local.actions}>
				<Text style={local.sectionTitle}>Quick Actions</Text>
				<View style={local.actionsRow}>
					<TouchableOpacity
						style={local.actionButton}
						onPress={() => router.push("../screens/labours")}
					>
						<Text style={local.actionText}>Show Labours</Text>
					</TouchableOpacity>

					<TouchableOpacity style={local.actionButton} onPress={() => {}}>
						<Text style={local.actionText}>🗂 Generate Reports</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View style={local.recent}>
				<Text style={local.sectionTitle}>Recent Activity</Text>
				{(query ? filteredRecent : recent).map((r, i) => (
					<View key={i} style={local.recentItem}>
						<Text style={local.recentText}>{r}</Text>
					</View>
				))}
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
