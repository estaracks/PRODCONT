import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkL7U7ZabhGQrNz36MMviVH4syM_GOOPY",
  authDomain: "prodcontrol-ed074.firebaseapp.com",
  projectId: "prodcontrol-ed074",
  storageBucket: "prodcontrol-ed074.firebasestorage.app",
  messagingSenderId: "251913732698",
  appId: "1:251913732698:web:eea529d2ef531ced2fce63",
  measurementId: "G-LD6VHF6MNM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
// We export these so they can be imported and used in other parts of the app (e.g., storageService.ts)
const db = getFirestore(app);
const auth = getAuth(app);

// Analytics is only valid in a browser environment
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, analytics, db, auth };