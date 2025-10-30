import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { db } from "../../auth/firebase";
import { collection, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";

const OrderManagement = ({ onBack, orders = [] }) => {
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch orders from Firestore
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const fetchedOrders = [];
      
      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        fetchedOrders.push({
          id: doc.id,
          docId: doc.id,
          customerName: orderData.deliveryAddress?.fullName || 'Unknown Customer',
          customerEmail: orderData.userEmail || 'No Email',
          items: orderData.items || [],
          totalAmount: orderData.totalAmount || 0,
          orderDate: orderData.orderDate ? new Date(orderData.orderDate).toLocaleDateString() : 'Unknown Date',
          orderDateRaw: orderData.orderDate || new Date().toISOString(), // Keep raw date for sorting
          status: orderData.status || 'pending',
          paymentMethod: orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : orderData.paymentMethod,
          deliveryAddress: orderData.deliveryAddress ? 
            `${orderData.deliveryAddress.address}, ${orderData.deliveryAddress.city}, ${orderData.deliveryAddress.postalCode}` : 
            'No Address',
          phoneNumber: orderData.deliveryAddress?.phoneNumber || 'No Phone',
          userId: orderData.userId || null,
          estimatedDelivery: orderData.estimatedDelivery || null
        });
      });
      
      // Sort orders by date (newest first) using raw date
      fetchedOrders.sort((a, b) => new Date(b.orderDateRaw) - new Date(a.orderDateRaw));
      setOrderList(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time listener for orders
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        const orderData = doc.data();
        orders.push({
          id: doc.id,
          docId: doc.id,
          customerName: orderData.deliveryAddress?.fullName || 'Unknown Customer',
          customerEmail: orderData.userEmail || 'No Email',
          items: orderData.items || [],
          totalAmount: orderData.totalAmount || 0,
          orderDate: orderData.orderDate ? new Date(orderData.orderDate).toLocaleDateString() : 'Unknown Date',
          orderDateRaw: orderData.orderDate || new Date().toISOString(), // Keep raw date for sorting
          status: orderData.status || 'pending',
          paymentMethod: orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : orderData.paymentMethod,
          deliveryAddress: orderData.deliveryAddress ? 
            `${orderData.deliveryAddress.address}, ${orderData.deliveryAddress.city}, ${orderData.deliveryAddress.postalCode}` : 
            'No Address',
          phoneNumber: orderData.deliveryAddress?.phoneNumber || 'No Phone',
          userId: orderData.userId || null,
          estimatedDelivery: orderData.estimatedDelivery || null
        });
      });
      
      // Sort orders by date (newest first) using raw date
      orders.sort((a, b) => new Date(b.orderDateRaw) - new Date(a.orderDateRaw));
      setOrderList(orders);
    });

    return () => unsubscribe();
  }, []);

  const statusColors = {
    pending: "#FF9800",
    processing: "#2196F3",
    shipped: "#9C27B0",
    delivered: "#4CAF50",
    cancelled: "#f44336",
  };

  const statusOptions = [
    { key: "all", label: "All Orders" },
    { key: "pending", label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const filteredOrders = orderList.filter(
    (order) => filterStatus === "all" || order.status === filterStatus
  );

  const updateOrderStatus = async (orderId, newStatus) => {
    Alert.alert(
      "Update Order Status",
      `Change status to "${newStatus}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            try {
              // Update in Firestore
              await updateDoc(doc(db, 'orders', orderId), {
                status: newStatus,
                updatedAt: new Date().toISOString()
              });
              
              // Update local state
              setOrderList(
                orderList.map((order) =>
                  order.id === orderId ? { ...order, status: newStatus } : order
                )
              );
              Alert.alert("Success", "Order status updated successfully!");
            } catch (error) {
              console.error('Error updating order status:', error);
              Alert.alert("Error", "Failed to update order status. Please try again.");
            }
          },
        },
      ]
    );
  };

  const getOrderStats = () => {
    const stats = {
      total: orderList.length,
      pending: orderList.filter((o) => o.status === "pending").length,
      processing: orderList.filter((o) => o.status === "processing").length,
      shipped: orderList.filter((o) => o.status === "shipped").length,
      delivered: orderList.filter((o) => o.status === "delivered").length,
    };
    return stats;
  };

  const stats = getOrderStats();

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}</Text>
          <Text style={styles.orderDate}>{item.orderDate}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[item.status] },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.customerEmail}>{item.customerEmail}</Text>
        <Text style={styles.customerPhone}>📞 {item.phoneNumber}</Text>
        <Text style={styles.deliveryAddress}>📍 {item.deliveryAddress}</Text>
      </View>

      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Items ({item.items.length}):</Text>
        {item.items.map((product, index) => (
          <View key={index} style={styles.productRow}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.title}</Text>
              <Text style={styles.productPrice}>${(product.price || 0).toFixed(2)}</Text>
              <Text style={styles.productQuantity}>Qty: {product.quantity || 1}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total: </Text>
          <Text style={styles.totalAmount}>${(item.totalAmount || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.paymentMethod}>
          <Text style={styles.paymentText}>{item.paymentMethod}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionBtn, 
            { backgroundColor: item.status === "delivered" ? "#ccc" : "#2196F3" }
          ]}
          onPress={() => updateOrderStatus(item.id, "processing")}
          disabled={item.status === "delivered"}
        >
          <MaterialIcons name="autorenew" size={16} color="#fff" />
          <Text style={styles.actionText}>Process</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn, 
            { backgroundColor: item.status === "delivered" ? "#ccc" : "#9C27B0" }
          ]}
          onPress={() => updateOrderStatus(item.id, "shipped")}
          disabled={item.status === "delivered"}
        >
          <MaterialIcons name="local-shipping" size={16} color="#fff" />
          <Text style={styles.actionText}>Ship</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn, 
            { backgroundColor: item.status === "delivered" ? "#ccc" : "#4CAF50" }
          ]}
          onPress={() => updateOrderStatus(item.id, "delivered")}
          disabled={item.status === "delivered"}
        >
          <MaterialIcons name="check-circle" size={16} color="#fff" />
          <Text style={styles.actionText}>Deliver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Management</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E96E6E" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <>
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.delivered}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
          </View>

          {/* Filter Section */}
          <View style={styles.filterContainer}>
            <FlatList
              horizontal
              data={statusOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === item.key && styles.activeFilterButton,
                  ]}
                  onPress={() => setFilterStatus(item.key)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filterStatus === item.key && styles.activeFilterText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
          </View>

          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.ordersList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#E96E6E']}
                tintColor="#E96E6E"
              />
            }
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="shopping-basket" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No orders found</Text>
                  <Text style={styles.emptySubtext}>
                    Orders will appear here once customers place them
                  </Text>
                </View>
              )
            }
          />
        </>
      )}
    </View>
  );
};

export default OrderManagement;

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
    fontSize: 20,
    fontWeight: "bold",
    color: "#E96E6E",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff3f8",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E96E6E",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  activeFilterButton: {
    backgroundColor: "#E96E6E",
    borderColor: "#E96E6E",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#fff",
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  customerInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  customerEmail: {
    fontSize: 14,
    color: "#666",
  },
  customerPhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  deliveryAddress: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  itemsSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  productPrice: {
    fontSize: 14,
    color: "#E96E6E",
    fontWeight: "600",
  },
  productQuantity: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    color: "#333",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E96E6E",
  },
  paymentMethod: {
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
