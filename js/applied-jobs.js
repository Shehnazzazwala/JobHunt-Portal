import { auth, db, doc, onAuthStateChanged, collection, query, where, getDocs, updateDoc } from "./firebase-config.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loadAppliedJobs(user.uid);
    } else {
        window.location.href = "auth.html";
    }
});

async function loadAppliedJobs(uid) {
    const list = document.getElementById('applied-jobs-list');
    list.innerHTML = "<p>Loading applications...</p>";

    try {
        const q = query(collection(db, "applications"), where("userId", "==", uid));
        const querySnapshot = await getDocs(q);

        list.innerHTML = "";

        if (querySnapshot.empty) {
            list.innerHTML = "<p>No applications yet.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const app = docSnap.data();
            const appId = docSnap.id;
            const div = document.createElement('div');
            div.className = "job-card";
            div.style.flexDirection = "column";
            div.style.alignItems = "stretch";;

            // ── Rejection notification banner ────────────────────────────────
            const rejectionBanner = (app.status === 'Rejected' && !app.rejectedNotified)
                ? `<div class="rejection-banner" id="rej-banner-${appId}">
                    <div style="display:flex; align-items:flex-start; gap:0.75rem;">
                        <i class="fas fa-times-circle" style="font-size:1.2rem; margin-top:2px; flex-shrink:0;"></i>
                        <div>
                            <strong>Application Update</strong>
                            <p style="margin:0.2rem 0 0; font-size:0.87rem; opacity:0.85;">
                                We're sorry — the company has not moved forward with your application for
                                <strong>${app.jobTitle}</strong> at this time. Don't be discouraged; keep applying!
                            </p>
                        </div>
                    </div>
                    <button class="rej-dismiss-btn" onclick="dismissRejection('${appId}')">
                        <i class="fas fa-times"></i>
                    </button>
                   </div>`
                : '';

            // ── Interview badge ──────────────────────────────────────────────
            const interviewBlock = app.interview ? `
                <div class="interview-badge" style="margin-top:0.75rem;">
                    <i class="fas fa-calendar-check"></i>
                    <strong>Interview Scheduled</strong>
                    <span>${app.interview.date} at ${app.interview.time}</span>
                    ${app.interview.notes ? `<em style="color:var(--text-light);">${app.interview.notes}</em>` : ''}
                </div>
            ` : '';

            // ── Offer letter link ────────────────────────────────────────────
            const offerBlock = (app.status === 'Selected') ? `
                <a href="offer-letter.html?appId=${appId}" class="offer-letter-link">
                    <i class="fas fa-envelope-open-text"></i>
                    ${app.offerAccepted ? '✅ Offer Accepted — View Letter' : '🎉 View Your Offer Letter'}
                </a>
            ` : '';

            div.innerHTML = `
                ${rejectionBanner}
                <div class="section-header-row" style="flex-wrap:wrap; gap:0.5rem;">
                    <div>
                        <h4 style="margin:0; color:var(--text); font-size:1.1rem;">${app.jobTitle}</h4>
                        <span class="btn-link" style="font-size:0.9rem;">${app.companyName || 'Company'}</span>
                        <div class="meta-row" style="font-size:0.82rem; margin-top:4px;">
                            Applied on: ${new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                    </div>
                    <span class="status-badge status-${cssStatus(app.status)}">
                        ${app.status || 'Pending'}
                    </span>
                </div>
                ${interviewBlock}
                ${offerBlock}
                <div style="margin-top:0.75rem;">
                    <a href="applicant-chat.html?appId=${appId}" class="btn-sm btn-chat">
                        <i class="fas fa-comment-dots"></i> Chat with Company
                    </a>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading applications:", error);
        list.innerHTML = "<p>Error loading applications.</p>";
    }
}

function cssStatus(s) { return (s || 'Pending').replace(/\s+/g, '-'); }

// Dismiss rejection banner and mark as notified in Firestore
window.dismissRejection = async (appId) => {
    const banner = document.getElementById(`rej-banner-${appId}`);
    if (banner) {
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(-8px)';
        banner.style.transition = 'all 0.3s ease';
        setTimeout(() => banner.remove(), 300);
    }
    try {
        await updateDoc(doc(db, "applications", appId), { rejectedNotified: true });
    } catch (e) {
        console.error("Error dismissing notification:", e);
    }
};
