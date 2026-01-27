import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles as globalStyles, styles } from "../style/stylesheet";

export default function AddLabour() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState("");
  const [site, setSite] = useState("");
  const [rate, setRate] = useState("");
  const [notes, setNotes] = useState("");

  const onSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter the labour name.");
      return;
    }

    // Basic payload — replace with API call as needed
    const payload = { name, phone, trade, site, rate, notes };
    console.log("Add Labour", payload);

    // Simulate success
    const activity = `${name} added`;
    Alert.alert("Success", "Labour added successfully.", [
      { text: "OK", onPress: () => router.push(`../screens/labours?newLabour=${encodeURIComponent(JSON.stringify(payload))}&newActivity=${encodeURIComponent(activity)}`) },
    ]);
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
        <TextInput style={local.input} value={phone} onChangeText={setPhone} placeholder="" keyboardType="phone-pad" />

        <Text style={styles.labelname}>Job site:</Text>
        <TextInput style={local.input} value={site} onChangeText={setSite} placeholder="Site name or address" />

        <Text style={styles.labelname}>Hourly rate:</Text>
        <TextInput style={local.input} value={rate} onChangeText={setRate} placeholder="e.g., 15.00" keyboardType="decimal-pad" />

        <Text style={styles.labelname}>Notes:</Text>
        <TextInput style={[local.input, { height: 90 }]} value={notes} onChangeText={setNotes} placeholder="Optional notes" multiline />

        <TouchableOpacity style={local.submit} onPress={onSubmit}>
          <Text style={local.submitText}>add Labour</Text>
        </TouchableOpacity>
      </View>
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
  label: {
    marginTop: 12,
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  submit: {
    marginTop: 18,
    backgroundColor: "#eb9834",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
  },
});
