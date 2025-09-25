import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Copy,
  CreditCard,
  Smartphone,
  Clock,
  CheckCircle,
  Upload,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ordersAPI, paymentAPI } from '@/services/api';
import Clipboard from 'expo-clipboard';

export default function PaymentInstructionsScreen() {
  const { orderId, totalAmount, eventTitle } = useLocalSearchParams();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'confirmed'>('pending');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch payment methods
        const methodsResponse = await paymentAPI.getPaymentMethods();
        setPaymentMethods(methodsResponse.data);
        setSelectedPaymentMethod(methodsResponse.data[0]?.id || null);
        setLoadingMethods(false);

        // Fetch order to check payment confirmation
        const orderResponse = await ordersAPI.getOrder(orderId as string);
        const validStatus = orderResponse.data.payment_confirmation
          ? 'paid'
          : (['pending', 'paid', 'confirmed', 'approved', 'rejected'] as const).includes(orderResponse.data.status)
          ? (['approved', 'rejected'].includes(orderResponse.data.status)
              ? 'pending'
              : (orderResponse.data.status as 'pending' | 'paid' | 'confirmed'))
          : 'pending';
        setPaymentStatus(validStatus);
        if (orderResponse.data.payment_confirmation?.transaction_id) {
          setTransactionId(orderResponse.data.payment_confirmation.transaction_id);
        }
      } catch (error: any) {
        Alert.alert('Error', 'Failed to load payment methods or order status.');
        setLoadingMethods(false);
      }
    };
    fetchData();
  }, [orderId]);

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  const handlePaymentStatusCheck = async () => {
    try {
      const response = await ordersAPI.getOrder(orderId as string);
      const validStatus = response.data.payment_confirmation
        ? 'paid'
        : (['pending', 'paid', 'confirmed'] as const).includes(response.data.status as 'pending' | 'paid' | 'confirmed')
        ? (response.data.status as 'pending' | 'paid' | 'confirmed')
        : 'pending';
      setPaymentStatus(validStatus);
      Alert.alert('Payment Status', `Your payment is ${response.data.status}.`);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to check payment status. Please try again.');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setScreenshot(result.assets[0]);
    }
  };

  const handleSubmitProof = async () => {
    if (!transactionId.trim()) {
      Alert.alert('Error', 'Please enter a transaction ID.');
      return;
    }

    setSubmitting(true);
    setSubmissionMessage(null);
    try {
      await paymentAPI.submitPaymentConfirmation(orderId as string, transactionId, screenshot);
      setPaymentStatus('paid');
      setSubmissionMessage('Payment proof submitted successfully! Awaiting admin approval.');
      setTransactionId('');
      setScreenshot(null);
    } catch (error: any) {
      setSubmissionMessage(error.response?.data?.error || 'Failed to submit payment proof.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPaymentDetails = () => {
    const method = paymentMethods.find((m) => m.id === selectedPaymentMethod);
    if (!method) return null;

    if (method.type === 'bank') {
      return (
        <View style={styles.paymentDetailsCard}>
          <Text style={styles.paymentDetailsTitle}>Bank Transfer Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Name:</Text>
            <View style={styles.detailValue}>
              <Text style={styles.detailText}>{method.details.account_name}</Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(method.details.account_name, 'Account Name')}
                style={styles.copyButton}
              >
                <Copy size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Number:</Text>
            <View style={styles.detailValue}>
              <Text style={styles.detailText}>{method.details.account_number}</Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(method.details.account_number, 'Account Number')}
                style={styles.copyButton}
              >
                <Copy size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bank:</Text>
            <Text style={styles.detailText}>{method.details.bank_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Branch:</Text>
            <Text style={styles.detailText}>{method.details.branch}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.paymentDetailsCard}>
          <Text style={styles.paymentDetailsTitle}>Mobile Money Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>MoMo Number:</Text>
            <View style={styles.detailValue}>
              <Text style={styles.detailText}>{method.details.number}</Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(method.details.number, 'MoMo Number')}
                style={styles.copyButton}
              >
                <Copy size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailText}>{method.details.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network:</Text>
            <Text style={styles.detailText}>{method.details.network}</Text>
          </View>
        </View>
      );
    }
  };

  if (loadingMethods) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/tickets')}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Instructions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <CheckCircle size={24} color="#10B981" />
            <Text style={styles.orderTitle}>Order Placed Successfully!</Text>
          </View>
          <View style={styles.orderDetail}>
            <Text style={styles.orderLabel}>Order ID:</Text>
            <View style={styles.orderValue}>
              <Text style={styles.orderText}>{orderId}</Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(orderId as string, 'Order ID')}
                style={styles.copyButton}
              >
                <Copy size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.orderDetail}>
            <Text style={styles.orderLabel}>Event:</Text>
            <Text style={styles.orderText}>{eventTitle}</Text>
          </View>
          <View style={styles.orderDetail}>
            <Text style={styles.orderLabel}>Amount:</Text>
            <Text style={styles.orderAmount}>GHC{totalAmount}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Clock size={20} color={paymentStatus === 'confirmed' ? '#10B981' : '#F59E0B'} />
            <Text
              style={[
                styles.statusText,
                { color: paymentStatus === 'confirmed' ? '#10B981' : '#92400E' },
              ]}
            >
              {paymentStatus === 'confirmed' ? 'Payment Confirmed' : paymentStatus === 'paid' ? 'Payment Submitted' : 'Payment Pending'}
            </Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.paymentMethodCard}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                selectedPaymentMethod === method.id && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}
              disabled={paymentStatus !== 'pending'}
            >
              <View style={styles.paymentOptionContent}>
                <View
                  style={[
                    styles.paymentIcon,
                    selectedPaymentMethod === method.id && styles.paymentIconSelected,
                  ]}
                >
                  {method.type === 'bank' ? (
                    <CreditCard
                      size={20}
                      color={selectedPaymentMethod === method.id ? '#8B5CF6' : '#6B7280'}
                    />
                  ) : (
                    <Smartphone
                      size={20}
                      color={selectedPaymentMethod === method.id ? '#8B5CF6' : '#6B7280'}
                    />
                  )}
                </View>
                <View style={styles.paymentText}>
                  <Text
                    style={[
                      styles.paymentTitle,
                      selectedPaymentMethod === method.id && styles.paymentTitleSelected,
                    ]}
                  >
                    {method.name}
                  </Text>
                  <Text style={styles.paymentSubtitle}>
                    {method.type === 'bank' ? 'Transfer to our bank account' : 'Pay with Mobile Money'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedPaymentMethod === method.id && styles.radioButtonSelected,
                ]}
              >
                {selectedPaymentMethod === method.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Details */}
        {renderPaymentDetails()}

        {/* Payment Proof Submission */}
        {paymentStatus === 'pending' && (
          <View style={styles.paymentDetailsCard}>
            <Text style={styles.paymentDetailsTitle}>Submit Payment Proof</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Transaction ID"
              value={transactionId}
              onChangeText={setTransactionId}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.uploadButton, screenshot && styles.uploadButtonSuccess]}
              onPress={pickImage}
            >
              <Upload size={20} color={screenshot ? '#10B981' : '#8B5CF6'} />
              <Text style={styles.uploadButtonText}>
                {screenshot ? 'Screenshot Selected' : 'Upload Payment Screenshot'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitProof}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>Submit Payment Proof</Text>
            </TouchableOpacity>
            {submissionMessage && (
              <Text
                style={[
                  styles.submissionMessage,
                  submissionMessage.includes('successfully')
                    ? styles.submissionSuccess
                    : styles.submissionError,
                ]}
              >
                {submissionMessage}
              </Text>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Payment Instructions</Text>
          <Text style={styles.instructionText}>
            1. Use your Order ID ({orderId}) as the payment reference
          </Text>
          <Text style={styles.instructionText}>
            2. Transfer the exact amount of GHC{totalAmount}
          </Text>
          <Text style={styles.instructionText}>
            3. Enter your transaction ID and upload a screenshot of your payment confirmation
          </Text>
          <Text style={styles.instructionText}>
            4. Wait for admin approval (usually within 2-4 hours)
          </Text>
          <Text style={styles.instructionText}>
            5. Your ticket will be activated once payment is confirmed
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkStatusButton}
          onPress={handlePaymentStatusCheck}
          activeOpacity={0.9}
        >
          <Text style={styles.checkStatusText}>Check Payment Status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewTicketsButton}
          onPress={() => router.push('/(tabs)/tickets')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.viewTicketsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.viewTicketsText}>View My Tickets</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#10B981',
    marginLeft: 8,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  orderValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  orderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginRight: 8,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#8B5CF6',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentIconSelected: {
    backgroundColor: '#EDE9FE',
  },
  paymentText: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentTitleSelected: {
    color: '#8B5CF6',
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#8B5CF6',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  paymentDetailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  paymentDetailsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  checkStatusButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  checkStatusText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8B5CF6',
  },
  viewTicketsButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewTicketsGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  viewTicketsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: '#1F2937',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  uploadButtonSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  submissionMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  submissionSuccess: {
    color: '#10B981',
  },
  submissionError: {
    color: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
});