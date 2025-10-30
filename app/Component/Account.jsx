import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../auth/firebase';
import { checkAdminAccess } from '../admin/AdminAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';

const Account = ({ onLogout, onAdminPanelPress, onProfilePress, userEmail }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await checkAdminAccess();
      setIsAdmin(adminStatus);
    };
    
    checkAdmin();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
        {isAdmin && (
          <View style={styles.adminBadge}>
            <MaterialIcons name="admin-panel-settings" size={20} color="#E96E6E" />
            <Text style={styles.adminText}>Admin</Text>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.userEmail}>{userEmail || 'User'}</Text>
      </View>

      <View style={styles.menuContainer}>
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={onAdminPanelPress}
          >
            <View style={styles.menuItemLeft}>
              <MaterialIcons name="admin-panel-settings" size={24} color="#E96E6E" />
              <Text style={styles.adminButtonText}>Admin Panel</Text>
            </View>
            <AntDesign name="right" size={16} color="#E96E6E" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="person" size={24} color="#666" />
            <Text style={styles.menuItemText}>Profile Settings</Text>
          </View>
          <AntDesign name="right" size={16} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="history" size={24} color="#666" />
            <Text style={styles.menuItemText}>Order History</Text>
          </View>
          <AntDesign name="right" size={16} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="notifications" size={24} color="#666" />
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <AntDesign name="right" size={16} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="help" size={24} color="#666" />
            <Text style={styles.menuItemText}>Help & Support</Text>
          </View>
          <AntDesign name="right" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          try {
            await signOut(auth);
            onLogout && onLogout();
          } catch (error) {
            console.error('Logout Error:', error.message);
          }
        }}
      >
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff3f8',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E96E6E',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  adminText: {
    fontSize: 14,
    color: '#E96E6E',
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: '#e0e0e0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E96E6E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#e0e0e0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff5f7',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  adminButtonText: {
    fontSize: 16,
    color: '#E96E6E',
    fontWeight: '600',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#E96E6E',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffb6d5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
