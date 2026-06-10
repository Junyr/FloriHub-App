import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../styles/global";

export default function Index() {
  useEffect(() => {
    AsyncStorage.getItem("florihub_token").then((token) => {
      if (token) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    });
  }, []);

  return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
});