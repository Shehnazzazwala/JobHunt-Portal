import {
    auth, db, onAuthStateChanged,
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
    doc, getDoc, updateDoc
} from "./firebase-config.js";
import { createNotification } from "./notifications.js";

const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get('appId');
const applicantUserId = urlParams.get('userId');

if (!appId) {
    alert("Invalid chat link.");
    window.location.href = "company-applications.html";
}

const messagesContainer = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('chat-send');
const chatNameEl = document.getElementById('chat-name');

// Load applicant name
async function loadApplicantName() {
    if (!applicantUserId) { chatNameEl.innerText = "Applicant"; return; }
    try {
        const snap = await getDoc(doc(db, "users", applicantUserId));
        if (snap.exists()) {
            chatNameEl.innerText = snap.data().fullName || snap.data().email || "Applicant";
        }
    } catch (e) {
        chatNameEl.innerText = "Applicant";
    }
}

function renderMessage(msg) {
    const isMe = msg.sender === 'company';
    const div = document.createElement('div');
    div.className = `chat-bubble ${isMe ? 'chat-bubble-right' : 'chat-bubble-left'}`;

    const time = msg.timestamp?.toDate
        ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    div.innerHTML = `
        <div class="bubble-text">${escapeHtml(msg.text)}</div>
        <div class="bubble-time">${time}</div>
    `;
    return div;
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function listenMessages() {
    const q = query(
        collection(db, "applications", appId, "messages"),
        orderBy("timestamp", "asc")
    );

    onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = '';
        if (snapshot.empty) {
            messagesContainer.innerHTML = '<div class="chat-empty"><i class="fas fa-comment-dots"></i><p>No messages yet.<br>Start the conversation!</p></div>';
            return;
        }
        snapshot.forEach(docSnap => {
            messagesContainer.appendChild(renderMessage(docSnap.data()));
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;

    try {
        await addDoc(collection(db, "applications", appId, "messages"), {
            text,
            sender: 'company',
            timestamp: serverTimestamp()
        });

        // Flag application as having an active chat
        await updateDoc(doc(db, "applications", appId), { chatStarted: true });

        // Notify applicant
        if (applicantUserId) {
            // Get company name from the application doc
            const appSnap = await getDoc(doc(db, "applications", appId));
            const companyName = appSnap.exists() ? (appSnap.data().companyName || 'Company') : 'Company';

            createNotification(
                applicantUserId, 'user', 'message',
                `New message from ${companyName}`,
                text.length > 80 ? text.substring(0, 80) + '...' : text,
                `applicant-chat.html?appId=${appId}`
            );
        }
    } catch (e) {
        console.error("Send error:", e);
        alert("Failed to send message.");
    } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "company-signup.html";
        return;
    }
    loadApplicantName();
    listenMessages();
});
