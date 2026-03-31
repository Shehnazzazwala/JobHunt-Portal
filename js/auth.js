import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, setDoc } from "./firebase-config.js";

const form = document.getElementById('auth-form');
const title = document.getElementById('form-title');
const nameGroup = document.getElementById('name-group');
const toggleBtn = document.getElementById('toggle-auth');
const toggleText = document.getElementById('toggle-text');

// Define Admin Email Here
const ADMIN_EMAIL = "admin1@jobhunt.com";
//password: admin@1234

let isSignup = false;

// 1. Toggle between Login and Signup View
toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isSignup = !isSignup;
    if (isSignup) {
        title.innerText = "Create Account";
        nameGroup.style.display = "block";
        toggleBtn.innerText = "Login here";
        toggleText.innerText = "Already have an account? ";
    } else {
        title.innerText = "Login";
        nameGroup.style.display = "none";
        toggleBtn.innerText = "Create an account";
        toggleText.innerText = "New user? ";
    }
});

// 2. Handle Form Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullname = document.getElementById('fullname').value;

    try {
        if (isSignup) {
            // --- SIGNUP LOGIC ---
            
            // Prevent Admin from signing up via this form (Security/Logic check)
            if(email === ADMIN_EMAIL) {
                alert("Admins cannot sign up here. Please Log In.");
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create User Document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                fullName: fullname,
                email: email,
                jobTitle: "Open to Work",
                location: "",
                education: "",
                experience: "",
                certifications: "",
                appliedJobs: [] 
            });

            alert("Account created! Redirecting to Profile...");
            window.location.href = "profile.html";

        } else {
            // --- LOGIN LOGIC ---
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // CHECK: Is this the Admin?
            if (user.email === ADMIN_EMAIL) {
                window.location.href = "admin-panel.html"; // <--- Redirect Admin here
            } else {
                window.location.href = "profile.html";     // <--- Regular users go here
            }
        }
    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    }
});