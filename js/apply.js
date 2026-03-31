import { auth, db, addDoc, collection, doc, getDoc, onAuthStateChanged } from "./firebase-config.js";
import { createNotification } from "./notifications.js";

const urlParams = new URLSearchParams(window.location.search);
const jobId = urlParams.get('id');

const form = document.getElementById('application-form');
const msg = document.getElementById('status-msg');
const submitBtn = document.getElementById('submit-btn');

let currentUser = null;
let currentJobData = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("Please login to apply.");
        window.location.href = "auth.html";
        return;
    }
    currentUser = user;
    document.getElementById('app-email').value = user.email;

    if (jobId) {
        const jobSnap = await getDoc(doc(db, "jobs", jobId));
        if (jobSnap.exists()) {
            currentJobData = jobSnap.data();
            document.getElementById('job-title-display').innerText = `Applying for: ${currentJobData.title} at ${currentJobData.companyName}`;
        }
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";

    const experience = document.getElementById('app-exp').value;
    const email = document.getElementById('app-email').value;
    const resumeLink = document.getElementById('app-resume-link').value;

    try {
        await addDoc(collection(db, "applications"), {
            jobId: jobId,
            jobTitle: currentJobData.title,
            companyId: currentJobData.companyId,
            companyName: currentJobData.companyName,
            userId: currentUser.uid,
            applicantEmail: email,
            experience: experience,
            resumeUrl: resumeLink, // Saving the text link
            status: "Pending",
            appliedAt: new Date().toLocaleDateString()
        });

        msg.innerText = "Application Sent Successfully!";
        msg.style.color = "green";

        // Notify company
        createNotification(
            currentJobData.companyId, 'company', 'new_application',
            'New Application Received',
            `${email} applied for ${currentJobData.title}. Click here to review.`,
            'company-applications.html'
        );

        setTimeout(() => window.location.href = "index.html", 2000);

    } catch (error) {
        console.error(error);
        msg.innerText = "Error: " + error.message;
        msg.style.color = "red";
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Application";
    }
});