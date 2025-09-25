import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ClipboardList, QrCode } from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";

export default function AdminScreen() {
  const { user } = useAuth();
  const { orders } = useOrderStore();

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <Text style={styles.unauthorizedText}>Access Denied</Text>
          <Text style={styles.unauthorizedSubtext}>
            You don&apos;t have admin privileges
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingOrders = orders.filter((order) => order.status === "pending");
  const approvedOrders = orders.filter((order) => order.status === "approved");
  const totalRevenue = approvedOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  const adminActions = [
    {
      id: "orders",
      title: "Pending Orders",
      subtitle: `${pendingOrders.length} orders awaiting approval`,
      icon: ClipboardList,
      color: "#F59E0B",
      onPress: () => router.push("/admin/orders"),
    },
    {
      id: "scanner",
      title: "QR Scanner",
      subtitle: "Scan tickets at event entrance",
      icon: QrCode,
      color: "#8B5CF6",
      onPress: () => router.push("/admin/scanner"),
    },
  ];

  const stats = [
    {
      label: "Total Orders",
      value: orders.length.toString(),
      color: "#3B82F6",
    },
    {
      label: "Pending",
      value: pendingOrders.length.toString(),
      color: "#F59E0B",
    },
    {
      label: "Approved",
      value: approvedOrders.length.toString(),
      color: "#10B981",
    },
    {
      label: "Revenue",
      value: `$${totalRevenue.toFixed(0)}`,
      color: "#8B5CF6",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#8B5CF6", "#3B82F6"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage events and orders</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          {adminActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.9}
            >
              <View style={styles.actionContent}>
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: `${action.color}20` },
                  ]}
                >
                  <action.icon size={24} color={action.color} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#E5E7EB",
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  unauthorizedText: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#EF4444",
    marginBottom: 8,
  },
  unauthorizedSubtext: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold" as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  actionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1F2937",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
});