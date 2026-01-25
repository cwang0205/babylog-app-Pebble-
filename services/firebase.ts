
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- PASTE YOUR FIREBASE CONFIG HERE ---
// You can get this from Project Settings -> General -> Your Apps -> Web App
const firebaseConfig = {
  apiKey: "AIzaSyAUdFKz7cpD8otNE78g3Aw7XMYN0TS73EU",
  authDomain: "babylog-72618.firebaseapp.com",
  projectId: "babylog-72618",
  storageBucket: "babylog-72618.firebasestorage.app",
  messagingSenderId: "75196122082",
  appId: "1:75196122082:web:02b6f0b4de882a68ab6fbb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
