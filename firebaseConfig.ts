import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD9SzFCeqsbIe7KUj5_HvRkEnsXWe9B15o",
  authDomain: "disasterevacuationapp.firebaseapp.com",
  projectId: "disasterevacuationapp",
  storageBucket: "disasterevacuationapp.firebasestorage.app",
  messagingSenderId: "829237673501",
  appId: "1:829237673501:web:e0c842e1ee7f69215650f4",
  measurementId: "G-NZFTD1QLKR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);