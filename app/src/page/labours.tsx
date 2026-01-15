import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Labours() {
  const router = useRouter();
  let { newLabour } = useLocalSearchParams();

  // safety: ignore empty or invalid values
  const safeNewLabour = typeof newLabour === 'string' && newLabour.trim() ? newLabour : null;

  useEffect(() => {
    if (!safeNewLabour) return;

    try {
      const parsed = JSON.parse(decodeURIComponent(safeNewLabour as string));
      const entry = { ...parsed, createdAt: new Date().toLocaleString() };
      setLabours((l) => [entry, ...l]);
    } catch (err) {
      console.warn("Failed to parse newLabour param", err);
    }

    // clear the param (best-effort; ignore navigation errors)
    try {
      router.replace("/labours");
    } catch (e) {
      /* ignore */
    }
  }, [safeNewLabour, router]);

  return (
		<ScrollView contentContainerStyle={local.container}>
			<View style={local.headerRow}>
				<Pressable
					onPress={() => router.back()}
					style={local.backBtn}
					accessibilityRole="button"
				>
					<Text style={local.backText}>← Back</Text>
				</Pressable>
				<Text style={local.header}>Labours</Text>
				<View style={{ width: 60 }} />
			</View>

			{labours?.map((lab, i) => (
				<View key={i} style={local.card}>
					<View style={local.row}>
						<Text style={local.name}>{lab.name}</Text>
						<Text style={local.rate}>
							{lab.rate ? `₹${Number(lab.rate).toFixed(2)}` : "-"}
						</Text>
					</View>
					<Text style={local.small}>
						{lab.trade} • {lab.site}
					</Text>
					<Text style={local.small}>{lab.phone}</Text>
					<Text style={local.time}>{lab.createdAt}</Text>
				</View>
			))}

			<View style={{ height: 40 }} />
		</ScrollView>
	);
}

const local = StyleSheet.create({
  container: { padding: 20, paddingTop: 30, backgroundColor: "#fff", minHeight: "100%" },
  headerRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  backText: { color: "#0a84ff", fontWeight: "600" },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 0 },
  card: { padding: 14, borderRadius: 8, backgroundColor: "#f7f7f7", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "700" },
  rate: { color: "#666" },
  small: { color: "#666", marginTop: 6 },
  time: { color: "#999", marginTop: 8, fontSize: 12 },
});
