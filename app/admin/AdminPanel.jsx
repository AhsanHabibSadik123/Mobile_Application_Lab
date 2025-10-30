import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import { db } from "../../auth/firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";

const { width } = Dimensions.get("window");

const AdminPanel = ({ onBack, onNavigate }) => {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch data from Firestore
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products count
      const productsSnapshot = await getDocs(collection(db, 'products'));
      setTotalProducts(productsSnapshot.size);
      
      // Fetch orders count
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      setTotalOrders(ordersSnapshot.size);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up real-time listeners
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setTotalProducts(snapshot.size);
    });
    
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setTotalOrders(snapshot.size);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

  const adminOptions = [
    {
      id: 1,
      title: "Manage Products",
      description: "Add, edit, and delete products",
      icon: "shoppingcart",
      color: "#4CAF50",
      screen: "ProductManagement",
    },
    {
      id: 2,
      title: "Order Management",
      description: "View and manage customer orders",
      icon: "filetext1",
      color: "#2196F3",
      screen: "OrderManagement",
    },
  ];

  const renderAdminCard = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.adminCard, { borderLeftColor: option.color }]}
      onPress={() => onNavigate(option.screen)}
    >
      <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
        <AntDesign name={option.icon} size={24} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{option.title}</Text>
        <Text style={styles.cardDescription}>{option.description}</Text>
      </View>
      <AntDesign name="right" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Panel</Text>
        <View style={styles.adminBadge}>
          <MaterialIcons name="admin-panel-settings" size={20} color="#E96E6E" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome, Admin!</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your e-commerce store from here
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            {loading ? (
              <ActivityIndicator size="small" color="#E96E6E" />
            ) : (
              <Text style={styles.statNumber}>{totalProducts}</Text>
            )}
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={styles.statCard}>
            {loading ? (
              <ActivityIndicator size="small" color="#E96E6E" />
            ) : (
              <Text style={styles.statNumber}>{totalOrders}</Text>
            )}
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Management Tools</Text>
        </View>

        <View style={styles.adminCardsContainer}>
          {adminOptions.map(renderAdminCard)}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionButtons}>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: "#4CAF50" }]}
              onPress={() => onNavigate("AddProduct")}
            >
              <AntDesign name="plus" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: "#2196F3" }]}
              onPress={() => onNavigate("OrderManagement")}
            >
              <Feather name="list" size={20} color="#fff" />
              <Text style={styles.quickActionText}>View Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminPanel;

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
  adminBadge: {
    position: "absolute",
    right: 18,
    top: 48,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff0f3",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#E96E6E",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  adminCardsContainer: {
    marginBottom: 24,
  },
  adminCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  quickActionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
