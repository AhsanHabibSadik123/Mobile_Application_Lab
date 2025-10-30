import AntDesign from "@expo/vector-icons/AntDesign";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../auth/firebase";

// Move ProductForm outside to prevent re-creation
const ProductForm = ({ 
  visible, 
  editingProduct, 
  formData, 
  setFormData, 
  onClose, 
  onSubmit 
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <AntDesign name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Title</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter product title"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price ($)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="Enter price"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Image URL</Text>
            <TextInput
              style={[styles.textInput, styles.urlInput]}
              value={formData.image}
              onChangeText={(text) => setFormData({ ...formData, image: text })}
              placeholder="Enter image URL"
              placeholderTextColor="#999"
              multiline
            />
          </View>

          {formData.image && (
            <View style={styles.imagePreview}>
              <Text style={styles.inputLabel}>Preview:</Text>
              <Image
                source={{ uri: formData.image }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>
          )}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Available Sizes (comma separated)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.sizes}
              onChangeText={(text) => setFormData({ ...formData, sizes: text })}
              placeholder="e.g. S, M, L, XL"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
          </View>
          
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={onSubmit}
          >
            <Text style={styles.saveButtonText}>
              {editingProduct ? "Update" : "Add Product"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const ProductManagement = ({ onBack }) => {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    image: "",
    sizes: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsCollection = collection(db, 'products');
      const q = query(productsCollection, orderBy('id', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const firestoreProducts = [];
      querySnapshot.forEach((doc) => {
        firestoreProducts.push({ docId: doc.id, ...doc.data() });
      });

      setProducts(firestoreProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please check your connection.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (!formData.title || !formData.price || !formData.image) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      // Get the next ID
      const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
      
      // Validate price input
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        Alert.alert("Error", "Please enter a valid price (positive number)");
        return;
      }

      const newProduct = {
        id: nextId,
        title: formData.title.trim(),
        price: priceValue,
        image: formData.image.trim(),
        availableSizes: (formData.sizes || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'products'), newProduct);
      
      // Update local state
      const productWithDocId = { ...newProduct, docId: docRef.id };
      setProducts([...products, productWithDocId]);
      
  // Reset form
  setFormData({ title: "", price: "", image: "", sizes: "" });
      setShowAddModal(false);
      
      Alert.alert("Success", "Product added successfully!");
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    }
  };

  const handleEditProduct = async () => {
    if (!formData.title || !formData.price || !formData.image) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      // Validate price input
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        Alert.alert("Error", "Please enter a valid price (positive number)");
        return;
      }

      const updatedProduct = {
        id: editingProduct.id,
        title: formData.title.trim(),
        price: priceValue,
        image: formData.image.trim(),
        availableSizes: (formData.sizes || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      };

      // Update in Firestore if product has docId
      if (editingProduct.docId) {
        await updateDoc(doc(db, 'products', editingProduct.docId), updatedProduct);
      }

      // Update local state
      const updatedProducts = products.map((product) =>
        product.id === editingProduct.id ? { ...product, ...updatedProduct } : product
      );

      setProducts(updatedProducts);
      setEditingProduct(null);
  setFormData({ title: "", price: "", image: "", sizes: "" });
      Alert.alert("Success", "Product updated successfully!");
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert("Error", "Failed to update product. Please try again.");
    }
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const productToDelete = products.find(p => p.id === productId);
              
              // Delete from Firestore if product has docId
              if (productToDelete && productToDelete.docId) {
                await deleteDoc(doc(db, 'products', productToDelete.docId));
              }

              // Update local state
              setProducts(products.filter((p) => p.id !== productId));
              Alert.alert("Success", "Product deleted successfully!");
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert("Error", "Failed to delete product. Please try again.");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      price: (product.price || 0).toString(),
      image: product.image,
      sizes: Array.isArray(product.availableSizes) ? product.availableSizes.join(', ') : '',
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({ title: "", price: "", image: "", sizes: "" });
  };

  const handleSubmit = () => {
    if (editingProduct) {
      handleEditProduct();
    } else {
      handleAddProduct();
    }
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{item.title}</Text>
        <Text style={styles.productPrice}>${(item.price || 0).toFixed(2)}</Text>
        <Text style={styles.productId}>ID: {item.id}</Text>
        
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#2196F3" }]}
          onPress={() => openEditModal(item)}
        >
          <AntDesign name="edit" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#f44336" }]}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <AntDesign name="delete" size={18} color="#fff" />
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
        <Text style={styles.title}>Product Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <AntDesign name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <AntDesign name="search1" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          Total Products: {products.length} | Showing: {filteredProducts.length}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.productList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <ProductForm 
        visible={showAddModal || editingProduct !== null}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </View>
  );
};

export default ProductManagement;

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
  addButton: {
    position: "absolute",
    right: 18,
    top: 44,
    width: 44,
    height: 44,
    backgroundColor: "#4CAF50",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  statsBar: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  productList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#e0e0e0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    color: "#E96E6E",
    fontWeight: "600",
    marginBottom: 2,
  },
  productId: {
    fontSize: 12,
    color: "#999",
  },
  
  productActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  formContainer: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  urlInput: {
    height: 80,
    textAlignVertical: "top",
  },
  imagePreview: {
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  saveButton: {
    backgroundColor: "#E96E6E",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});
