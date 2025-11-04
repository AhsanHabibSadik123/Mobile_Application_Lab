// Admin configuration
import { checkUserIsAdmin } from '../services/adminService';
import { auth } from '../../auth/firebase';

// Check if current user is admin using Firestore
export const checkAdminAccess = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    const isAdmin = await checkUserIsAdmin(currentUser.uid);
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
};


export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
};
