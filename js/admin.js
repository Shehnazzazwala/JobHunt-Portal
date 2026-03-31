import { auth, db, onSnapshot, collection, doc, updateDoc, deleteDoc, signOut, onAuthStateChanged, getDoc, query, where, getDocs } from "./firebase-config.js";



const companyList = document.getElementById('company-list');
const userList = document.getElementById('user-list');
const totalCompaniesEl = document.getElementById('total-companies');
const totalUsersEl = document.getElementById('total-users');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && userSnap.data().role === "admin") {
            loadCompaniesRealtime();
            loadUsersRealtime();
        } else {
            alert("Access Denied.");
            window.location.href = "admin-auth.html";
        }
    } else {
        window.location.href = "admin-auth.html";
    }
});

function loadCompaniesRealtime() {
    companyList.innerHTML = "<tr><td colspan='4'>Listening...</td></tr>";
    onSnapshot(collection(db, "companies"), (snapshot) => {
        companyList.innerHTML = "";
        if (totalCompaniesEl) totalCompaniesEl.innerText = snapshot.size;

        if (snapshot.empty) {
            companyList.innerHTML = "<tr><td colspan='4'>No companies found.</td></tr>";
            return;
        }
        snapshot.forEach((docSnap) => {
            const company = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${company.companyName}</strong></td>
                <td>${company.email}</td>
                <td><span class="badge badge-${company.status}">${company.status}</span></td>
                <td>
                    ${company.status === 'Pending'
                    ? `<button class="btn-approve" onclick="approveCompany('${docSnap.id}')">Approve</button>
                           <button class="btn-reject" onclick="deleteCompany('${docSnap.id}')">Reject</button>`
                    : `<button class="btn-reject" style="font-size:0.7rem;" onclick="deleteCompany('${docSnap.id}')">Remove</button>`}
                </td>
            `;
            companyList.appendChild(row);
        });
    });
}

function loadUsersRealtime() {
    userList.innerHTML = "<tr><td colspan='4'>Listening...</td></tr>";
    onSnapshot(collection(db, "users"), (snapshot) => {
        userList.innerHTML = "";
        if (totalUsersEl) totalUsersEl.innerText = snapshot.size;

        if (snapshot.empty) {
            userList.innerHTML = "<tr><td colspan='4'>No users found.</td></tr>";
            return;
        }
        snapshot.forEach((docSnap) => {
            const user = docSnap.data();
            const row = document.createElement('tr');
            const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

            row.innerHTML = `
                <td>${user.email}</td>
                <td><span class="badge" style="background:${user.role === 'admin' ? '#ddd' : '#eef'}">${user.role || 'user'}</span></td>
                <td>${joined}</td>
                <td>
                    ${user.role !== 'admin'
                    ? `<button class="btn-reject" style="font-size:0.7rem;" onclick="deleteUser('${docSnap.id}')">Remove</button>`
                    : '<span style="color:gray; font-size:0.8rem;">Admin</span>'}
                </td>
            `;
            userList.appendChild(row);
        });
    });
}

window.approveCompany = async (companyId) => {
    if (confirm("Approve this company?")) {
        try {
            await updateDoc(doc(db, "companies", companyId), { status: "Active" });
        } catch (e) { alert("Error: " + e.message); }
    }
};

window.deleteCompany = async (companyId) => {
    if (confirm("Are you sure you want to completely remove this company? ALL their jobs will be deleted.")) {
        try {
            const q = query(collection(db, "jobs"), where("companyId", "==", companyId));
            const querySnapshot = await getDocs(q);
            const deletePromises = [];
            querySnapshot.forEach((doc) => deletePromises.push(deleteDoc(doc.ref)));
            await Promise.all(deletePromises);

            await deleteDoc(doc(db, "companies", companyId));
            alert("Company and jobs deleted.");
        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        }
    }
};

window.deleteUser = async (userId) => {
    if (confirm("Are you sure you want to remove this user? This cannot be undone.")) {
        try {
            await deleteDoc(doc(db, "users", userId));
        } catch (e) { alert("Error: " + e.message); }
    }
};

// Logout is handled by loadAdminNavbar() in navbar.js