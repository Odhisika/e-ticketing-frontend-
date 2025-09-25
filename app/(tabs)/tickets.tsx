import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Calendar, MapPin, Clock, Download } from 'lucide-react-native';
import { useAuth } from '@/store/auth-store';
import { useTicketStore } from '@/store/ticket-store';
import { router } from 'expo-router';

export default function TicketsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { tickets, isLoading: ticketsLoading, error, fetchUserTickets } = useTicketStore();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    } else if (user) {
      fetchUserTickets();
    }
  }, [user, authLoading]);

  if (authLoading || ticketsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>My Tickets</Text>
        </LinearGradient>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Error Loading Tickets</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.browseButton} onPress={fetchUserTickets}>
            <Text style={styles.browseButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const userTickets = tickets.filter((ticket) => ticket.order); // Ensure ticket has order data

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const reconstructQRData = (ticket: any) => {
    return JSON.stringify({
      ticket_id: ticket.ticket_id,
      event_id: ticket.order.event.id,
      user_id: user.id,
      order_id: ticket.order.id,
    });
  };

  const handleDownloadTicket = (ticketId: string) => {
    Alert.alert('Download', `Ticket ${ticketId.slice(-8)} saved to your device`);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'approved':
        return { dotColor: '#10B981', textColor: '#10B981', text: 'Approved' };
      case 'pending':
        return { dotColor: '#F59E0B', textColor: '#F59E0B', text: 'Pending' };
      case 'rejected':
        return { dotColor: '#EF4444', textColor: '#EF4444', text: 'Rejected' };
      default:
        return { dotColor: '#6B7280', textColor: '#6B7280', text: 'Unknown' };
    }
  };

  if (userTickets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>My Tickets</Text>
        </LinearGradient>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No tickets yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse events and book your first ticket
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.browseButtonText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#3B82F6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>My Tickets</Text>
        <Text style={styles.headerSubtitle}>
          {userTickets.length} ticket{userTickets.length !== 1 ? 's' : ''}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {userTickets.map((ticket) => {
          const { dotColor, textColor, text: statusText } = getStatusStyles(ticket.order.status);
          const qrData = reconstructQRData(ticket);

          return (
            <View key={ticket.id} style={styles.ticketCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.ticketGradient}
              >
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketInfo}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {ticket.order.event.title}
                    </Text>
                    <View style={styles.ticketDetails}>
                      <View style={styles.detailRow}>
                        <Calendar size={16} color="#6B7280" />
                        <Text style={styles.detailText}>
                          {formatDate(ticket.order.event.date)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={16} color="#6B7280" />
                        <Text style={styles.detailText}>
                          {formatTime(ticket.order.event.date)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MapPin size={16} color="#6B7280" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {ticket.order.event.location}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownloadTicket(ticket.ticket_id)}
                  >
                    <Download size={20} color="#8B5CF6" />
                  </TouchableOpacity>
                </View>

                <View style={styles.qrContainer}>
                  <QRCode value={qrData} size={120} />
                  <Text style={styles.ticketId}>#{ticket.ticket_id.slice(-8)}</Text>
                </View>

                <View style={styles.ticketFooter}>
                  <View style={styles.statusContainer}>
                    <View
                      style={[styles.statusDot, { backgroundColor: dotColor }]}
                    />
                    <Text style={[styles.statusText, { color: textColor }]}>
                      {statusText}
                    </Text>
                    {ticket.is_used && <Text style={[styles.statusText, { color: '#EF4444' }]}> (Used)</Text>}
                  </View>
                  <Text style={styles.quantityText}>Qty: {ticket.order.quantity}</Text>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles (unchanged)
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
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  ticketCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  ticketGradient: {
    padding: 20,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#1F2937",
    marginBottom: 12,
  },
  ticketDetails: {
    gap: 6,
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
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  ticketId: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    fontFamily: "monospace",
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  quantityText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600" as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
});