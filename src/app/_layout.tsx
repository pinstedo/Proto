
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { default as React, default as React, useEffect, useRef } from "react";
import { Animated } from "react-native";
export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#eb9834",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: "Manage",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const IconWithAnimation = ({ name, color, focused, size }: any) => {
  const scale = useRef(new Animated.Value(focused ? 1.08 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.08 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 160,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={size ?? 22} color={color} />
    </Animated.View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#eb9834",
        tabBarInactiveTintColor: "#8a8a8a",
        tabBarStyle: {
          height: 72,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#eee",
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 10,
          paddingHorizontal: 8,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 4 },
        tabBarItemStyle: { paddingTop: 8, paddingHorizontal: 12, alignItems: "center" },
        tabBarIconStyle: { marginBottom: 4 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <IconWithAnimation name={focused ? "home" : "home-outline"} size={22} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: "Manage",
          tabBarIcon: ({ color, size, focused }) => (
            <IconWithAnimation name={focused ? "construct" : "construct-outline"} size={22} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <IconWithAnimation name={focused ? "person" : "person-outline"} size={22} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}