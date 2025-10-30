// Admin service for checking user permissions
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../auth/firebase';

// Check if a user is admin by their UID
export const checkUserIsAdmin = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.isAdmin || false;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get user data by UID (including admin status)
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return { success: false, error: error.message };
  }
};

// Make a user admin (for administrative purposes)
export const makeUserAdmin = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isAdmin: true
    });
    return { success: true };
  } catch (error) {
    console.error('Error making user admin:', error);
    return { success: false, error: error.message };
  }
};
