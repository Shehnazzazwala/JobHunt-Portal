import {
    auth, db, onAuthStateChanged,
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
    doc, getDoc, updateDoc
} from "./firebase-config.js";
import { createNotification } from "./notifications.js";

const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get('appId');

if (!appId) {
    alert("Invalid chat link.");
    window.location.href = "applied-jobs.html";
}

const messagesContainer = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('chat-send');
const chatNameEl = document.getElementById('chat-name');

// Load company name from the application doc
async function loadCompanyName() {
    try {
        const snap = await getDoc(doc(db, "applications", appId));
        if (snap.exists()) {
            chatNameEl.innerText = snap.data().companyName || "Company";
        }
    } catch (e) {
        chatNameEl.innerText = "Company";
    }
}

function renderMessage(msg) {
    const isMe = msg.sender === 'applicant';
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
            messagesContainer.innerHTML = '<div class="chat-empty"><i class="fas fa-comment-dots"></i><p>No messages yet.<br>The company hasn\'t written yet.</p></div>';
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
            sender: 'applicant',
            timestamp: serverTimestamp()
        });

        // Flag application as having an active chat
        await updateDoc(doc(db, "applications", appId), { chatStarted: true });

        // Notify company
        const appSnap = await getDoc(doc(db, "applications", appId));
        if (appSnap.exists()) {
            const a = appSnap.data();

            // Get sender's full name if possible
            let senderName = auth.currentUser?.email || 'Applicant';
            try {
                const uSnap = await getDoc(doc(db, "users", a.userId));
                if (uSnap.exists()) senderName = uSnap.data().fullName || senderName;
            } catch (_) { }

            createNotification(
                a.companyId, 'company', 'message',
                `New message from ${senderName}`,
                text.length > 80 ? text.substring(0, 80) + '...' : text,
                `company-chat.html?appId=${appId}&userId=${a.userId}`
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
        window.location.href = "auth.html";
        return;
    }
    loadCompanyName();
    listenMessages();
});
