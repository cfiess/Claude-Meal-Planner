import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCeb-mGMCipyKjkrsOVJF6Tl1j4lShHDm4",
  authDomain: "meal-planner-f9c01.firebaseapp.com",
  projectId: "meal-planner-f9c01",
  storageBucket: "meal-planner-f9c01.firebasestorage.app",
  messagingSenderId: "948064540518",
  appId: "1:948064540518:web:54c0b03170dd4c3f299aa7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
