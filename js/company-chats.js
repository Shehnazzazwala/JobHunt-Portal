import { auth, db, collection, query, where, getDocs, onAuthStateChanged } from "./firebase-config.js";

const chatsList = document.getElementById('chats-list');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loadCompanyChats(user.uid);
    } else {
        window.location.href = "company-signup.html";
    }
});

async function loadCompanyChats(companyUid) {
    try {
        // Query applications for this company where chat has started
        const q = query(
            collection(db, "applications"),
            where("companyId", "==", companyUid),
            where("chatStarted", "==", true)
        );

        const snap = await getDocs(q);
        chatsList.innerHTML = "";

        if (snap.empty) {
            chatsList.innerHTML = `
                <div class="notif-empty" style="margin-top: 3rem;">
                    <i class="fas fa-comment-slash"></i>
                    <p>No active chats yet.<br>Go to Applicants to start a conversation!</p>
                </div>`;
            return;
        }

        snap.forEach(docSnap => {
            const app = docSnap.data();
            const appId = docSnap.id;

            const card = document.createElement('div');
            card.className = "card chat-list-card";
            card.innerHTML = `
                <div class="section-header-row" style="margin-bottom: 0;">
                    <div>
                        <h3 style="margin-bottom: 4px;">${app.applicantName || app.applicantEmail || 'Applicant'}</h3>
                        <p style="font-size: 0.9rem; color: var(--text-light); margin: 0;">
                            <i class="fas fa-briefcase" style="font-size: 0.8rem;"></i> ${app.jobTitle}
                        </p>
                    </div>
                    <a href="company-chat.html?appId=${appId}&userId=${app.userId}" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        <i class="fas fa-comment"></i> Open Chat
                    </a>
                </div>
            `;
            chatsList.appendChild(card);
        });

    } catch (e) {
        console.error("Load company chats error:", e);
        chatsList.innerHTML = "<p>Error loading chats. Please try again later.</p>";
    }
}
