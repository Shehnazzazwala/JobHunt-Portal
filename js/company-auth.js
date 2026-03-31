import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, setDoc, getDoc } from "./firebase-config.js";

const form = document.getElementById('company-auth-form');
const nameGroup = document.getElementById('name-group');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const toggleBtn = document.getElementById('toggle-auth');
const toggleText = document.getElementById('toggle-text');
const msgBox = document.getElementById('msg-box');

let isSignup = true; // Default state

// 1. Toggle between Login and Signup
toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isSignup = !isSignup;

    if (isSignup) {
        formTitle.innerText = "Company Registration";
        submitBtn.innerText = "Register Company";
        toggleText.innerText = "Already have an account? ";
        toggleBtn.innerText = "Login here";
        nameGroup.style.display = "block"; // Show Name
        document.getElementById('comp-name').required = true;
    } else {
        formTitle.innerText = "Company Login";
        submitBtn.innerText = "Login to Dashboard";
        toggleText.innerText = "New Company? ";
        toggleBtn.innerText = "Register here";
        nameGroup.style.display = "none"; // Hide Name
        document.getElementById('comp-name').required = false;
    }
    msgBox.innerText = ""; // Clear messages
});

// 2. Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgBox.innerText = "Processing...";
    msgBox.style.color = "blue";
    
    const email = document.getElementById('comp-email').value;
    const password = document.getElementById('comp-password').value;

    try {
        if (isSignup) {
            // --- REGISTRATION LOGIC ---
            const name = document.getElementById('comp-name').value;
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create Company Doc
            await setDoc(doc(db, "companies", user.uid), {
                companyName: name,
                email: email,
                role: "company",
                status: "Pending", // Admin must approve this
                createdAt: new Date().toISOString()
            });

            msgBox.innerText = "Registration Successful! Please wait for Admin approval.";
            msgBox.style.color = "green";
            form.reset();
            
        } else {
            // --- LOGIN LOGIC ---
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if this user is actually a company
            const docRef = doc(db, "companies", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const companyData = docSnap.data();
                
                if (companyData.status === "Active") {
                    // Success! Redirect to Dashboard
                    window.location.href = "company-dashboard.html";
                } else {
                    // Registered but not approved yet
                    msgBox.innerText = "Login failed: Your account is still Pending approval.";
                    msgBox.style.color = "orange";
                    await auth.signOut(); // Force logout
                }
            } else {
                // User exists in Auth, but no Company Doc (maybe a regular user trying to login here)
                msgBox.innerText = "Error: No company account found for this email.";
                msgBox.style.color = "red";
                await auth.signOut();
            }
        }
    } catch (error) {
        console.error(error);
        msgBox.innerText = "Error: " + error.message;
        msgBox.style.color = "red";
    }
});