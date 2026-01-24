import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';

export const AuthService = {
  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    // Force account selection to prevent auto-select loop issues or stuck pending promises
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  },

  onUserChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};