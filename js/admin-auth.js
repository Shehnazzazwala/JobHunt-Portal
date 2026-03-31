import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, setDoc } from "./firebase-config.js";

const form = document.getElementById('admin-form');

// Admin only supports login now.
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "admin-panel.html";
    } catch (error) {
        alert("Error: " + error.message);
    }
});