import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./stylesheet";

function onPressButton() {
  router.push("/authentication");
}
export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.head1}>WELCOME</Text>
      <Image
        style={styles.image}
        source={require("../assets/images/logo11.png")}
      />
      <TouchableOpacity onPress={onPressButton}>
        <Text style={styles.buttonText}>Click Me</Text>
        
      </TouchableOpacity>
      <Text style={styles.em}>Rayan</Text>
        <Text style={styles.em}>Fire & safety</Text>
    </View>
  );
}
