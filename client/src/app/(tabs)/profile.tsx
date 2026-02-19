import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUser = async (isRefresh = false) => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Failed to load user data", error);
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUser(true);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace("/auth/authentication");
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const userName = user?.name || "User";
  const userPhone = user?.phone || "";
  const userRole = user?.role || "User";

  const initials = userName
    ? userName
      .split(" ")
      .map((s: string) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a84ff']} />
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.role}>{userRole.toUpperCase()}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{userPhone}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={() => { }}>
            <Text style={styles.actionText}>Edit Profile</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.logoutBtn]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "700" },
  closeBtn: { padding: 8 },
  closeText: { color: "#0a84ff", fontWeight: "600" },
  body: { padding: 20, alignItems: "center" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#0a84ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  name: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  role: { color: "#666", marginBottom: 18 },
  infoRow: {
    width: "100%",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  infoLabel: { color: "#888", fontSize: 12 },
  infoValue: { fontSize: 14, marginTop: 4 },
  actions: { flexDirection: "row", marginTop: 24 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
    backgroundColor: "#0a84ff",
    borderRadius: 8,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "700" },
  logoutBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e33" },
  logoutText: { color: "#e33" },
});
