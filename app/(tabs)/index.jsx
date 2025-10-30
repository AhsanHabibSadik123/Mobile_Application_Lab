// This index.jsx file
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../auth/firebase';
import Account from '../Component/Account';
import Cart from '../Component/Cart';
import Home from '../Component/Home';
import Login from '../Component/Login';
import Notification from '../Component/Notification';
import ProductDetailsScreen from '../Component/ProductDetailsScreen';
import Register from '../Component/Register';
import Payment from '../Component/payment';
import AdminPanel from '../admin/AdminPanel';
import OrderManagement from '../admin/OrderManagement';
import ProductManagement from '../admin/ProductManagement';
import { registerForPushNotificationsAsync, scheduleLocalNotification } from '../services/notificationService';

const TABS = [
  { name: 'Home', component: Home },
  { name: 'Notification', component: Notification },
  { name: 'Cart', component: Cart },
  { name: 'Account', component: Account },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [lastViewedProduct, setLastViewedProduct] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [adminScreen, setAdminScreen] = useState(null);
  const [currentUid, setCurrentUid] = useState(null);
  const statusMapRef = useRef({});
  const initialLoadRef = useRef(true);

  // Track auth user and register for notifications
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUid(user?.uid || null);
      if (user?.uid) {
        // Register and save the push token
        await registerForPushNotificationsAsync();
      }
    });
    return () => unsubAuth();
  }, []);

  // Listen for order status updates for the logged-in user
  useEffect(() => {
    if (!currentUid) return;
    const q = query(collection(db, 'orders'), where('userId', '==', currentUid));
    const unsub = onSnapshot(q, async (snapshot) => {
      // Build/compare status map
      for (const change of snapshot.docChanges()) {
        const id = change.doc.id;
        const data = change.doc.data();
        const newStatus = data?.status;
        const prevStatus = statusMapRef.current[id];
        statusMapRef.current[id] = newStatus;

        if (!initialLoadRef.current && change.type !== 'removed' && prevStatus && newStatus && prevStatus !== newStatus) {
          // Local notification
          await scheduleLocalNotification({
            title: 'Order status updated',
            body: `Your order is now ${newStatus}.`,
            data: { orderId: id, status: newStatus },
          });
          // Persist in user's notifications
          await addDoc(collection(db, 'users', currentUid, 'notifications'), {
            title: 'Order status updated',
            body: `Your order is now ${newStatus}.`,
            orderId: id,
            status: newStatus,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
      if (initialLoadRef.current) initialLoadRef.current = false;
    });
    return () => {
      initialLoadRef.current = true;
      statusMapRef.current = {};
      unsub();
    };
  }, [currentUid]);

  const activeTabInfo = TABS.find(tab => tab.name === activeTab);
  const ActiveComponent = activeTabInfo ? activeTabInfo.component : () => <Text>Invalid Tab</Text>;

if (!isLoggedIn && isRegistering) {
  return <Register onRegister={(email) => {
    setIsLoggedIn(true);
    setIsRegistering(false);
    setActiveTab('Home');
    setUserEmail(email);
  }} onBackToLogin={() => setIsRegistering(false)} />;
}

if (!isLoggedIn) {
  return <Login onLogin={(email) => { 
    setIsLoggedIn(true); 
    setActiveTab('Home'); 
    setUserEmail(email);
  }} onRegisterPress={() => setIsRegistering(true)} />;
}

  if (selectedProduct) {
    return (
      <ProductDetailsScreen
        product={selectedProduct}
        onBack={() => {
          setSelectedProduct(null);
          setActiveTab('Home');
        }}
        onAddToCart={(product, selectedSize, selectedColor) => {
          setCart([
            ...cart,
            {
              ...product,
              selectedSize,
              selectedColor,
            },
          ]);
          setLastViewedProduct(product);
          setSelectedProduct(null);
          setActiveTab('Cart');
        }}
        onBuyNow={() => {
          setSelectedProduct(null);
        }}
      />
    );
  }

  if (showPayment) {
    return (
      <Payment
        cart={cart}
        onBack={() => {
          setShowPayment(false);
          setActiveTab('Cart');
        }}
        onOrderComplete={() => {
          setCart([]);
          setShowPayment(false);
          setActiveTab('Home');
        }}
      />
    );
  }

  // Admin screens
  if (adminScreen === 'AdminPanel') {
    return (
      <AdminPanel
        onBack={() => {
          setAdminScreen(null);
          setActiveTab('Account');
        }}
        onNavigate={(screen) => setAdminScreen(screen)}
      />
    );
  }

  if (adminScreen === 'ProductManagement') {
    return (
      <ProductManagement
        onBack={() => setAdminScreen('AdminPanel')}
      />
    );
  }

  if (adminScreen === 'OrderManagement') {
    return (
      <OrderManagement
        onBack={() => setAdminScreen('AdminPanel')}
      />
    );
  }

  if (adminScreen === 'AddProduct') {
    return (
      <ProductManagement
        onBack={() => setAdminScreen('AdminPanel')}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffe4ec' }}>
      <View style={{ flex: 1, backgroundColor: '#ffe4ec' }}>
        {activeTab === 'Home' ? (
          <Home
            onBack={() => setIsLoggedIn(false)}
            onProductPress={product => {
              setSelectedProduct(product);
              setLastViewedProduct(product);
            }}
          />
        ) : activeTab === 'Account' ? (
          <Account 
            onLogout={() => {
              setIsLoggedIn(false);
              setUserEmail('');
            }} 
            onAdminPanelPress={() => setAdminScreen('AdminPanel')}
            userEmail={userEmail}
          />
        ) : activeTab === 'Cart' ? (
          <Cart
            onBack={() => {
              if (lastViewedProduct) {
                setSelectedProduct(lastViewedProduct);
              }
            }}
            cart={cart}
            onDeleteItem={idx => {
              setCart(cart.filter((_, i) => i !== idx));
            }}
            onUpdateQuantity={(idx, delta) => {
              setCart(cart.map((item, i) => {
                if (i !== idx) return item;
                const nextQty = Math.max(1, (item.quantity || 1) + delta);
                return { ...item, quantity: nextQty };
              }));
            }}
            onCheckout={() => {
              setShowPayment(true);
            }}
          />
        ) : (
          <ActiveComponent />
        )}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.name)}
          >
            {tab.name === 'Home' && (
              <Feather
                name="home"
                size={24}
                color={activeTab === 'Home' ? '#000' : '#888'}
                style={{ marginBottom: 2 }}
              />
            )}
            {tab.name === 'Notification' && (
              <Octicons
                name="bell"
                size={24}
                color={activeTab === 'Notification' ? '#000' : '#888'}
                style={{ marginBottom: 2 }}
              />
            )}
            {tab.name === 'Cart' && (
              <AntDesign
                name="shoppingcart"
                size={24}
                color={activeTab === 'Cart' ? '#000' : '#888'}
                style={{ marginBottom: 2 }}
              />
            )}
            {tab.name === 'Account' && (
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={activeTab === 'Account' ? '#000' : '#888'}
                style={{ marginBottom: 2 }}
              />
            )}
            <Text
              style={
                activeTab === tab.name ? styles.activeTabText : styles.tabText
              }
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
    paddingBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});