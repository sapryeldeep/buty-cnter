import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDYAt4D7h8EGJlP9aL8r11mTtOcFXBKVx8",
  authDomain: "beauty-center-40ee0.firebaseapp.com",
  databaseURL: "https://beauty-center-40ee0-default-rtdb.firebaseio.com",
  projectId: "beauty-center-40ee0",
  storageBucket: "beauty-center-40ee0.firebasestorage.app",
  messagingSenderId: "1036559035207",
  appId: "1:1036559035207:web:c423550e1de8bd952dba62",
  measurementId: "G-VHZ4F6MN1F"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
