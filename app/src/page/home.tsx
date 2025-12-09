import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Person = {
  id: string;
  name: string;
  role: "Labour" | "Manager";
  attendance: { present: number; absent: number };
  advance: number; // amount advanced
  overtimeHours: number;
};

const sampleData: Person[] = [
  {
    id: "l1",
    name: "Ravi Kumar",
    role: "Labour",
    attendance: { present: 22, absent: 2 },
    advance: 1200,
    overtimeHours: 8,
  },
  {
    id: "l2",
    name: "Sita Devi",
    role: "Labour",
    attendance: { present: 20, absent: 4 },
    advance: 800,
    overtimeHours: 4,
  },
  {
    id: "m1",
    name: "Ajay Singh",
    role: "Manager",
    attendance: { present: 24, absent: 0 },
    advance: 0,
    overtimeHours: 2,
  },
  {
    id: "m2",
    name: "Neha Sharma",
    role: "Manager",
    attendance: { present: 23, absent: 1 },
    advance: 500,
    overtimeHours: 6,
  },
];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PersonCard({ person }: { person: Person }) {
  return (
    <View style={styles.card} key={person.id}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{person.name}</Text>
        <Text style={styles.role}>{person.role}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Present" value={person.attendance.present} />
        <Stat label="Absent" value={person.attendance.absent} />
        <Stat label="Advance" value={`₹ ${person.advance}`} />
        <Stat label="OT hrs" value={person.overtimeHours} />
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionText}>Attendance</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionText}>Advance</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionText}>Overtime</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!query.trim()) return sampleData;
    const q = query.trim().toLowerCase();
    return sampleData.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)
    );
  }, [query]);

  const labours = filtered.filter((p) => p.role === "Labour");
  const managers = filtered.filter((p) => p.role === "Manager");

  const userName = "Admin User";
  const initials = userName
    .split(" ")
    .map((s) => s[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerRight}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search labours or managers"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          <Pressable
            style={styles.profileBtn}
            onPress={() => router.push("/profile" as any)}
          >
            <Text style={styles.profileInitials}>{initials}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Labours</Text>
        {labours.map((l) => (
          <PersonCard person={l} key={l.id} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Managers</Text>
        {managers.map((m) => (
          <PersonCard person={m} key={m.id} />
        ))}
      </View>

      <View style={styles.sectionSummary}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            Total Labours: {labours.length}
          </Text>
          <Text style={styles.summaryText}>
            Total Managers: {managers.length}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7fb" },
  content: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 0 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 12,
    paddingVertical: 6,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    textAlignVertical: "center",
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0a84ff",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: { color: "#fff", fontWeight: "700", fontSize: 14 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: "600" },
  role: { fontSize: 12, color: "#666" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 15, fontWeight: "700" },
  statLabel: { fontSize: 11, color: "#666" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: "#0a84ff",
    borderRadius: 6,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "600" },
  sectionSummary: { marginTop: 18 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryText: { fontSize: 14, color: "#333" },
});
