import { router } from "expo-router";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../style/stylesheet";

function onPressBackButton() {
  router.back();
}

function onPressButton() {
  router.push("/src/page/home");
}

const App = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPressBackButton} style={styles.backButton}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <Text style={styles.head1}>Sign in</Text>
      <Text style={styles.head}>To continue</Text>
      <Text style={styles.labelname}>Phone Number</Text>
      <TextInput
        style={styles.valbox}
        onChangeText={(text) => setPhone(text)}
        value={phone}
      />
      <Text style={styles.labelname}>Password</Text>
      <TextInput
        style={styles.valbox}
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry
      />
      <TouchableOpacity onPress={onPressButton}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressButton}>
        <Text>forgot Password</Text>
      </TouchableOpacity>
    </View>
  );
};

export default App;
