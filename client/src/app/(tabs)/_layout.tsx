
import "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { default as React, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function RootLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#4da6ff" : "#0a84ff",
        tabBarInactiveTintColor: isDark ? "#666" : "#8e8e93",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: isDark ? "#121212" : "#ffffff",
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 6,
          elevation: 10,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <IconWithAnimation
              name={focused ? "home" : "home-outline"}
              size={28}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: "Manage",
          tabBarIcon: ({ color, focused }) => (
            <IconWithAnimation
              name={focused ? "briefcase" : "briefcase-outline"}
              size={28}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <IconWithAnimation
              name={focused ? "person" : "person-outline"}
              size={28}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const IconWithAnimation = ({ name, color, focused, size }: any) => {
  const scale = useRef(new Animated.Value(focused ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size ?? 24} color={color} />
    </Animated.View>
  );
};
