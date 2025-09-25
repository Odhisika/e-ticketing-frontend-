import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Home, AlertCircle } from "lucide-react-native";
import { Link, Stack } from "expo-router";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found" }} />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#8B5CF6", "#3B82F6"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.content}>
            <AlertCircle size={64} color="#FFFFFF" />
            <Text style={styles.title}>Page Not Found</Text>
            <Text style={styles.subtitle}>
              The page you&apos;re looking for doesn&apos;t exist.
            </Text>
            <Link href="/" asChild>
              <TouchableOpacity style={styles.homeButton} activeOpacity={0.9}>
                <Home size={20} color="#8B5CF6" />
                <Text style={styles.homeButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#E5E7EB",
    textAlign: "center",
    marginBottom: 32,
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#8B5CF6",
  },
});
