import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import ProductCard from './ProductCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../auth/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const categories = ['All' , 'Fashion', 'Mens', 'Womens'];

const Home = ({ onProductPress }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [userName, setUserName] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch products from Firestore
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const fetchedProducts = [];
      
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({
          id: doc.data().id || doc.id,
          docId: doc.id,
          ...doc.data()
        });
      });
      
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      // You can add error handling here, like showing an alert
    } finally {
      setLoading(false);
    }
  };

  // Function to handle pull-to-refresh
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const fetchedProducts = [];
      
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({
          id: doc.data().id || doc.id,
          docId: doc.id,
          ...doc.data()
        });
      });
      
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error refreshing products:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.displayName) {
        setUserName(user.displayName);
      } else {
        setUserName('');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('favorites').then(data => {
      if (data) setFavorites(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id) => {
    setFavorites(favs =>
      favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]
    );
  };

  const getFilteredProducts = () => {
    let filteredProducts = products;

    if (searchQuery.trim()) {
      filteredProducts = filteredProducts.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {

      if (activeCategory === 'New') {

        filteredProducts = filteredProducts.slice(-6);
      } else if (activeCategory === 'Fashion') {

        filteredProducts = filteredProducts.filter(product =>
          product.title.toLowerCase().includes('shirt') || 
          product.title.toLowerCase().includes('jacket') ||
          product.title.toLowerCase().includes('sweater')
        );
      } else if (activeCategory === 'Mens') {

        filteredProducts = filteredProducts.filter(product =>
          product.title.toLowerCase().includes('jacket') ||
          product.title.toLowerCase().includes('coat') ||
          product.title.toLowerCase().includes('jeans')
        );
      } else if (activeCategory === 'Womens') {

        filteredProducts = filteredProducts.filter(product =>
          product.title.toLowerCase().includes('sweater') ||
          product.title.toLowerCase().includes('shirt')
        );
      } else if (activeCategory === 'Sale') {

        filteredProducts = filteredProducts.filter(product => product.price < 50);
      } else if (activeCategory === 'Trending Now') {

        filteredProducts = filteredProducts.slice(0, 6);
      }

    }

    return filteredProducts;
  };

  const filteredProducts = getFilteredProducts();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerText}>
            Welcome{userName ? `, ${userName}` : ''}
          </Text>
        </View>
        <Ionicons name="person-circle-outline" size={40} color="#222" />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b9d" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <>
          <View style={styles.searchBarContainer}>
            <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Feather name="x" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            bounces={true}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={120}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryItem, activeCategory === cat && styles.categoryItemActive]}
                onPress={() => {
                  setActiveCategory(cat);
                  
                  if (searchQuery.trim()) {
                    setSearchQuery('');
                  }
                }}
              >
                <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Show search results count if searching */}
          {searchQuery.trim() && (
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsText}>
                {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{searchQuery}"
              </Text>
              {filteredProducts.length === 0 && (
                <Text style={styles.noResultsText}>
                  Try adjusting your search terms
                </Text>
              )}
            </View>
          )}

          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            renderItem={({ item }) => (
              <View style={styles.productCardWrapper}>
                <ProductCard
                  product={item}
                  onPress={() => onProductPress(item)}
                  isFavorite={favorites.includes(item.id)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              </View>
            )}
            contentContainerStyle={[
              styles.productList,
              filteredProducts.length === 0 && styles.emptyProductList
            ]}
            columnWrapperStyle={filteredProducts.length > 0 ? styles.productRow : null}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#E96E6E']}
                tintColor="#E96E6E"
              />
            }
            ListEmptyComponent={
              searchQuery.trim() ? (
                <View style={styles.emptySearchContainer}>
                  <Feather name="search" size={48} color="#ccc" />
                  <Text style={styles.emptySearchText}>No products found</Text>
                  <Text style={styles.emptySearchSubtext}>
                    Try searching for something else
                  </Text>
                </View>
              ) : !loading && products.length === 0 ? (
                <View style={styles.emptySearchContainer}>
                  <Feather name="package" size={48} color="#ccc" />
                  <Text style={styles.emptySearchText}>No products available</Text>
                  <Text style={styles.emptySearchSubtext}>
                    Products will appear here once they're added to the database
                  </Text>
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff3f8',
    paddingTop: 40,
    paddingHorizontal: 0,
  },
  header: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff0f6',
    borderBottomWidth: 1,
    borderBottomColor: '#ffd6e6',
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: '#ffb6d5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  dataSource: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff3f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    height: 44,
    shadowColor: '#ffb6d5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchResultsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchResultsText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categoryList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 15,
    paddingTop: 5,
    height: 54,
    alignItems: 'center',
    paddingRight: 20,
  },
  categoryItem: {
    backgroundColor: '#f7e6f7',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ffb6d5',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItemActive: {
    backgroundColor: '#E96E6E',
    borderColor: '#E96E6E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productList: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  emptyProductList: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  productCardWrapper: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: 4,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptySearchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptySearchText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
