import {
    auth, db, collection, query, where, getDocs,
    doc, updateDoc, onAuthStateChanged, getDoc
} from "./firebase-config.js";
import { createNotification } from "./notifications.js";

const list = document.getElementById('applications-list');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loadApplications(user.uid);
    } else {
        window.location.href = "company-signup.html";
    }
});

// ── Which statuses get Select/Reject buttons ─────────────────────────────────
const DECIDABLE_STATUSES = ['Pending', 'Interview Scheduled'];

async function loadApplications(companyUid) {
    list.innerHTML = "<p>Loading...</p>";

    const q = query(collection(db, "applications"), where("companyId", "==", companyUid));
    const querySnapshot = await getDocs(q);

    list.innerHTML = "";

    if (querySnapshot.empty) {
        list.innerHTML = "<p>No applications received yet.</p>";
        return;
    }

    // Also grab company name for the offer letter email
    let companyName = "Our Company";
    try {
        const cSnap = await getDoc(doc(db, "companies", companyUid));
        if (cSnap.exists()) companyName = cSnap.data().companyName || companyName;
    } catch (_) { }

    querySnapshot.forEach((docSnap) => {
        const app = docSnap.data();
        const appId = docSnap.id;
        const card = document.createElement('div');
        card.className = "app-card";
        card.id = `card-${appId}`;

        // Interview badge
        const interviewBadge = app.interview
            ? `<div class="interview-badge">
                <i class="fas fa-calendar-check"></i>
                <strong>Interview Scheduled</strong>
                <span>${app.interview.date} at ${app.interview.time}</span>
                ${app.interview.notes ? `<em>${app.interview.notes}</em>` : ''}
               </div>`
            : '';

        // Decide button row
        const canDecide = DECIDABLE_STATUSES.includes(app.status);
        const decideButtons = canDecide ? `
            <button class="btn-sm btn-accept" onclick="updateStatus('${appId}', 'Selected', '${escJs(app.applicantEmail)}', '${escJs(app.applicantName || '')}', '${escJs(app.jobTitle)}', '${escJs(companyName)}')">
                <i class="fas fa-check"></i> Select
            </button>
            <button class="btn-sm btn-reject" onclick="updateStatus('${appId}', 'Rejected', '', '', '', '')">
                <i class="fas fa-times"></i> Reject
            </button>
        ` : '';

        card.innerHTML = `
            <div class="section-header-row" style="flex-wrap:wrap; gap:0.5rem;">
                <div>
                    <h3 style="margin-bottom:0.3rem;">${app.jobTitle}</h3>
                    <p><strong>Applicant:</strong>
                        <a href="applicant-profile.html?uid=${app.userId}" class="btn-link" style="font-weight:bold;">
                            ${app.applicantEmail}
                        </a>
                    </p>
                    <p><strong>Experience:</strong> ${app.experience} years</p>
                </div>
                <span class="status-badge status-${cssStatus(app.status)}">${app.status}</span>
            </div>

            ${interviewBadge}

            <!-- Schedule Interview Form -->
            <div id="schedule-form-${appId}" class="schedule-form" style="display:none;">
                <h4><i class="fas fa-calendar-alt"></i> Schedule Interview</h4>
                <div class="schedule-row">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="s-date-${appId}" min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Time</label>
                        <input type="time" id="s-time-${appId}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes (optional)</label>
                    <input type="text" id="s-notes-${appId}" placeholder="e.g. Google Meet link, Round 1...">
                </div>
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                    <button class="btn-sm btn-schedule-save" onclick="saveInterview('${appId}')">
                        <i class="fas fa-check"></i> Save
                    </button>
                    <button class="btn-sm btn-secondary" onclick="toggleSchedule('${appId}')">
                        Cancel
                    </button>
                </div>
            </div>

            <div class="app-actions" style="margin-top:1rem;">
                <a href="company-chat.html?appId=${appId}&userId=${app.userId}" class="btn-sm btn-chat">
                    <i class="fas fa-comment-dots"></i> Chat
                </a>
                ${app.status !== 'Selected' && app.status !== 'Rejected' ? `
                <button class="btn-sm btn-interview" onclick="toggleSchedule('${appId}')">
                    <i class="fas fa-calendar-alt"></i> ${app.interview ? 'Reschedule' : 'Schedule Interview'}
                </button>` : ''}
                <a href="${app.resumeUrl}" target="_blank" class="btn-sm btn-resume">
                    <i class="fas fa-file-alt"></i> Resume
                </a>
                ${decideButtons}
            </div>

            <!-- Selected confirmation -->
            ${app.status === 'Selected' ? `
            <div class="meta-row" style="margin-top:0.75rem; color:#34d399;">
                <i class="fas fa-envelope-open-text"></i>
                <span>Offer letter sent to applicant's email.</span>
            </div>` : ''}
        `;
        list.appendChild(card);
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function cssStatus(s) { return (s || 'Pending').replace(/\s+/g, '-'); }
function escJs(s) { return (s || '').replace(/'/g, "\\'"); }

// ── Toggle schedule form ─────────────────────────────────────────────────────
window.toggleSchedule = (appId) => {
    const form = document.getElementById(`schedule-form-${appId}`);
    if (!form) return;
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
};

// ── Save interview ───────────────────────────────────────────────────────────
window.saveInterview = async (appId) => {
    const date = document.getElementById(`s-date-${appId}`).value;
    const time = document.getElementById(`s-time-${appId}`).value;
    const notes = document.getElementById(`s-notes-${appId}`).value.trim();
    if (!date || !time) { alert("Please pick a date and time."); return; }
    try {
        await updateDoc(doc(db, "applications", appId), {
            interview: { date, time, notes, scheduledAt: new Date().toISOString() },
            status: "Interview Scheduled"
        });

        // Notify user about interview
        const appSnap = await getDoc(doc(db, "applications", appId));
        if (appSnap.exists()) {
            const a = appSnap.data();
            createNotification(
                a.userId, 'user', 'interview',
                `Interview Scheduled by ${a.companyName || 'Company'}`,
                `Your interview for ${a.jobTitle} is on ${date} at ${time}.${notes ? ' Notes: ' + notes : ''}`,
                'applied-jobs.html'
            );
        }

        alert("Interview scheduled! The applicant has been notified.");
        location.reload();
    } catch (e) {
        console.error(e);
        alert("Error saving interview.");
    }
};

// ── Update status (Select / Reject) ──────────────────────────────────────────
window.updateStatus = async (appId, newStatus, applicantEmail, applicantName, jobTitle, companyName) => {
    const action = newStatus === 'Selected' ? 'select' : 'reject';
    if (!confirm(`Are you sure you want to ${action} this applicant?`)) return;

    try {
        const updateData = { status: newStatus };

        if (newStatus === 'Rejected') {
            updateData.rejectedAt = new Date().toISOString();
            updateData.rejectedNotified = false; // applicant hasn't seen it yet
        }

        await updateDoc(doc(db, "applications", appId), updateData);

        // Read app data for notification
        const appSnap = await getDoc(doc(db, "applications", appId));
        const a = appSnap.exists() ? appSnap.data() : {};

        if (newStatus === 'Selected') {
            createNotification(
                a.userId, 'user', 'selected',
                `Offer Letter from ${companyName}`,
                `Congratulations! You've been selected for ${jobTitle}. Click to view your offer letter.`,
                `offer-letter.html?appId=${appId}`
            );
            await sendOfferLetter(appId, applicantEmail, applicantName, jobTitle, companyName);
        } else {
            createNotification(
                a.userId, 'user', 'rejected',
                'Application Update',
                `Sorry, you're not selected for ${a.jobTitle || 'the position'} at ${a.companyName || 'the company'}.`,
                'applied-jobs.html'
            );
            alert("Applicant has been rejected. They will see a notification on their portal.");
            location.reload();
        }
    } catch (error) {
        console.error(error);
        alert("Error updating status.");
    }
};

// ── Send offer letter email via EmailJS ──────────────────────────────────────
async function sendOfferLetter(appId, applicantEmail, applicantName, jobTitle, companyName) {
    const offerLink = `${window.location.origin}/${window.location.pathname.replace('company-applications.html', '')}offer-letter.html?appId=${appId}`;

    const serviceId = window.EMAILJS_SERVICE_ID;
    const templateId = window.EMAILJS_TEMPLATE_ID;
    const publicKey = window.EMAILJS_PUBLIC_KEY;

    // Validate EmailJS is configured
    if (serviceId === 'YOUR_SERVICE_ID' || templateId === 'YOUR_TEMPLATE_ID' || publicKey === 'YOUR_PUBLIC_KEY') {
        alert(`✅ Applicant marked as Selected!\n\n⚠️ EmailJS not fully configured.\nOffer letter link:\n${offerLink}\n\nShare this with the applicant manually.`);
        location.reload();
        return;
    }

    try {
        await emailjs.send(serviceId, templateId, {
            to_email: applicantEmail,
            to_name: applicantName || applicantEmail,
            company_name: companyName,
            job_title: jobTitle,
            offer_link: offerLink,
        }, publicKey);

        alert(`🎉 Applicant selected!\nOffer letter email sent to ${applicantEmail}.`);
    } catch (err) {
        console.error("EmailJS error:", err);
        alert(`✅ Applicant marked as Selected!\n\n⚠️ Email failed to send. Offer letter link:\n${offerLink}`);
    } finally {
        location.reload();
    }
}