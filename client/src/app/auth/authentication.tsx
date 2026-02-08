import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { API_URL } from "../../constants";
import { styles } from "../style/stylesheet";

const App = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number.");
      return;
    }
    if (phone.trim().length < 10) {
      Alert.alert("Validation Error", "Phone number must be at least 10 digits.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Validation Error", "Please enter a password.");
      return;
    }
    if (password.trim().length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Account created successfully!", [
          { text: "OK", onPress: () => router.replace("/(tabs)/home") },
        ]);
      } else {
        Alert.alert("Sign Up Failed", data.error || "Failed to create account");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      Alert.alert("Error", "Unable to connect to server");
    }
  };

  const onPressSignInButton = () => {
    router.push("/auth/authentication2" as any);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.head1}>Welcome to rayan</Text>
      <Text style={styles.head}>Sign up To continue</Text>
      <Text style={styles.labelname}>Name</Text>
      <TextInput
        style={styles.valbox}
        placeholder="muhammed fasal"
        onChangeText={(text) => setName(text)}
        value={name}
      />
      <Text style={styles.labelname}>Phone Number</Text>
      <TextInput
        style={styles.valbox}
        onChangeText={(text) => setPhone(text)}
        value={phone}
        placeholder="Enter 10 digit phone number"
        keyboardType="phone-pad"
      />
      <Text style={styles.labelname}>Password</Text>
      <TextInput
        style={styles.valbox}
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressSignInButton}>
        <Text style={styles.linkstyle}>(Sign In)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default App;
