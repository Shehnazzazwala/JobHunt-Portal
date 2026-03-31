import { auth, db, doc, getDoc, updateDoc, onAuthStateChanged, signOut } from "./firebase-config.js";

const viewMode = document.getElementById('view-mode');
const editMode = document.getElementById('edit-mode');
const editBtn = document.getElementById('edit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('company-profile-form');

let companyUid = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        companyUid = user.uid;
        // Check if user is actually a company (optional, but good practice)
        // Here assuming user is company based on page context
        loadCompanyData(user.uid);
    } else {
        window.location.href = "company-signup.html";
    }
});

async function loadCompanyData(uid) {
    const docRef = doc(db, "companies", uid); // Assuming companies are in 'companies' collection? 
    // Wait, let's check auth.html/signup structure. Previously user used 'users' collection for everyone?
    // Let's verify where company data is stored.
    // Based on previous file content, it was fetching from 'companies' collection or similar?
    // The previous code used: doc(db, "companies", uid);

    // Let's stick to previous code's assumption.
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        populateFields(data);
    }
}

function populateFields(data) {
    // View Mode
    document.getElementById('view-name').innerText = data.companyName || "Company Name";
    document.getElementById('view-employees').innerText = data.employees || "N/A";
    document.getElementById('view-locations').innerText = data.location || "N/A";
    document.getElementById('view-about').innerText = data.about || "No description provided.";
    document.getElementById('view-description').innerText = data.description || "No detailed description provided.";
    document.getElementById('view-services').innerText = data.services || "N/A";
    document.getElementById('view-products').innerText = data.products || "N/A";

    // Edit Mode
    document.getElementById('c-name').value = data.companyName || "";
    document.getElementById('c-employees').value = data.employees || "";
    document.getElementById('c-locations').value = data.location || "";
    document.getElementById('c-about').value = data.about || "";
    document.getElementById('c-description').value = data.description || "";
    document.getElementById('c-services').value = data.services || "";
    document.getElementById('c-products').value = data.products || "";
}

// Toggle Modes
editBtn.addEventListener('click', () => {
    viewMode.style.display = 'none';
    editMode.style.display = 'block';
});

cancelBtn.addEventListener('click', () => {
    editMode.style.display = 'none';
    viewMode.style.display = 'block';
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedData = {
        employees: document.getElementById('c-employees').value,
        location: document.getElementById('c-locations').value,
        about: document.getElementById('c-about').value,
        description: document.getElementById('c-description').value,
        services: document.getElementById('c-services').value,
        products: document.getElementById('c-products').value
    };

    try {
        await updateDoc(doc(db, "companies", companyUid), updatedData);
        alert("Company Details Updated!");
        // Update view with new data immediately
        document.getElementById('view-employees').innerText = updatedData.employees;
        document.getElementById('view-locations').innerText = updatedData.location;
        document.getElementById('view-about').innerText = updatedData.about;
        document.getElementById('view-description').innerText = updatedData.description;
        document.getElementById('view-services').innerText = updatedData.services;
        document.getElementById('view-products').innerText = updatedData.products;

        editMode.style.display = 'none';
        viewMode.style.display = 'block';
    } catch (error) {
        console.error("Error updating company:", error);
        alert("Error saving details.");
    }
});

