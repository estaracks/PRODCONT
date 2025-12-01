import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALVFWSOuFyr_8ZfL0guyCL-qAdMsf1JrM",
  authDomain: "sistemaestaracks.firebaseapp.com",
  projectId: "sistemaestaracks",
  storageBucket: "sistemaestaracks.firebasestorage.app",
  messagingSenderId: "449707813338",
  appId: "1:449707813338:web:5458cdb0abdbc23f7e78e3",
  measurementId: "G-MRGVQDR3QM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

// Analytics is only valid in a browser environment
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, analytics, db, auth };