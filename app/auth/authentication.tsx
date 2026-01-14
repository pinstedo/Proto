import { router } from "expo-router";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../style/stylesheet";

function onPressButton() {
  // navigate into the main app tabs
  router.replace("/home");
}
function onPressSignInButton() {
  router.push("../auth/authentication2");
}

const App = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
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
      />
      <Text style={styles.labelname}>Password</Text>
      <TextInput
        style={styles.valbox}
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry
      />
      <TouchableOpacity onPress={onPressButton}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressSignInButton}>
        <Text style={styles.linkstyle}>(Sign In)</Text>
      </TouchableOpacity>
    </View>
  );
};

export default App;
