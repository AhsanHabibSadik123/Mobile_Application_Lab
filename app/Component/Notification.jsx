import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../auth/firebase';

const Notification = () => {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const q = query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const out = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(out);
    });
    return () => unsub();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const markAllRead = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const q = query(collection(db, 'users', uid, 'notifications'));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => updateDoc(doc(db, 'users', uid, 'notifications', d.id), { read: true })));
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.read && styles.cardRead]}>
      <Text style={styles.title}>{item.title || 'Notification'}</Text>
      <Text style={styles.body}>{item.body}</Text>
      {item.status ? <Text style={styles.meta}>Status: {item.status}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead} style={styles.readAllBtn}>
          <Text style={styles.readAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff3f8' },
  header: {
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2c6d6',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#E96E6E' },
  readAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#ffe0e8', borderRadius: 12 },
  readAllText: { color: '#E96E6E', fontWeight: '600' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardRead: { opacity: 0.7 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  body: { color: '#555', marginBottom: 6 },
  meta: { color: '#888', fontSize: 12 },
});
