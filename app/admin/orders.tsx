import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, MapPin, Clock, Check, X } from "lucide-react-native";
import { useOrderStore } from "@/store/order-store";
import { useTicketStore } from "@/store/ticket-store";

export default function AdminOrdersScreen() {
  const { orders, updateOrderStatus } = useOrderStore();
  const { addTicket } = useTicketStore();

  const pendingOrders = orders.filter((order) => order.status === "pending");

  const handleApproveOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    Alert.alert(
      "Approve Order",
      `Approve order ${orderId}?\n\nThis will generate tickets for the customer.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: () => {
            updateOrderStatus(orderId, "approved");
            
            // Generate tickets
            for (let i = 0; i < order.quantity; i++) {
              const ticketId = `${orderId}-${i + 1}`;
              addTicket({
                id: ticketId,
                userId: order.userId,
                orderId: order.id,
                eventTitle: order.eventTitle,
                eventDate: order.eventDate,
                eventLocation: order.eventLocation,
                quantity: order.quantity,
                status: "valid",
                createdAt: new Date().toISOString(),
              });
            }

            Alert.alert("Success", "Order approved and tickets generated!");
          },
        },
      ]
    );
  };

  const handleRejectOrder = (orderId: string) => {
    Alert.alert(
      "Reject Order",
      `Reject order ${orderId}?\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            updateOrderStatus(orderId, "rejected");
            Alert.alert("Order Rejected", "The order has been rejected.");
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (pendingOrders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Pending Orders</Text>
          <Text style={styles.emptySubtitle}>
            All orders have been processed
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {pendingOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{order.id.slice(-8)}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Pending</Text>
              </View>
            </View>

            <Text style={styles.eventTitle}>{order.eventTitle}</Text>

            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  {formatDate(order.eventDate)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  {formatTime(order.eventDate)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {order.eventLocation}
                </Text>
              </View>
            </View>

            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantity:</Text>
                <Text style={styles.summaryValue}>{order.quantity}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment Method:</Text>
                <Text style={styles.summaryValue}>
                  {order.paymentMethod === "bank" ? "Bank Transfer" : "Mobile Money"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount:</Text>
                <Text style={styles.summaryTotal}>${order.totalAmount}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectOrder(order.id)}
              >
                <X size={16} color="#FFFFFF" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApproveOrder(order.id)}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
    fontFamily: "monospace",
  },
  statusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#D97706",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#1F2937",
    marginBottom: 12,
  },
  orderDetails: {
    gap: 6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  orderSummary: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1F2937",
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: "#8B5CF6",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});