import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Minus, Plus } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { mockEvents } from "@/data/mock-events";
import { useAuth } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import { ordersAPI } from "@/services/api"; // Import your API
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckoutScreen() {
  const { eventId } = useLocalSearchParams();
  const { user } = useAuth();
  const { addOrder } = useOrderStore();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const event = mockEvents.find((e) => e.id === eventId);

  if (!event || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Event not found</Text>
      </SafeAreaView>
    );
  }

  const totalAmount = event.price * quantity;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setIsLoading(true);
      
      // Create order via API
      const orderData = {
        event_id: event.id,
        quantity: quantity,
        payment_method: "mobile_money", // or whatever payment method you're using
      };

      const response = await ordersAPI.createOrder(orderData);
      const createdOrder = response.data;

      // Store the order locally as well (optional, for offline access)
      const localOrderData = {
        id: createdOrder.id,
        userId: user.id,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        quantity,
        totalAmount: parseFloat(createdOrder.total_amount),
        status: createdOrder.status,
        createdAt: createdOrder.created_at,
        orderId: createdOrder.order_id,
      };

      addOrder(localOrderData);

      // Navigate to payment instructions screen with order details
      router.push({
        pathname: "/payment-instructions",
        params: {
          orderId: createdOrder.order_id,
          totalAmount: createdOrder.total_amount,
          eventTitle: event.title,
        }
      });

    } catch (error: any) {
      console.error('Error creating order:', error);
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Order Failed', errorMessage, [
        { text: 'OK', style: 'default' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDetails}>
            {new Date(event.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text style={styles.eventLocation}>{event.location}</Text>
        </View>

        <View style={styles.quantityCard}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || isLoading}
            >
              <Minus
                size={20}
                color={quantity <= 1 || isLoading ? "#9CA3AF" : "#1F2937"}
              />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(1)}
              disabled={quantity >= 10 || isLoading}
            >
              <Plus
                size={20}
                color={quantity >= 10 || isLoading ? "#9CA3AF" : "#1F2937"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ticket Price</Text>
            <Text style={styles.summaryValue}>GHC{event.price}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity</Text>
            <Text style={styles.summaryValue}>{quantity}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotalValue}>GHC{totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, isLoading && styles.disabledButton]}
          onPress={handlePlaceOrder}
          activeOpacity={0.9}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ["#9CA3AF", "#6B7280"] : ["#8B5CF6", "#3B82F6"]}
            style={styles.placeOrderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.placeOrderText, { marginLeft: 8 }]}>
                  Placing Order...
                </Text>
              </View>
            ) : (
              <Text style={styles.placeOrderText}>
                Place Order - GHC{totalAmount}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1F2937",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#1F2937",
    marginBottom: 8,
  },
  eventDetails: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: "#6B7280",
  },
  quantityCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1F2937",
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#1F2937",
    minWidth: 40,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  summaryDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: "#1F2937",
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#8B5CF6",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  placeOrderButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  disabledButton: {
    opacity: 0.7,
  },
  placeOrderGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});