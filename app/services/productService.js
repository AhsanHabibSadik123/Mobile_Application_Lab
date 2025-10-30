// Product service for Firestore operations
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../auth/firebase';

// Get all products from Firestore
export const getAllProducts = async () => {
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('id', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ docId: doc.id, ...doc.data() });
    });

    return { success: true, data: products };
  } catch (error) {
    console.error('Error getting products:', error);
    return { success: false, error: error.message };
  }
};

// Add a new product to Firestore
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), productData);
    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error: error.message };
  }
};

// Update a product in Firestore
export const updateProduct = async (docId, productData) => {
  try {
    await updateDoc(doc(db, 'products', docId), productData);
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }
};

// Delete a product from Firestore
export const deleteProduct = async (docId) => {
  try {
    await deleteDoc(doc(db, 'products', docId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
  }
};
