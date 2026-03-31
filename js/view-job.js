import { db, doc, getDoc } from "./firebase-config.js";

const urlParams = new URLSearchParams(window.location.search);
const jobId = urlParams.get('id');

const loadingEl = document.getElementById('loading');
const contentEl = document.getElementById('job-content');

if (!jobId) {
    window.location.href = "find-jobs.html";
}

async function loadJobDetails() {
    try {
        const docRef = doc(db, "jobs", jobId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const job = docSnap.data();

            document.title = `${job.title} at ${job.companyName} - JobHunt`;
            document.getElementById('j-title').innerText = job.title;
            document.getElementById('j-company').innerText = job.companyName;
            document.getElementById('j-location').innerText = job.location || "Location not specified";
            document.getElementById('j-type').innerText = job.jobType || "Full-time";
            document.getElementById('j-salary').innerText = job.salary || "Salary Negotiable";

            // Add Vacancy Count
            const metaContainer = document.getElementById('j-meta-container');
            if (metaContainer) {
                const vacancySpan = document.createElement('span');
                vacancySpan.className = "vacancy-badge";
                vacancySpan.innerHTML = `<i class="fas fa-users"></i> ${job.vacancies || 1} Vacancies`;
                metaContainer.appendChild(vacancySpan);
            }

            document.getElementById('j-description').innerText = job.description;

            // Requirements (handle if it's a string or array)
            const requirements = job.requirements || "Refer to the job description for details.";
            document.getElementById('j-requirements').innerText = requirements;

            document.getElementById('j-date').innerText = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently';
            document.getElementById('apply-btn').href = `apply.html?id=${jobId}`;

            loadingEl.style.display = 'none';
            contentEl.style.display = 'block';
        } else {
            alert("Job not found.");
            window.location.href = "find-jobs.html";
        }
    } catch (error) {
        console.error("Error fetching job details:", error);
        alert("Error loading job details.");
    }
}

loadJobDetails();
