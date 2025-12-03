import { router } from "expo-router";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "./stylesheet";
function onPressButton() {
  router.push("/authentication");
}
const app = () => {
  const [] = useState("");
  return (
    <View style={styles.container}>
      <Text style={styles.head1}>Sign up</Text>
      <Text style={styles.head}>To continue</Text>
      <Text style={styles.labelname}>Name</Text>
      <TextInput
        style={styles.valbox}
        placeholder="muhammed fasal"
        onChangeText={(text) => console.log(text)}
      />
      <Text style={styles.labelname}>Phone Number</Text>
      <TextInput style={styles.valbox} />
      <Text style={styles.labelname}>Password</Text>
      <TextInput style={styles.valbox} />
      <TouchableOpacity onPress={onPressButton}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default app;
