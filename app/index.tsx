
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

//const logo=require("../assets/logo.png");
export default function App() {
    return (
      <View style={styles.container}>
        /*
        <Image source={logo} style={styles.image} />
        */
        <Text style={styles.em}>Rayan</Text>
        <Text style={styles.em}>Fire & safety</Text>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200, 
    height: 200, 
  },
  em: {
    textAlign:"center",
    verticalAlign: 'middle',  
    textAlignVertical: 'center',
    fontStyle: 'italic',
    fontWeight: 'bold',
    fontSize:18,
    color: '#AA0000',
    textShadowColor: 'rgba(74, 16, 16, 0.75)',
    marginTop: 20,
  },
});