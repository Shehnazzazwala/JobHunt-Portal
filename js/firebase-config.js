import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, collection, getDocs, onSnapshot, addDoc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🛡️ SECURITY: Firebase Config is public but protected by Firestore Rules.
// OpenAI keys should still be kept private (see js/secrets.js for local use).
const firebaseConfig = {
  apiKey: "AIzaSyDrJE877KArvsLfoN_oXbb4M9Cr-iC292c",
  authDomain: "jobportal-b5f61.firebaseapp.com",
  projectId: "jobportal-b5f61",
  storageBucket: "jobportal-b5f61.firebasestorage.app",
  messagingSenderId: "530796418972",
  appId: "1:530796418972:web:56a12d0d5b24841a441a59",
  measurementId: "G-F7XXVXFD9N"
};




const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth, db,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, collection, getDocs, onSnapshot, addDoc, query, where, orderBy, serverTimestamp
};