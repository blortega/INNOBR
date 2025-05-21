// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQsus0zNNUn2Vwcgb9V0G988kpU3Irb3k",
  authDomain: "innobr-3a29a.firebaseapp.com",
  projectId: "innobr-3a29a",
  storageBucket: "innobr-3a29a.firebasestorage.app",
  messagingSenderId: "170787264838",
  appId: "1:170787264838:web:e0615c770f076f7e50ed47",
  measurementId: "G-2B7VQ27B8Q",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore and export it
export const db = getFirestore(app);
