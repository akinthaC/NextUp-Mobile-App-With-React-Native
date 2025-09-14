// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATbKxwc4Ra8DTLrSn13CQxoSg7wu2xv0I",
  authDomain: "nextup-984ef.firebaseapp.com",
  projectId: "nextup-984ef",
  storageBucket: "nextup-984ef.firebasestorage.app",
  messagingSenderId: "76950296712",
  appId: "1:76950296712:web:6497c8719a53c810d5673d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app)