import { auth, db, addDoc, collection, onAuthStateChanged, signOut, doc, getDoc, query, where, getDocs, deleteDoc, updateDoc } from "./firebase-config.js";

const form = document.getElementById('job-post-form');
const jobsList = document.getElementById('posted-jobs-list');

// 1. Check Auth & Company Status
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "companies", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().status !== "Active") {
            alert("Your company account is pending approval or does not exist.");
            window.location.href = "index.html";
        } else {
            loadPostedJobs(user.uid);
        }
    } else {
        window.location.href = "company-signup.html";
    }
});

// 2. Handle Job Posting
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    const companySnap = await getDoc(doc(db, "companies", user.uid));
    const companyName = companySnap.data().companyName;

    const jobData = {
        title: document.getElementById('job-title').value,
        location: document.getElementById('job-location').value,
        jobType: document.getElementById('job-type').value,
        description: document.getElementById('job-desc').value,
        requirements: document.getElementById('job-req').value,
        salary: document.getElementById('job-salary').value,
        vacancies: parseInt(document.getElementById('job-vacancies').value) || 1,
        companyId: user.uid,
        companyName: companyName,
        createdAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "jobs"), jobData);
        alert("Job Posted Successfully!");
        form.reset();
        loadPostedJobs(user.uid);
    } catch (error) {
        console.error(error);
        alert("Error posting job: " + error.message);
    }
});

// 3. Load Posted Jobs
async function loadPostedJobs(uid) {
    jobsList.innerHTML = "<p><i class='fas fa-circle-notch fa-spin'></i> Loading your jobs...</p>";
    try {
        const q = query(collection(db, "jobs"), where("companyId", "==", uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            jobsList.innerHTML = "<p>You haven't posted any jobs yet.</p>";
            return;
        }

        jobsList.innerHTML = "";
        querySnapshot.forEach((docSnap) => {
            const job = docSnap.data();
            const jobId = docSnap.id;
            const datePosted = new Date(job.createdAt).toLocaleDateString();

            const item = document.createElement('div');
            item.className = "exp-item";
            item.style.marginBottom = "1.2rem"; // Keeping small layout spacer if needed, or move to CSS later

            item.innerHTML = `
                <div class="section-header-row" style="margin-bottom:1rem;">
                    <div>
                        <h3 style="margin:0; font-size:1.2rem; color:var(--text);">${job.title}</h3>
                        <p style="margin:4px 0; color:var(--text-light); font-size:0.85rem;">Posted on: ${datePosted}</p>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="updateVacancyPrompt('${jobId}', ${job.vacancies})" class="btn-sm" style="background:var(--primary); color:white; border:none; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                            <i class="fas fa-edit"></i> Edit Vacancy
                        </button>
                        <button onclick="deleteJob('${jobId}')" class="btn-sm" style="background:#f87171; color:white; border:none; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="meta-row">
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span><i class="fas fa-briefcase"></i> ${job.jobType}</span>
                    <span class="vacancy-badge">
                        <i class="fas fa-users"></i> ${job.vacancies || 1} Vacancies
                    </span>
                </div>
            `;
            jobsList.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading jobs:", error);
        jobsList.innerHTML = "<p>Error loading jobs.</p>";
    }
}

// 4. Utility Actions
window.deleteJob = async (jobId) => {
    if (confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) {
        try {
            await deleteDoc(doc(db, "jobs", jobId));
            alert("Job deleted successfully.");
            loadPostedJobs(auth.currentUser.uid);
        } catch (error) {
            console.error("Error deleting job:", error);
            alert("Error deleting job: " + error.message);
        }
    }
};

window.updateVacancyPrompt = async (jobId, currentCount) => {
    const newCount = prompt("Enter new vacancy count:", currentCount);
    if (newCount !== null && !isNaN(newCount)) {
        try {
            await updateDoc(doc(db, "jobs", jobId), { vacancies: parseInt(newCount) });
            alert("Vacancy count updated.");
            loadPostedJobs(auth.currentUser.uid);
        } catch (error) {
            console.error("Error updating vacancies:", error);
            alert("Error updating vacancies: " + error.message);
        }
    }
};