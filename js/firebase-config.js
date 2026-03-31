import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, collection, getDocs, onSnapshot, addDoc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🛡️ SECURITY: Configuration is now loaded from a gitignored file (js/secrets.js)
// Use js/secrets.example.js as a template for your local secrets.js
let firebaseConfig = {
  apiKey: "REPLACED_BY_SECRETS_JS",
  authDomain: "jobportal-b5f61.firebaseapp.com",
  projectId: "jobportal-b5f61",
  storageBucket: "jobportal-b5f61.firebasestorage.app",
  messagingSenderId: "530796418972",
  appId: "1:530796418972:web:56a12d0d5b24841a441a59",
  measurementId: "G-F7XXVXFD9N"
};

// Attempt to load from local secrets if available (for local dev)
try {
  const { SECRETS } = await import("./secrets.js").catch(() => ({ SECRETS: null }));
  if (SECRETS && SECRETS.FIREBASE_CONFIG) {
    firebaseConfig = { ...firebaseConfig, ...SECRETS.FIREBASE_CONFIG };
  }
} catch (e) {
  console.info("Running with default/demo config. Create js/secrets.js for full functionality.");
}




const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth, db,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, collection, getDocs, onSnapshot, addDoc, query, where, orderBy, serverTimestamp
};