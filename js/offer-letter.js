import { auth, db, doc, onAuthStateChanged, getDoc, updateDoc } from "./firebase-config.js";

const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get('appId');

const loadingEl = document.getElementById('offer-loading');
const cardEl = document.getElementById('offer-card');
const errorEl = document.getElementById('offer-error');

if (!appId) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
}

onAuthStateChanged(auth, async (user) => {
    if (!appId) return;

    try {
        const appSnap = await getDoc(doc(db, "applications", appId));

        if (!appSnap.exists()) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            return;
        }

        const app = appSnap.data();

        // Only Selected applicants should see this
        if (app.status !== 'Selected') {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            return;
        }

        // Load applicant name
        let applicantName = app.applicantEmail;
        try {
            if (app.userId) {
                const userSnap = await getDoc(doc(db, "users", app.userId));
                if (userSnap.exists()) applicantName = userSnap.data().fullName || applicantName;
            }
        } catch (_) { }

        // Load company name
        let companyName = app.companyName || "Our Company";

        // Populate the offer letter
        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

        document.getElementById('ol-company').innerText = companyName;
        document.getElementById('ol-company2').innerText = companyName;
        document.getElementById('ol-company3').innerText = companyName;
        document.getElementById('ol-company4').innerText = companyName;
        document.getElementById('ol-name').innerText = applicantName;
        document.getElementById('ol-job').innerText = app.jobTitle;
        document.getElementById('ol-job2').innerText = app.jobTitle;
        document.getElementById('ol-date').innerText = today;
        document.getElementById('ol-date2').innerText = today;

        // Offer already accepted?
        if (app.offerAccepted) {
            document.getElementById('ol-accepted').innerText = '✅ Accepted';
            document.getElementById('offer-actions').style.display = 'none';
            document.getElementById('offer-accepted-msg').style.display = 'flex';
        }

        loadingEl.style.display = 'none';
        cardEl.style.display = 'block';

    } catch (err) {
        console.error(err);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
    }
});

// Accept offer
window.acceptOffer = async () => {
    if (!appId) return;
    const btn = document.getElementById('accept-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
    try {
        await updateDoc(doc(db, "applications", appId), { offerAccepted: true, offerAcceptedAt: new Date().toISOString() });
        document.getElementById('ol-accepted').innerText = '✅ Accepted';
        document.getElementById('offer-actions').style.display = 'none';
        document.getElementById('offer-accepted-msg').style.display = 'flex';
    } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-handshake"></i> Accept Offer';
        alert("Error accepting offer. Please try again.");
    }
};
