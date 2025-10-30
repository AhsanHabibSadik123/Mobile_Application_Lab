import AntDesign from "@expo/vector-icons/AntDesign";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../auth/firebase";

const Payment = ({ onBack, cart = [], onOrderComplete }) => {
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    postalCode: "",
  });

  // Quantity-aware totals
  const totalPrice = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  const itemsCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Your cart is empty!");
      return;
    }

    // Validate delivery address
    if (!deliveryAddress.fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }
    if (!deliveryAddress.phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    if (!deliveryAddress.address.trim()) {
      Alert.alert("Error", "Please enter your delivery address");
      return;
    }
    if (!deliveryAddress.city.trim()) {
      Alert.alert("Error", "Please enter your city");
      return;
    }
    if (!deliveryAddress.postalCode.trim()) {
      Alert.alert("Error", "Please enter your postal code");
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Create order object
      const orderData = {
        userId: auth.currentUser?.uid || null,
        userEmail: auth.currentUser?.email || null,
        items: cart.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          image: item.image,
          quantity: item.quantity || 1
        })),
        deliveryAddress: {
          fullName: deliveryAddress.fullName.trim(),
          phoneNumber: deliveryAddress.phoneNumber.trim(),
          address: deliveryAddress.address.trim(),
          city: deliveryAddress.city.trim(),
          postalCode: deliveryAddress.postalCode.trim()
        },
        paymentMethod: selectedPayment,
        totalAmount: totalPrice,
        status: "pending",
        orderDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString() // 5 days from now
      };

      // Save order to Firestore
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      // Create a user notification entry (Order placed)
      try {
        const uid = auth.currentUser?.uid;
        if (uid) {
          await addDoc(collection(db, 'users', uid, 'notifications'), {
            title: 'Order placed',
            body: 'Your order has been placed successfully.',
            orderId: docRef.id,
            status: 'pending',
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.warn('Failed to write order notification:', e);
      }
      
      console.log("Order saved with ID: ", docRef.id);

      Alert.alert(
        "Order Confirmation",
        `Your order has been placed successfully!\n\nOrder ID: ${docRef.id}\n\nDelivery To: ${deliveryAddress.fullName}\nAddress: ${deliveryAddress.address}, ${deliveryAddress.city}, ${deliveryAddress.postalCode}\nPhone: ${deliveryAddress.phoneNumber}\n\nTotal Amount: $${totalPrice.toFixed(2)}\nPayment Method: Cash on Delivery\n\nYour order will be delivered within 3-5 business days.`,
        [
          {
            text: "OK",
            onPress: () => {
              onOrderComplete();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error saving order: ", error);
      Alert.alert(
        "Error",
        "Failed to place order. Please try again.",
        [
          {
            text: "OK",
          },
        ]
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({itemsCount}):</Text>
              <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping:</Text>
              <Text style={styles.summaryValue}>FREE</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax:</Text>
              <Text style={styles.summaryValue}>$0.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={deliveryAddress.fullName}
                onChangeText={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, fullName: text })
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={deliveryAddress.phoneNumber}
                onChangeText={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, phoneNumber: text })
                }
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Enter your complete address"
                placeholderTextColor="#999"
                value={deliveryAddress.address}
                onChangeText={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, address: text })
                }
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="City"
                  placeholderTextColor="#999"
                  value={deliveryAddress.city}
                  onChangeText={(text) =>
                    setDeliveryAddress({ ...deliveryAddress, city: text })
                  }
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Postal Code *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Postal Code"
                  placeholderTextColor="#999"
                  value={deliveryAddress.postalCode}
                  onChangeText={(text) =>
                    setDeliveryAddress({ ...deliveryAddress, postalCode: text })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === "cod" && styles.selectedPaymentOption,
            ]}
            onPress={() => setSelectedPayment("cod")}
          >
            <View style={styles.paymentOptionContent}>
              <View style={styles.paymentIconContainer}>
                <AntDesign name="wallet" size={24} color="#E96E6E" />
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentDescription}>
                  Pay when your order is delivered
                </Text>
              </View>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioButton,
                    selectedPayment === "cod" && styles.radioButtonSelected,
                  ]}
                >
                  {selectedPayment === "cod" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Disabled payment options for reference */}
          <View style={[styles.paymentOption, styles.disabledPaymentOption]}>
            <View style={styles.paymentOptionContent}>
              <View style={styles.paymentIconContainer}>
                <AntDesign name="creditcard" size={24} color="#ccc" />
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={[styles.paymentTitle, styles.disabledText]}>
                  Credit/Debit Card
                </Text>
                <Text style={[styles.paymentDescription, styles.disabledText]}>
                  Coming soon...
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.paymentOption, styles.disabledPaymentOption]}>
            <View style={styles.paymentOptionContent}>
              <View style={styles.paymentIconContainer}>
                <AntDesign name="mobile1" size={24} color="#ccc" />
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={[styles.paymentTitle, styles.disabledText]}>
                  Digital Wallet
                </Text>
                <Text style={[styles.paymentDescription, styles.disabledText]}>
                  Coming soon...
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.deliveryCard}>
            <View style={styles.deliveryRow}>
              <AntDesign name="clockcircle" size={20} color="#E96E6E" />
              <Text style={styles.deliveryText}>
                Estimated delivery: 3-5 business days
              </Text>
            </View>
            <View style={styles.deliveryRow}>
              <AntDesign name="checkcircle" size={20} color="#4CAF50" />
              <Text style={styles.deliveryText}>Free shipping on all orders</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.placeOrderButton,
            isPlacingOrder && styles.placeOrderButtonDisabled
          ]} 
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
        >
          <Text style={styles.placeOrderButtonText}>
            {isPlacingOrder 
              ? "Placing Order..." 
              : `Place Order - $${totalPrice.toFixed(2)}`
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Payment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff3f8",
  },
  header: {
    width: "100%",
    paddingTop: 48,
    paddingBottom: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f2c6d6",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#f2c6d6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    flexDirection: "row",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 18,
    top: 44,
    width: 44,
    height: 44,
    backgroundColor: "#E96E6E",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffb6d5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#E96E6E",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E96E6E",
  },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  multilineInput: {
    height: 80,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  paymentOption: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#f0f0f0",
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPaymentOption: {
    borderColor: "#E96E6E",
    backgroundColor: "#fff5f7",
  },
  disabledPaymentOption: {
    opacity: 0.5,
    backgroundColor: "#f8f8f8",
  },
  paymentOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff0f3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: "#666",
  },
  disabledText: {
    color: "#ccc",
  },
  radioContainer: {
    marginLeft: 16,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#E96E6E",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E96E6E",
  },
  deliveryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deliveryText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  placeOrderButton: {
    backgroundColor: "#E96E6E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffb6d5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  placeOrderButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});