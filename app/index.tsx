import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";

export default function IndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    // redirect to splash (auth) on app start
    router.replace("/auth");
  }, [router]);

  return <View />;
}
