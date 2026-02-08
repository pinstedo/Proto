import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../constants";
import { styles as globalStyles, styles } from "../style/stylesheet";

interface Site {
  id: number;
  name: string;
  address: string;
}

export default function AddLabour() {
  const router = useRouter();
  const params = useLocalSearchParams<{ siteId?: string; siteName?: string }>();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [rate, setRate] = useState("");
  const [notes, setNotes] = useState("");

  const [sites, setSites] = useState<Site[]>([]);
  const [showSitePicker, setShowSitePicker] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    loadUserAndSites();
  }, []);

  useEffect(() => {
    // If site params passed from supervisor home, set the selected site
    if (params.siteId && params.siteName) {
      setSelectedSite({
        id: parseInt(params.siteId),
        name: decodeURIComponent(params.siteName),
        address: "",
      });
    }
  }, [params.siteId, params.siteName]);

  const loadUserAndSites = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem("userData");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserRole(userData.role);

        // Fetch sites based on role
        if (userData.role === "admin") {
          // Admin can see all sites
          const response = await fetch(`${API_URL}/sites`);
          const data = await response.json();
          if (response.ok) {
            setSites(data);
          }
        } else if (userData.role === "supervisor") {
          // Supervisor sees only assigned sites
          const response = await fetch(`${API_URL}/sites/supervisor/${userData.id}`);
          const data = await response.json();
          if (response.ok) {
            setSites(data);
          }
        }
      }
    } catch (error) {
      console.error("Error loading user/sites:", error);
    }
  };

  const onSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter the labour name.");
      return;
    }

    try {
      const payload = {
        name,
        phone,
        aadhaar,
        site: selectedSite?.name || "",
        site_id: selectedSite?.id || null,
        rate,
        notes,
        trade: "General"
      };

      const response = await fetch(`${API_URL}/labours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Success", "Labour added successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to add labour");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to connect to server");
    }
  };

  return (
    <ScrollView contentContainerStyle={local.container}>
      <View style={local.header}>
        <Text style={globalStyles.head1}>Add Labour</Text>
        <Text style={local.sub}>Enter Labour details below</Text>
      </View>

      <View style={local.form}>
        <Text style={styles.labelname}>Full name:</Text>
        <TextInput style={local.input} value={name} onChangeText={setName} placeholder="abhishek" />

        <Text style={styles.labelname}>Phone:</Text>
        <TextInput style={local.input} value={phone} onChangeText={setPhone} placeholder="+9197589018" keyboardType="phone-pad" />

        <Text style={styles.labelname}>Aadhaar number:</Text>
        <TextInput style={local.input} value={aadhaar} onChangeText={setAadhaar} placeholder="" keyboardType="phone-pad" />

        <Text style={styles.labelname}>Job site:</Text>
        <TouchableOpacity
          style={local.siteSelector}
          onPress={() => setShowSitePicker(true)}
        >
          <View style={local.siteSelectorContent}>
            <MaterialIcons name="location-city" size={20} color={selectedSite ? "#0a84ff" : "#999"} />
            <Text style={[local.siteSelectorText, !selectedSite && local.siteSelectorPlaceholder]}>
              {selectedSite ? selectedSite.name : "Select a site"}
            </Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        <Text style={styles.labelname}>Hourly rate:</Text>
        <TextInput style={local.input} value={rate} onChangeText={setRate} placeholder="e.g., 15.00" keyboardType="decimal-pad" />

        <Text style={styles.labelname}>Notes:</Text>
        <TextInput style={[local.input, { height: 90 }]} value={notes} onChangeText={setNotes} placeholder="Optional notes" multiline />

        <TouchableOpacity style={local.cancelBtn} onPress={() => router.back()}>
          <Text style={local.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={local.submit} onPress={onSubmit}>
          <Text style={local.submitText}>Add Labour</Text>
        </TouchableOpacity>
      </View>

      {/* Site Picker Modal */}
      <Modal visible={showSitePicker} transparent animationType="slide">
        <View style={local.modalOverlay}>
          <View style={local.modalContent}>
            <View style={local.modalHeader}>
              <Text style={local.modalTitle}>Select Site</Text>
              <TouchableOpacity onPress={() => setShowSitePicker(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {sites.length === 0 ? (
              <View style={local.emptySites}>
                <MaterialIcons name="location-off" size={48} color="#ccc" />
                <Text style={local.emptySitesText}>
                  {userRole === "supervisor"
                    ? "No sites assigned to you"
                    : "No sites available. Create one first."}
                </Text>
              </View>
            ) : (
              <FlatList
                data={sites}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      local.siteOption,
                      selectedSite?.id === item.id && local.siteOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedSite(item);
                      setShowSitePicker(false);
                    }}
                  >
                    <MaterialIcons
                      name="location-city"
                      size={20}
                      color={selectedSite?.id === item.id ? "#0a84ff" : "#666"}
                    />
                    <View style={local.siteOptionInfo}>
                      <Text style={local.siteOptionName}>{item.name}</Text>
                      {item.address && <Text style={local.siteOptionAddress}>{item.address}</Text>}
                    </View>
                    {selectedSite?.id === item.id && (
                      <MaterialIcons name="check-circle" size={24} color="#0a84ff" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    minHeight: "100%",
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  sub: {
    color: "#666",
    marginTop: 6,
    fontSize: 16,
  },
  form: {
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  siteSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  siteSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  siteSelectorText: {
    fontSize: 16,
    color: "#333",
  },
  siteSelectorPlaceholder: {
    color: "#999",
  },
  cancelBtn: {
    marginTop: 18,
    backgroundColor: "#ddd",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#333",
    fontWeight: "700",
  },
  submit: {
    marginTop: 12,
    backgroundColor: "#eb9834",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
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
    maxHeight: "70%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  emptySites: {
    alignItems: "center",
    padding: 32,
  },
  emptySitesText: {
    color: "#999",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  siteOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  siteOptionSelected: {
    backgroundColor: "#e8f4ff",
  },
  siteOptionInfo: {
    flex: 1,
  },
  siteOptionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  siteOptionAddress: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
