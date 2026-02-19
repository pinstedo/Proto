import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { JSX } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../style/stylesheet1";

const options = [
  { key: "attendance", icon: "check-circle", title: "Attendance", desc: "Record and view attendance" },
  { key: "overtime", icon: "timer", title: "Overtime", desc: "Log overtime hours" },
  { key: "advance", icon: "account-balance-wallet", title: "Advance", desc: "Manage advances" },
  { key: "sites", icon: "location-city", title: "Sites", desc: "Manage job sites" },
  { key: "labours", icon: "group", title: "Labours", desc: "View and manage labours" },
  { key: "supervisors", icon: "supervisor-account", title: "Supervisors", desc: "View supervisors added by admin" },
];

export default function Manage(): JSX.Element {
  const router = useRouter();

  const onPress = (key: string) => {
    if (key === "labours") {
      router.push("/(screens)/labours");
      return;
    }
    if (key === "attendance") {
      router.push("/(screens)/reports/site-attendance" as any);
      return;
    }
    if (key === "overtime") {
      router.push("/(screens)/overtime");
      return;
    }
    if (key === "supervisors") {
      router.push("/(screens)/supervisors");
      return;
    }
    if (key === "sites") {
      router.push("/(screens)/sites");
      return;
    }
    if (key === "advance") {
      router.push("/(screens)/advance");
      return;
    }
    // navigate to dedicated management screen (ensure routes exist or create them)
    router.push(`/manage/${key}` as any);
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Manage</Text>

        <View style={styles.grid}>
          {options.map((opt) => (
            <Pressable
              key={opt.key}
              style={styles.optionCard}
              onPress={() => onPress(opt.key)}
              accessibilityRole="button"
              accessibilityLabel={opt.title}
            >
              <View style={styles.optionIconWrap}>
                <MaterialIcons name={opt.icon as any} size={20} color="#0a84ff" />
              </View>

              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}