import { db, doc, getDoc, collection, query, where, getDocs } from "./firebase-config.js";

const params = new URLSearchParams(window.location.search);
const companyId = params.get('id');

if (!companyId) {
    alert("No company specified.");
    window.location.href = "find-jobs.html";
}

// 1. Load Company Details
async function loadCompanyDetails() {
    try {
        const docRef = doc(db, "companies", companyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.title = `${data.companyName} - Details`;
            document.getElementById('co-name').innerText = data.companyName;
            document.getElementById('co-location').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${data.locations || 'Not specified'}`;
            document.getElementById('co-employees').innerText = data.employees || "N/A";
            document.getElementById('co-about').innerText = data.about || "No info available.";
            document.getElementById('co-desc').innerText = data.description || "No description provided.";
            document.getElementById('co-services').innerText = data.services || "-";
            document.getElementById('co-products').innerText = data.products || "-";
        } else {
            document.body.innerHTML = "<h2 style='text-align:center; margin-top:50px;'>Company not found.</h2>";
        }
    } catch (error) {
        console.error(error);
    }
}

// 2. Load Company Jobs
async function loadCompanyJobs() {
    const list = document.getElementById('co-jobs-list');
    list.innerHTML = "<p>Loading active jobs...</p>";

    try {
        const q = query(collection(db, "jobs"), where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);

        list.innerHTML = "";

        if (querySnapshot.empty) {
            list.innerHTML = "<p>No active job openings.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const job = doc.data();
            const datePosted = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently';

            const div = document.createElement('div');
            div.className = "job-card";
            div.innerHTML = `
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <div class="meta-row">
                        <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Location not specified'}</span>
                        <span><i class="fas fa-briefcase"></i> ${job.jobType || 'Type not specified'}</span>
                        <span><i class="fas fa-clock"></i> ${datePosted}</span>
                    </div>
                </div>
                <a href="apply.html?id=${doc.id}" class="btn-primary">Apply</a>
            `;
            list.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        list.innerHTML = "<p>Error loading jobs.</p>";
    }
}

loadCompanyDetails();
loadCompanyJobs();
