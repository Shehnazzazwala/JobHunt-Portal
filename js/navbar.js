import { auth, onAuthStateChanged, signOut } from "./firebase-config.js";
import { getNotifBellHTML, setupBellToggle, initNotifications, injectNotifDropdown } from "./notifications.js";

// ── Mobile Bottom Nav HTML ───────────────────────────────────────────────────
function getUserBottomNav() {
    return `
        <nav class="mobile-bottom-nav" id="mobile-bottom-nav" style="display:none;">
            <a href="find-jobs.html" class="mob-nav-item">
                <i class="fas fa-home"></i><span>Home</span>
            </a>
            <a href="applied-jobs.html" class="mob-nav-item">
                <i class="fas fa-clipboard-list"></i><span>Applied</span>
            </a>
            <a href="user-chats.html" class="mob-nav-item">
                <i class="fas fa-comments"></i><span>Chat</span>
            </a>
            <div class="mob-nav-item mob-notif-trigger" id="mob-notif-trigger">
                <i class="fas fa-bell"></i>
                <span class="mob-notif-badge" id="mob-notif-badge" style="display:none;">0</span>
                <span>Alerts</span>
            </div>
            <a href="profile.html" class="mob-nav-item">
                <i class="fas fa-user"></i><span>Profile</span>
            </a>
        </nav>`;
}

function getCompanyBottomNav() {
    return `
        <nav class="mobile-bottom-nav" id="mobile-bottom-nav" style="display:none;">
            <a href="company-dashboard.html" class="mob-nav-item">
                <i class="fas fa-plus-circle"></i><span>Post Job</span>
            </a>
            <a href="company-applications.html" class="mob-nav-item">
                <i class="fas fa-users"></i><span>Applicants</span>
            </a>
            <a href="company-chats.html" class="mob-nav-item">
                <i class="fas fa-comments"></i><span>Chat</span>
            </a>
            <div class="mob-nav-item mob-notif-trigger" id="mob-notif-trigger">
                <i class="fas fa-bell"></i>
                <span class="mob-notif-badge" id="mob-notif-badge" style="display:none;">0</span>
                <span>Alerts</span>
            </div>
            <a href="manage-company.html" class="mob-nav-item">
                <i class="fas fa-building"></i><span>Profile</span>
            </a>
        </nav>`;
}

// ── Highlight active bottom-nav item based on current URL ────────────────────
function highlightActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.mob-nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && href === path) {
            item.classList.add('active');
        }
    });
}

// ── Sync mobile badge with desktop badge ─────────────────────────────────────
function syncMobileBadge() {
    const observer = new MutationObserver(() => {
        const dBadge = document.getElementById('notif-badge');
        const mBadge = document.getElementById('mob-notif-badge');
        if (dBadge && mBadge) {
            mBadge.textContent = dBadge.textContent;
            mBadge.style.display = dBadge.style.display;
        }
    });
    const dBadge = document.getElementById('notif-badge');
    if (dBadge) observer.observe(dBadge, { childList: true, attributes: true, attributeFilter: ['style'] });
}

// ── Setup mobile notification trigger ────────────────────────────────────────
function setupMobileNotifTrigger() {
    // Check if we already have a listener (avoid duplicates)
    if (window.mobNotifListenerSet) return;

    // Direct click handler on the trigger
    const trigger = document.getElementById('mob-notif-trigger');
    const dropdown = document.getElementById('notif-dropdown');

    if (trigger && dropdown) {
        trigger.onclick = (e) => {
            e.stopPropagation();
            const isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
            dropdown.style.display = isHidden ? 'block' : 'none';
            console.log(`🔔 Mobile Alert Toggle: ${isHidden ? 'OPEN' : 'CLOSED'}`);
        };
        window.mobNotifListenerSet = true;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// USER NAVBAR
// ══════════════════════════════════════════════════════════════════════════════
export function loadUserNavbar() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;

    nav.innerHTML = `
        <a href="find-jobs.html" class="logo">JobHunt</a>
        <div class="nav-links">
            <a href="find-jobs.html" class="desktop-only">Find Jobs</a>
            <a href="applied-jobs.html" id="nav-applied" class="desktop-only" style="display:none;">Jobs Applied</a>
            <a href="profile.html" id="nav-profile" class="desktop-only" style="display:none;">My Profile</a>
            ${getNotifBellHTML()}
            <a href="auth.html" id="nav-login" class="btn-primary">Login</a>
            <button id="nav-logout" class="mobile-logout-btn" style="display:none;">
                <i class="fas fa-sign-out-alt"></i> <span class="logout-text">Logout</span>
            </button>
        </div>
    `;

    // Insert mobile bottom nav (if not already present)
    if (!document.getElementById('mobile-bottom-nav')) {
        document.body.insertAdjacentHTML('beforeend', getUserBottomNav());
    }

    injectNotifDropdown();

    onAuthStateChanged(auth, (user) => {
        const loginBtn = document.getElementById('nav-login');
        const logoutBtn = document.getElementById('nav-logout');
        const profileLink = document.getElementById('nav-profile');
        const appliedLink = document.getElementById('nav-applied');
        const notifWrapper = document.getElementById('notif-wrapper');
        const mobileNav = document.getElementById('mobile-bottom-nav');

        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (profileLink) profileLink.style.display = 'inline';
            if (appliedLink) appliedLink.style.display = 'inline';
            if (notifWrapper) notifWrapper.style.display = 'inline-block';
            if (mobileNav) mobileNav.style.display = '';
            setupBellToggle();
            initNotifications(user.uid, 'user');
            syncMobileBadge();
            setupMobileNotifTrigger();
            highlightActiveNav();
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (profileLink) profileLink.style.display = 'none';
            if (appliedLink) appliedLink.style.display = 'none';
            if (notifWrapper) notifWrapper.style.display = 'none';
            if (mobileNav) mobileNav.style.display = 'none';
        }
    });

    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => { window.location.href = "index.html"; });
        });
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPANY NAVBAR
// ══════════════════════════════════════════════════════════════════════════════
export function loadCompanyNavbar() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;

    nav.innerHTML = `
        <div class="logo">Company Panel</div>
        <div class="nav-links">
            <a href="company-dashboard.html" class="desktop-only">Dashboard</a>
            <a href="manage-company.html" class="desktop-only">Manage Profile</a>
            <a href="company-applications.html" class="desktop-only">View Applicants</a>
            ${getNotifBellHTML()}
            <button id="nav-logout" class="mobile-logout-btn">
                <i class="fas fa-sign-out-alt"></i> <span class="logout-text">Logout</span>
            </button>
        </div>
    `;

    // Insert mobile bottom nav (if not already present)
    if (!document.getElementById('mobile-bottom-nav')) {
        document.body.insertAdjacentHTML('beforeend', getCompanyBottomNav());
    }

    injectNotifDropdown();

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const mobileNav = document.getElementById('mobile-bottom-nav');
            if (mobileNav) mobileNav.style.display = '';
            setupBellToggle();
            initNotifications(user.uid, 'company');
            syncMobileBadge();
            setupMobileNotifTrigger();
            highlightActiveNav();
        }
    });

    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => { window.location.href = "index.html"; });
        });
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN NAVBAR & SECTION SWITCHING
// ══════════════════════════════════════════════════════════════════════════════

function getAdminBottomNav() {
    return `
        <nav class="mobile-bottom-nav" id="mobile-bottom-nav">
            <div class="mob-nav-item active" onclick="showAdminSection('admin-stats', this)">
                <i class="fas fa-chart-line"></i><span>Stats</span>
            </div>
            <div class="mob-nav-item" onclick="showAdminSection('admin-companies', this)">
                <i class="fas fa-building"></i><span>Companies</span>
            </div>
            <div class="mob-nav-item" onclick="showAdminSection('admin-users', this)">
                <i class="fas fa-users"></i><span>Users</span>
            </div>
        </nav>`;
}

window.showAdminSection = (sectionId, el) => {
    const sections = ['admin-stats', 'admin-companies', 'admin-users'];

    // Only apply toggle logic on mobile
    if (window.innerWidth <= 600) {
        sections.forEach(id => {
            const s = document.getElementById(id);
            if (s) s.style.display = (id === sectionId) ? 'block' : 'none';
        });

        // Update active class in bottom nav
        if (el) {
            document.querySelectorAll('#mobile-bottom-nav .mob-nav-item').forEach(item => item.classList.remove('active'));
            el.classList.add('active');
        }
        window.scrollTo(0, 0);
    } else {
        // On desktop, maybe just scroll to the section
        const target = document.getElementById(sectionId);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
};

export function loadAdminNavbar() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;

    nav.innerHTML = `
        <div class="logo" style="color:white;">JobHunt <span style="color:#9ca3af; font-size:0.8rem;">ADMIN</span></div>
        <div class="nav-links">
            <button id="nav-logout" class="mobile-logout-btn" style="display:inline-flex;">
                <i class="fas fa-sign-out-alt"></i> <span class="logout-text">Logout</span>
            </button>
        </div>
    `;
    nav.style.background = "#1f2937";
    nav.style.color = "white";

    // Insert admin bottom nav
    if (!document.getElementById('mobile-bottom-nav')) {
        document.body.insertAdjacentHTML('beforeend', getAdminBottomNav());
    }

    // Initial mobile view setup
    setTimeout(() => {
        if (window.innerWidth <= 600) {
            window.showAdminSection('admin-stats');
        }
    }, 100);

    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => { window.location.href = "admin-auth.html"; });
        });
    }
}
