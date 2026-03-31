import {
    db, collection, addDoc, query, where, onSnapshot,
    doc, updateDoc, getDocs, deleteDoc, serverTimestamp
} from "./firebase-config.js";

// ══════════════════════════════════════════════════════════════════════════════
// CREATE NOTIFICATION
// ══════════════════════════════════════════════════════════════════════════════
export async function createNotification(recipientId, recipientType, type, title, body, link) {
    try {
        await addDoc(collection(db, "notifications"), {
            recipientKey: `${recipientType}_${recipientId}`,
            type,
            title,
            body,
            link,
            read: false,
            createdAt: serverTimestamp()
        });
        console.log(`✅ Notification created: [${type}] → ${recipientType}_${recipientId}`);
    } catch (e) {
        console.error("❌ Error creating notification:", e);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// MARK AS READ
// ══════════════════════════════════════════════════════════════════════════════
export async function markAsRead(notifId) {
    try {
        await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (e) {
        console.error("Error marking notification as read:", e);
    }
}

export async function markAllAsRead(uid, recipientType) {
    try {
        const key = `${recipientType}_${uid}`;
        const q = query(collection(db, "notifications"), where("recipientKey", "==", key));
        const snap = await getDocs(q);
        const promises = [];
        snap.forEach(d => {
            if (!d.data().read) {
                promises.push(updateDoc(doc(db, "notifications", d.id), { read: true }));
            }
        });
        await Promise.all(promises);
    } catch (e) {
        console.error("Error marking all as read:", e);
    }
}

export async function clearReadNotifications(uid, recipientType) {
    try {
        const key = `${recipientType}_${uid}`;
        const q = query(collection(db, "notifications"), where("recipientKey", "==", key));
        const snap = await getDocs(q);
        const promises = [];
        snap.forEach(d => {
            if (d.data().read) {
                promises.push(deleteDoc(doc(db, "notifications", d.id)));
            }
        });
        await Promise.all(promises);
        console.log(`🗑️ Cleared ${promises.length} read notifications`);
    } catch (e) {
        console.error("Error clearing read notifications:", e);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ICON & COLOR HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function getIcon(type) {
    const icons = {
        message: 'fas fa-comment-dots',
        interview: 'fas fa-calendar-check',
        selected: 'fas fa-trophy',
        rejected: 'fas fa-times-circle',
        new_application: 'fas fa-user-plus'
    };
    return icons[type] || 'fas fa-bell';
}

function getColor(type) {
    const colors = {
        message: '#6366f1',
        interview: '#3b82f6',
        selected: '#22c55e',
        rejected: '#ef4444',
        new_application: '#f59e0b'
    };
    return colors[type] || '#64748b';
}

function timeAgo(date) {
    if (!date) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
}

// ══════════════════════════════════════════════════════════════════════════════
// INIT — REAL-TIME LISTENER (single where clause = no composite index needed)
// ══════════════════════════════════════════════════════════════════════════════
export function initNotifications(uid, recipientType) {
    const key = `${recipientType}_${uid}`;
    console.log(`🔔 Initializing notifications for: ${key}`);

    const q = query(
        collection(db, "notifications"),
        where("recipientKey", "==", key)
    );

    onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach(d => notifications.push({ id: d.id, ...d.data() }));

        // Client-side sort: newest first
        notifications.sort((a, b) => {
            const at = a.createdAt?.toDate?.() || new Date(0);
            const bt = b.createdAt?.toDate?.() || new Date(0);
            return bt - at;
        });

        const unreadCount = notifications.filter(n => !n.read).length;
        console.log(`🔔 Notifications loaded: ${notifications.length} total, ${unreadCount} unread`);

        // Update badge
        const badge = document.getElementById('notif-badge');
        if (badge) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        // Update dropdown list
        const listEl = document.querySelector('#notif-dropdown .notif-list');
        if (!listEl) return;

        if (notifications.length === 0) {
            listEl.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
            return;
        }

        listEl.innerHTML = notifications.slice(0, 20).map(n => {
            const time = n.createdAt?.toDate ? timeAgo(n.createdAt.toDate()) : '';
            const cls = n.read ? 'notif-item' : 'notif-item unread';
            const safeLink = (n.link || '#').replace(/'/g, "\\'");
            return `
                <div class="${cls}" onclick="handleNotifClick('${n.id}', '${safeLink}')">
                    <div class="notif-icon" style="color:${getColor(n.type)}">
                        <i class="${getIcon(n.type)}"></i>
                    </div>
                    <div class="notif-content">
                        <div class="notif-title">${n.title}</div>
                        <div class="notif-body">${n.body}</div>
                        <div class="notif-time">${time}</div>
                    </div>
                </div>`;
        }).join('');

    }, (error) => {
        console.error("❌ Notification listener error:", error);
    });

    window.markAllNotifsRead = () => markAllAsRead(uid, recipientType);
    window.clearReadNotifs = () => clearReadNotifications(uid, recipientType);
}

// Global handlers — outside init for reliability
window.handleNotifClick = async (notifId, link) => {
    console.log(`🔔 Notification CLICKED: id=${notifId}, link=${link}`);

    // Attempt to mark as read, but don't block redirection indefinitely
    markAsRead(notifId).catch(err => console.error("❌ markAsRead failed:", err));

    if (link && link !== '#') {
        console.log(`🚀 Navigating to: ${link}`);
        // Small delay to ensure Firestore call starts, then redirect
        setTimeout(() => {
            window.location.href = link;
        }, 100);
    } else {
        console.log("ℹ️ No link provided for this notification");
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// BELL & DROPDOWN HTML
// ══════════════════════════════════════════════════════════════════════════════
export function getNotifBellHTML() {
    return `
        <div class="notif-wrapper" id="notif-wrapper">
            <button class="notif-bell" id="notif-bell-btn" title="Notifications">
                <i class="fas fa-bell"></i>
                <span class="notif-badge" id="notif-badge" style="display:none;">0</span>
            </button>
        </div>`;
}

export function getNotifDropdownHTML() {
    return `
        <div class="notif-dropdown" id="notif-dropdown" style="display:none;">
            <div class="notif-header">
                <h4>Notifications</h4>
                <div class="notif-header-actions">
                    <button class="notif-mark-read" onclick="markAllNotifsRead()">Mark all read</button>
                    <button class="notif-mark-read notif-clear-btn" onclick="clearReadNotifs()"><i class="fas fa-trash-alt"></i> Clear read</button>
                </div>
            </div>
            <div class="notif-list">
                <div class="notif-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>
            </div>
        </div>`;
}

/**
 * Injects the notification dropdown at the body level to ensure it
 * bypasses navbar constraints (z-index/overflow/backdrop-filter).
 */
export function injectNotifDropdown() {
    if (document.getElementById('notif-dropdown')) return;
    document.body.insertAdjacentHTML('beforeend', getNotifDropdownHTML());
}

export function setupBellToggle() {
    const btn = document.getElementById('notif-bell-btn');
    // Important: might need 10ms for DOM to catch up after injection
    setTimeout(() => {
        const dd = document.getElementById('notif-dropdown');
        if (!btn || !dd) return;

        btn.onclick = (e) => {
            e.stopPropagation();
            dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
        };

        document.addEventListener('click', (e) => {
            if (e.target.closest('#notif-wrapper') || e.target.closest('#notif-dropdown') || e.target.closest('#mob-notif-trigger')) return;
            dd.style.display = 'none';
        });
    }, 10);
}
