import { auth, db, getDocs, collection, onAuthStateChanged, doc, getDoc } from "./firebase-config.js";

const jobList = document.getElementById('job-list');

// 1. Check Auth for Greeting (handled by navbar.js for links)
// We keep this if there are other UI elements to update, but currently it only updated nav links which are now managed by navbar.js.
// So we can remove it or keep it empty if we want to add user-specific non-nav UI later.
// For now, removing the nav link toggling.

// 2. Load Real Jobs from Firestore
// 2. Load & Filter Jobs
let allJobs = [];
let userProfile = null;
let extractor = null;

// Initialize SBERT model
async function initSBERT() {
    if (extractor) return extractor;
    try {
        const { pipeline, env } = window.transformers;
        env.allowLocalModels = false;
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        return extractor;
    } catch (e) {
        console.error("SBERT initialization failed", e);
        return null;
    }
}

// Cosine Similarity
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

let isLoggedIn = false;

async function loadJobs() {
    jobList.innerHTML = "<div style='text-align:center; padding: 2rem;'><i class='fas fa-circle-notch fa-spin'></i> Loading jobs...</div>";

    try {
        const querySnapshot = await getDocs(collection(db, "jobs"));
        allJobs = [];
        querySnapshot.forEach(doc => {
            allJobs.push({ id: doc.id, ...doc.data() });
        });

        // Load user profile for semantic search
        onAuthStateChanged(auth, async (user) => {
            isLoggedIn = !!user;

            // Hide/show filter button based on login
            const filterBtn = document.getElementById('filter-toggle-btn');
            if (filterBtn) filterBtn.style.display = isLoggedIn ? '' : 'none';

            if (user) {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    userProfile = docSnap.data();
                }
            }
            renderJobs(allJobs);
        });
    } catch (error) {
        console.error(error);
        jobList.innerHTML = "<p>Error loading jobs.</p>";
    }
}

function renderJobs(jobs) {
    jobList.innerHTML = "";

    if (jobs.length === 0) {
        jobList.innerHTML = "<p>No jobs found matching your criteria.</p>";
        return;
    }

    jobs.forEach((job) => {
        const datePosted = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently';
        const smartPercent = job.similarity ? ` · <span class="match-badge">${Math.round(job.similarity * 100)}% Match</span>` : '';

        const div = document.createElement('div');
        div.className = "job-card";

        if (isLoggedIn) {
            // Full card for logged-in users
            div.innerHTML = `
                <div class="job-info">
                    <h3>${job.title}${smartPercent}</h3>
                    <p>
                        <a href="company-details.html?id=${job.companyId}" class="btn-link">
                            ${job.companyName}
                        </a>
                    </p>
                    <div class="meta-row">
                        <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Location not specified'}</span>
                        <span><i class="fas fa-briefcase"></i> ${job.jobType || 'Type not specified'}</span>
                        <span><i class="fas fa-clock"></i> ${datePosted}</span>
                        <span class="vacancy-badge"><i class="fas fa-users"></i> ${job.vacancies || 1} Vacancies</span>
                    </div>
                    <p class="job-description-teaser">${job.description.substring(0, 150)}...</p>
                    <div class="tags">
                        <span>${job.salary || "Salary Negotiable"}</span>
                    </div>
                </div>
                <a href="view-job.html?id=${job.id}" class="btn-primary">View Details</a>
            `;
        } else {
            // Blurred teaser card for logged-out users
            div.innerHTML = `
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <p><strong>${job.companyName}</strong></p>
                    <div class="job-blur-overlay">
                        <div class="blurred-content">
                            <div class="meta-row">
                                <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Location not specified'}</span>
                                <span><i class="fas fa-briefcase"></i> ${job.jobType || 'Type not specified'}</span>
                                <span><i class="fas fa-clock"></i> ${datePosted}</span>
                            </div>
                            <p class="job-description-teaser">${job.description.substring(0, 150)}...</p>
                            <div class="tags">
                                <span>${job.salary || "Salary Negotiable"}</span>
                            </div>
                        </div>
                        <div class="login-prompt">
                            <i class="fas fa-lock"></i>
                            <span>Login to view details</span>
                        </div>
                    </div>
                </div>
            `;
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                window.location.href = 'auth.html';
            });
        }

        jobList.appendChild(div);
    });
}

// Filter Logic
async function applyFilters() {
    const dateFilter = document.getElementById('filter-date').value;
    const locationFilter = document.getElementById('filter-location').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const smartMatch = document.getElementById('toggle-smart-match').checked;

    let filtered = allJobs.filter(job => {
        // Date Filter
        if (dateFilter !== 'any' && job.createdAt) {
            const jobDate = new Date(job.createdAt);
            const now = new Date();
            const diffHours = (now - jobDate) / (1000 * 60 * 60);

            if (dateFilter === '24h' && diffHours > 24) return false;
            if (dateFilter === '7d' && diffHours > 7 * 24) return false;
            if (dateFilter === '30d' && diffHours > 30 * 24) return false;
        }

        // Location Filter
        if (locationFilter && (!job.location || !job.location.toLowerCase().includes(locationFilter))) {
            return false;
        }

        // Type Filter
        if (typeFilter !== 'any' && job.jobType !== typeFilter) {
            return false;
        }

        return true;
    });

    if (smartMatch && userProfile) {
        jobList.innerHTML = "<div style='text-align:center; padding: 2rem;'><i class='fas fa-magic fa-spin' style='color:var(--primary); font-size:2rem;'></i><p style='margin-top:10px;'>Personalizing your job feed with AI...<br><small style='opacity:0.6;'>(This may take a moment on first use)</small></p></div>";

        const model = await initSBERT();
        if (model) {
            try {
                // 1. Prep User Content for BERT
                // Include specific roles and companies from history for better matching
                const expHistoryText = (userProfile.experienceHistory || []).map(e => `${e.position} at ${e.company}`).join(' ');
                const userText = `${userProfile.jobTitle} ${expHistoryText} ${userProfile.certifications} ${userProfile.aboutMe || ''}`.toLowerCase();
                const userEmbedding = await model(userText, { pooling: 'mean', normalize: true });
                const userVec = userEmbedding.data;

                const userExp = parseFloat(userProfile.totalExperience) || 0;

                // 2. Rank Jobs
                for (let job of filtered) {
                    const jobText = `${job.title} ${job.description} ${job.requirements || ''} ${job.location}`.toLowerCase();

                    // Semantic Score (BERT)
                    const jobEmbedding = await model(jobText, { pooling: 'mean', normalize: true });
                    const semanticScore = cosineSimilarity(userVec, jobEmbedding.data);

                    // Experience Score (Numerical)
                    // Extract required years using a simple regex: "5+ years", "min 3 years", etc.
                    const expMatch = jobText.match(/(\d+)\s*(?:\+|plus)?\s*(?:years?|yrs?)/i);
                    const requiredExp = expMatch ? parseInt(expMatch[1]) : 0;

                    let expScore = 1.0;
                    if (requiredExp > 0) {
                        if (userExp >= requiredExp) {
                            expScore = 1.1; // Small bonus for meeting/exceeding requirement
                        } else {
                            // Penalty for lack of experience
                            const gap = requiredExp - userExp;
                            expScore = Math.max(0.3, 1.0 - (gap / 10)); // Max penalty 70%
                        }
                    }

                    // Keyword Bonus
                    let keywordBonus = 0;
                    if (userProfile.aboutMe) {
                        const keywords = userProfile.aboutMe.toLowerCase().split(/[ ,.]+/).filter(w => w.length > 3);
                        const matchCount = keywords.filter(k => jobText.includes(k)).length;
                        keywordBonus = (matchCount / (keywords.length || 1)) * 0.15;
                    }

                    // Final Hybrid Similarity
                    job.similarity = Math.min(1.0, (semanticScore * 0.7 + (expScore - 1.0) * 0.3) + keywordBonus);
                }

                // Sort by Similarity
                filtered.sort((a, b) => b.similarity - a.similarity);
            } catch (err) {
                console.error("Semantic search failed", err);
            }
        }
    } else {
        // Reset similarity if smart match disabled
        filtered.forEach(j => delete j.similarity);
    }

    renderJobs(filtered);
}

// Add Event Listeners for Filters
document.getElementById('filter-date').addEventListener('change', applyFilters);
document.getElementById('filter-location').addEventListener('input', applyFilters);
document.getElementById('filter-type').addEventListener('change', applyFilters);
document.getElementById('toggle-smart-match').addEventListener('change', applyFilters);

loadJobs();

// --- Filter Drawer Toggle Logic ---
const filterDrawer = document.getElementById('filter-drawer');
const filterBackdrop = document.getElementById('filter-backdrop');
const filterToggleBtn = document.getElementById('filter-toggle-btn');
const closeDrawerBtn = document.getElementById('close-drawer');

function toggleDrawer() {
    if (!filterDrawer || !filterBackdrop) return;
    filterDrawer.classList.toggle('active');
    filterBackdrop.classList.toggle('active');
    // Prevent scrolling when drawer is open
    document.body.style.overflow = filterDrawer.classList.contains('active') ? 'hidden' : '';
}

if (filterToggleBtn) filterToggleBtn.onclick = toggleDrawer;
if (closeDrawerBtn) closeDrawerBtn.onclick = toggleDrawer;
if (filterBackdrop) filterBackdrop.onclick = toggleDrawer;