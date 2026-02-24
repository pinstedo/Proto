import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_URL } from "../../constants";
import { useTheme } from "../../context/ThemeContext";

export default function Profile() {
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
  const styles = getStyles(isDark);

  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Profile States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password States
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Clear Database States
  const [isClearingDatabase, setIsClearingDatabase] = useState(false);

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

  const openEditModal = () => {
    setEditName(user?.name || "");
    setEditProfileImage(user?.profile_image || null);
    setIsEditModalVisible(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const b64 = `data:${result.assets[0].mimeType || 'image/jpeg'};base64,${result.assets[0].base64}`;
      setEditProfileImage(b64);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Validation", "Name cannot be empty");
      return;
    }

    try {
      setIsSavingProfile(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, profile_image: editProfileImage }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        // Save the updated user to storage
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));
        setUser(data.user);
        setIsEditModalVisible(false);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Save profile error:", error);
      Alert.alert("Error", "Unable to connect to server");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Validation", "New password must be at least 6 characters.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      let data;
      const textResponse = await response.text();
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("Non-JSON response from server:", textResponse);
        Alert.alert("Server Error", "Received an unexpected response from the server. Please manually restart the backend server so it can load the new API endpoint.");
        setIsChangingPassword(false);
        return;
      }

      if (response.ok) {
        Alert.alert("Success", "Password changed successfully!");
        setIsPasswordModalVisible(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Error", data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      Alert.alert("Error", "Unable to connect to server");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClearDatabase = () => {
    Alert.alert(
      "Clear Database",
      "Are you sure you want to clear the entire database? This action cannot be undone and will delete all labours, sites, attendances, and supervisors.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear System Data",
          style: "destructive",
          onPress: async () => {
            try {
              setIsClearingDatabase(true);
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${API_URL}/auth/clear-database`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();
              if (response.ok) {
                Alert.alert("Success", "Database cleared successfully!");
              } else {
                Alert.alert("Error", data.error || "Failed to clear database");
              }
            } catch (error) {
              console.error("Clear database error:", error);
              Alert.alert("Error", "Unable to connect to server");
            } finally {
              setIsClearingDatabase(false);
            }
          },
        },
      ]
    );
  };

  const userName = user?.name || "User";
  const userPhone = user?.phone || "";
  const userRole = user?.role || "User";
  const userProfileImage = user?.profile_image;

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
        <Pressable style={styles.editHeaderBtn} onPress={openEditModal}>
          <Text style={styles.editHeaderText}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a84ff']} />
        }
      >
        <View style={styles.avatar}>
          {userProfileImage ? (
            <Image source={{ uri: userProfileImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>

        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.role}>{userRole.toUpperCase()}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{userPhone}</Text>
        </View>

        <View style={styles.themeRow}>
          <Text style={styles.themeLabel}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#ccc", true: "#0a84ff" }}
            thumbColor={isDark ? "#fff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.actions}>
          {(userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'supervisor') && (
            <Pressable style={styles.actionBtn} onPress={() => setIsPasswordModalVisible(true)}>
              <Text style={styles.actionText}>Change Password</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.actionBtn, styles.logoutBtn]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
          </Pressable>
        </View>

        {userRole.toLowerCase() === 'admin' && (
          <View style={{ width: '100%', marginTop: 24, paddingHorizontal: 8 }}>
            <Pressable
              style={[styles.actionBtn, styles.clearDbBtn, { marginHorizontal: 0 }]}
              onPress={handleClearDatabase}
              disabled={isClearingDatabase}
            >
              {isClearingDatabase ? (
                <ActivityIndicator color="#ff3b30" />
              ) : (
                <Text style={[styles.actionText, styles.clearDbText]}>Clear Database</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Edit Profile Modal */}
        <Modal
          visible={isEditModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Pressable onPress={() => setIsEditModalVisible(false)}>
                  <Text style={styles.closeText}>Cancel</Text>
                </Pressable>
              </View>

              <View style={styles.imagePickerContainer}>
                <Pressable onPress={pickImage} style={styles.pickerAvatar}>
                  {editProfileImage ? (
                    <Image source={{ uri: editProfileImage }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                  <View style={styles.editOverlay}>
                    <Text style={styles.editOverlayText}>Change</Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
                  placeholder="Enter name"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <Pressable
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={isPasswordModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsPasswordModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <Pressable onPress={() => setIsPasswordModalVisible(false)}>
                  <Text style={styles.closeText}>Cancel</Text>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
                  placeholder="Enter current password"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
                  placeholder="Enter new password"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <Pressable
                style={styles.saveBtn}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Password</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#121212" : "#fff" },
  header: {
    backgroundColor: isDark ? "#1e1e1e" : "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 8,
  },
  title: { fontSize: 30, fontWeight: "800", color: isDark ? "#ffffff" : "#0F172A" },
  editHeaderBtn: { padding: 8, backgroundColor: "#1e78d2ff", borderRadius: 20 },
  editHeaderText: { color: "#ffffffff", fontWeight: "600", paddingHorizontal: 8 },
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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  name: { fontSize: 18, fontWeight: "700", marginBottom: 4, color: isDark ? "#fff" : "#000" },
  role: { color: isDark ? "#aaa" : "#666", marginBottom: 18 },
  infoRow: {
    width: "100%",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#333" : "#f1f1f1",
  },
  infoLabel: { color: isDark ? "#888" : "#888", fontSize: 12 },
  infoValue: { fontSize: 16, marginTop: 4, color: isDark ? "#fff" : "#000" },
  themeRow: {
    width: "100%",
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#333" : "#f1f1f1",
  },
  themeLabel: { fontSize: 16, color: isDark ? "#fff" : "#000", fontWeight: "500" },
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
  logoutBtn: { backgroundColor: isDark ? "#121212" : "#fff", borderWidth: 1, borderColor: "#e33" },
  logoutText: { color: "#e33" },
  clearDbBtn: { backgroundColor: isDark ? "#121212" : "#fff", borderWidth: 1, borderColor: "#ff3b30" },
  clearDbText: { color: "#ff3b30" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: isDark ? "#1e1e1e" : "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: isDark ? "#fff" : "#000" },
  imagePickerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  pickerAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#0a84ff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  editOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 4,
    alignItems: "center",
  },
  editOverlayText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: isDark ? "#aaa" : "#666", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: isDark ? "#444" : "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: isDark ? "#2a2a2a" : "#fff",
  },
  saveBtn: {
    backgroundColor: "#0a84ff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
