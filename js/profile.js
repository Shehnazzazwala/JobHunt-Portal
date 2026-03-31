import { auth, db, doc, getDoc, updateDoc, onAuthStateChanged, collection, query, where, getDocs } from "./firebase-config.js";

const viewMode = document.getElementById('view-mode');
const editMode = document.getElementById('edit-mode');
const editBtn = document.getElementById('edit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const profileForm = document.getElementById('profile-form');

let currentUserUid = null;

// 1. Check Auth & Load Data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUid = user.uid;
        loadUserData(user.uid);
        loadOfferLetters(user.uid);
    } else {
        window.location.href = "auth.html";
    }
});

// 2. Load User Data
async function loadUserData(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        populateFields(data);
    }
}

// ── Dynamic Experience Handling ──────────────────────────────────────────────
let experienceEntries = [];

// ── Dynamic Education Handling ───────────────────────────────────────────────
let educationEntries = [];

// ── Dynamic Projects Handling ────────────────────────────────────────────────
let projectEntries = [];

function populateFields(data) {
    // Populate View Mode
    document.getElementById('view-fullname').innerText = data.fullName || "Your Name";
    document.getElementById('view-title').innerText = data.jobTitle || "Job Title";
    document.getElementById('view-email').innerText = data.email || "";
    document.getElementById('view-location').innerText = data.location || "Location not set";
    document.getElementById('view-phone').innerText = data.phone || "Not set";
    document.getElementById('view-certs').innerText = data.certifications || "No certifications listed.";
    document.getElementById('view-aboutme').innerText = data.aboutMe || "Tell us about yourself...";

    const li = document.getElementById('view-linkedin');
    const gh = document.getElementById('view-github');
    if (li) {
        if (data.linkedin) {
            li.href = data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`;
            li.innerText = "LinkedIn";
            li.style.display = "inline";
        } else {
            li.style.display = "none";
        }
    }
    if (gh) {
        if (data.github) {
            gh.href = data.github.startsWith('http') ? data.github : `https://${data.github}`;
            gh.innerText = "GitHub";
            gh.style.display = "inline";
        } else {
            gh.style.display = "none";
        }
    }

    // Handle Experience History
    experienceEntries = data.experienceHistory || [];
    renderExperienceView();
    renderExperienceEdit();

    // Handle Education History
    educationEntries = data.educationHistory || [];
    renderEducationView();
    renderEducationEdit();

    // Handle Projects History
    projectEntries = data.projectsHistory || [];
    renderProjectsView();
    renderProjectsEdit();

    // Populate Edit Mode (Inputs)
    document.getElementById('p-fullname').value = data.fullName || "";
    document.getElementById('p-email').value = data.email || "";
    document.getElementById('p-title').value = data.jobTitle || "";
    document.getElementById('p-location').value = data.location || "";
    document.getElementById('p-phone').value = data.phone || "";
    document.getElementById('p-linkedin').value = data.linkedin || "";
    document.getElementById('p-github').value = data.github || "";
    // (education is now dynamic entries, no textarea to populate)
    document.getElementById('p-certs').value = data.certifications || "";
    document.getElementById('p-aboutme').value = data.aboutMe || "";
    // (projects is now dynamic entries, no textarea to populate)
    document.getElementById('p-skills').value = data.skills || "";
}

function renderExperienceView() {
    const list = document.getElementById('view-experience-list');
    const totalExpEl = document.getElementById('view-total-exp');
    list.innerHTML = '';

    let totalYears = 0;
    if (experienceEntries.length === 0) {
        list.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No experience listed.</p>';
        totalExpEl.innerText = '(Total: 0 Yrs)';
        return;
    }

    experienceEntries.forEach(exp => {
        const yrs = parseFloat(exp.years) || 0;
        totalYears += yrs;
        const div = document.createElement('div');
        div.className = "exp-item";
        div.innerHTML = `
            <div class="exp-header">
                <div>
                    <h4 style="margin:0; color:var(--text);">${exp.position}</h4>
                    <p class="exp-company">${exp.company}</p>
                </div>
                <span class="exp-years">${yrs} Yrs</span>
            </div>
            ${exp.description ? `<p style="margin-top:0.75rem; font-size:0.9rem; color:var(--text-light); line-height:1.6; white-space:pre-line;">${exp.description}</p>` : ''}
        `;
        list.appendChild(div);
    });
    totalExpEl.innerText = `(Total: ${totalYears} Yrs)`;
}

function renderEducationView() {
    const list = document.getElementById('view-education-list');
    list.innerHTML = '';

    if (educationEntries.length === 0) {
        list.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No education listed.</p>';
        return;
    }

    educationEntries.forEach(edu => {
        const div = document.createElement('div');
        div.className = "edu-item";
        div.innerHTML = `
            <div class="edu-header">
                <div>
                    <h4 style="margin:0; color:var(--text);">${edu.degree}</h4>
                    <p class="edu-institution">${edu.institution}</p>
                    ${edu.cgpa ? `<p style="margin:4px 0 0; font-size:0.85rem; color:var(--text-light);"><i class="fas fa-chart-line" style="margin-right:4px;"></i>${edu.cgpa}</p>` : ''}
                </div>
                <span class="edu-year">${edu.year}</span>
            </div>
        `;
        list.appendChild(div);
    });
}

function renderEducationEdit() {
    const list = document.getElementById('edit-education-list');
    list.innerHTML = '';

    educationEntries.forEach((edu, index) => {
        const div = document.createElement('div');
        div.className = "edu-item card-sm";
        div.innerHTML = `
            <div class="grid-2">
                <div class="form-group">
                    <label>Degree / Course</label>
                    <input type="text" value="${edu.degree}" onchange="updateEdu(${index}, 'degree', this.value)" placeholder="e.g. B.Tech Computer Science">
                </div>
                <div class="form-group">
                    <label>Institution</label>
                    <input type="text" value="${edu.institution}" onchange="updateEdu(${index}, 'institution', this.value)" placeholder="e.g. MIT">
                </div>
                <div class="form-group">
                    <label>Year</label>
                    <input type="text" value="${edu.year}" onchange="updateEdu(${index}, 'year', this.value)" placeholder="e.g. 2020 - 2024">
                </div>
                <div class="form-group">
                    <label>CGPA / Percentage</label>
                    <input type="text" value="${edu.cgpa || ''}" onchange="updateEdu(${index}, 'cgpa', this.value)" placeholder="e.g. 8.5 CGPA or 85%">
                </div>
                <div class="form-group" style="display: flex; align-items: flex-end;">
                    <button type="button" onclick="removeEdu(${index})" class="btn-sm btn-reject" style="width: 100%; padding: 12px;">Remove Row</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

function renderProjectsView() {
    const list = document.getElementById('view-projects-list');
    list.innerHTML = '';

    if (projectEntries.length === 0) {
        list.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No projects listed.</p>';
        return;
    }

    projectEntries.forEach(proj => {
        const div = document.createElement('div');
        div.className = "proj-item";
        div.innerHTML = `
            <h4 style="margin:0; color:var(--text); font-weight:700;">${proj.title}</h4>
            ${proj.subtitle ? `<p style="margin:4px 0 0; font-style:italic; color:var(--primary); font-size:0.9rem;">${proj.subtitle}</p>` : ''}
            ${proj.description ? `<p style="margin-top:0.75rem; font-size:0.9rem; color:var(--text-light); line-height:1.6; white-space:pre-line;">${proj.description}</p>` : ''}
        `;
        list.appendChild(div);
    });
}

function renderProjectsEdit() {
    const list = document.getElementById('edit-projects-list');
    list.innerHTML = '';

    projectEntries.forEach((proj, index) => {
        const div = document.createElement('div');
        div.className = "proj-item card-sm";
        div.innerHTML = `
            <div class="grid-2">
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${proj.title}" onchange="updateProj(${index}, 'title', this.value)" placeholder="e.g. E-Commerce Platform">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" value="${proj.subtitle || ''}" onchange="updateProj(${index}, 'subtitle', this.value)" placeholder="e.g. React, Node.js, MongoDB">
                </div>
                <div class="form-group full-width" style="grid-column: 1 / -1;">
                    <label>Description</label>
                    <textarea rows="3" onchange="updateProj(${index}, 'description', this.value)" placeholder="Describe the project, your role, and key outcomes...">${proj.description || ''}</textarea>
                </div>
                <div class="form-group" style="display: flex; align-items: flex-end;">
                    <button type="button" onclick="removeProj(${index})" class="btn-sm btn-reject" style="width: 100%; padding: 12px;">Remove Row</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

function renderExperienceEdit() {
    const list = document.getElementById('edit-experience-list');
    list.innerHTML = '';

    experienceEntries.forEach((exp, index) => {
        const div = document.createElement('div');
        div.className = "exp-item card-sm";
        div.innerHTML = `
            <div class="grid-2">
                <div class="form-group">
                    <label>Position</label>
                    <input type="text" value="${exp.position}" onchange="updateExp(${index}, 'position', this.value)" placeholder="e.g. Lead Developer">
                </div>
                <div class="form-group">
                    <label>Company</label>
                    <input type="text" value="${exp.company}" onchange="updateExp(${index}, 'company', this.value)" placeholder="e.g. Google">
                </div>
                <div class="form-group">
                    <label>Years Served</label>
                    <input type="number" step="1" value="${exp.years}" onchange="updateExp(${index}, 'years', this.value)" placeholder="e.g. 3">
                </div>
                <div class="form-group" style="display: flex; align-items: flex-end;">
                    <button type="button" onclick="removeExp(${index})" class="btn-sm btn-reject" style="width: 100%; padding: 12px;">Remove Row</button>
                </div>
                <div class="form-group full-width" style="grid-column: 1 / -1;">
                    <label>Description</label>
                    <textarea rows="3" onchange="updateExp(${index}, 'description', this.value)" placeholder="Describe your role, responsibilities, and key achievements...">${exp.description || ''}</textarea>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

window.updateExp = (index, field, value) => {
    experienceEntries[index][field] = value;
};

window.removeExp = (index) => {
    experienceEntries.splice(index, 1);
    renderExperienceEdit();
};

document.getElementById('add-exp-btn').addEventListener('click', () => {
    experienceEntries.push({ company: '', position: '', years: '', description: '' });
    renderExperienceEdit();
});

window.updateEdu = (index, field, value) => {
    educationEntries[index][field] = value;
};

window.removeEdu = (index) => {
    educationEntries.splice(index, 1);
    renderEducationEdit();
};

document.getElementById('add-edu-btn').addEventListener('click', () => {
    educationEntries.push({ degree: '', institution: '', year: '', cgpa: '' });
    renderEducationEdit();
});

window.updateProj = (index, field, value) => {
    projectEntries[index][field] = value;
};

window.removeProj = (index) => {
    projectEntries.splice(index, 1);
    renderProjectsEdit();
};

document.getElementById('add-proj-btn').addEventListener('click', () => {
    projectEntries.push({ title: '', subtitle: '', description: '' });
    renderProjectsEdit();
});

// 3. Toggle Modes
editBtn.addEventListener('click', () => {
    viewMode.style.display = 'none';
    editMode.style.display = 'block';
});

cancelBtn.addEventListener('click', () => {
    editMode.style.display = 'none';
    viewMode.style.display = 'block';
});

// 4. Save Changes
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Calculate total years
    const totalExp = experienceEntries.reduce((sum, exp) => sum + (parseFloat(exp.years) || 0), 0);

    const updatedData = {
        fullName: document.getElementById('p-fullname').value,
        jobTitle: document.getElementById('p-title').value,
        location: document.getElementById('p-location').value,
        phone: document.getElementById('p-phone').value,
        linkedin: document.getElementById('p-linkedin').value,
        github: document.getElementById('p-github').value,
        educationHistory: educationEntries,
        certifications: document.getElementById('p-certs').value,
        aboutMe: document.getElementById('p-aboutme').value,
        projectsHistory: projectEntries,
        skills: document.getElementById('p-skills').value,
        experienceHistory: experienceEntries,
        totalExperience: totalExp
    };

    try {
        await updateDoc(doc(db, "users", currentUserUid), updatedData);
        alert("Profile Updated!");
        populateFields({ ...updatedData, email: document.getElementById('p-email').value }); // Update view immediately
        editMode.style.display = 'none';
        viewMode.style.display = 'block';
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Error saving profile.");
    }
});

// ── Load Offer Letters Section ────────────────────────────────────────────────
async function loadOfferLetters(uid) {
    const section = document.getElementById('offer-letters-section');
    const listEl = document.getElementById('offer-letters-list');
    if (!section || !listEl) return;

    try {
        const q = query(collection(db, "applications"), where("userId", "==", uid), where("status", "==", "Selected"));
        const snap = await getDocs(q);

        if (snap.empty) {
            return; // No offers yet — keep section hidden
        }

        section.style.display = 'block';
        listEl.innerHTML = '';

        snap.forEach((docSnap) => {
            const app = docSnap.data();
            const appId = docSnap.id;
            const offerUrl = `offer-letter.html?appId=${appId}`;
            const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.04);
                border: 1px solid var(--glass-border);
                border-radius: 14px;
                padding: 1.25rem 1.5rem;
                margin-bottom: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 1rem;
            `;

            const jobTitleEsc = (app.jobTitle || '').replace(/'/g, "\\'");
            const companyNameEsc = (app.companyName || '').replace(/'/g, "\\'");
            const applicantNameEsc = (app.applicantName || '').replace(/'/g, "\\'");

            card.innerHTML = `
                <div>
                    <div style="font-size:1rem; font-weight:600; color:var(--text); margin-bottom:0.3rem;">
                        <i class="fas fa-briefcase" style="color:var(--primary); margin-right:0.4rem;"></i>
                        ${app.jobTitle || 'Position'}
                    </div>
                    <div style="font-size:0.88rem; color:var(--text-light);">
                        <i class="fas fa-building" style="margin-right:0.3rem;"></i>${app.companyName || 'Company'}
                        &nbsp;&nbsp;
                        <i class="fas fa-calendar-alt" style="margin-right:0.3rem;"></i>${today}
                    </div>
                    ${app.offerAccepted
                    ? `<div style="margin-top:0.4rem; font-size:0.82rem; color:#34d399;"><i class="fas fa-check-circle"></i> Offer Accepted</div>`
                    : `<div style="margin-top:0.4rem; font-size:0.82rem; color:#fbbf24;"><i class="fas fa-clock"></i> Pending Your Acceptance</div>`
                }
                </div>
                <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
                    <a href="${offerUrl}" class="btn-sm btn-accept" style="text-decoration:none;">
                        <i class="fas fa-eye"></i> View Letter
                    </a>
                    <button class="btn-sm btn-resume" onclick="downloadOfferPDF('${appId}', '${jobTitleEsc}', '${companyNameEsc}', '${applicantNameEsc}')">
                        <i class="fas fa-file-pdf"></i> Download PDF
                    </button>
                </div>
            `;
            listEl.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading offer letters:", err);
        section.style.display = 'block';
        listEl.innerHTML = '<p style="color:var(--text-light);">Could not load offer letters.</p>';
    }
}

// 🛡️ SECURITY: OpenAI key and logic are now handled via gitignored secrets
let OPENAI_API_KEY = "";

// Initializing secrets
(async () => {
    try {
        const { SECRETS } = await import("./secrets.js").catch(() => ({ SECRETS: null }));
        if (SECRETS && SECRETS.OPENAI_API_KEY) {
            OPENAI_API_KEY = SECRETS.OPENAI_API_KEY;
        }
    } catch (e) {
        console.info("Running without OpenAI key. Create js/secrets.js for AI features.");
    }
})();

const generateBtn = document.getElementById('ai-resume-btn');
if (generateBtn) {
    generateBtn.addEventListener('click', generateResume);
}

async function generateResume() {
    const originalText = generateBtn.innerHTML;
    try {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        // 1. Scrape Data
        const name = document.getElementById('p-fullname').value || "Your Name";
        const email = document.getElementById('p-email').value || "";
        const phone = document.getElementById('p-phone').value || "";
        const linkedin = document.getElementById('p-linkedin').value || "";
        const github = document.getElementById('p-github').value || "";
        const title = document.getElementById('p-title').value || "Professional Title";
        const location = document.getElementById('p-location').value || "";
        const education = educationEntries.map(e => `${e.degree} at ${e.institution} (${e.year})${e.cgpa ? ' - ' + e.cgpa : ''}`).join('\n') || "";
        const certs = document.getElementById('p-certs').value || "";
        const skills = document.getElementById('p-skills').value || "";
        const aboutMe = document.getElementById('p-aboutme').value || "";

        // 2. AI Call (OpenAI)
        const systemPrompt = "You are a professional resume writer. Return ONLY a JSON object with the key: 'summary' (a concise, impactful professional summary of exactly 2-3 sentences max, around 40-50 words total). Be precise and minimal — no filler words, no generic phrases. Focus on key achievements and core expertise. Do not include any markdown formatting like ```json.";
        const userPrompt = `Name: ${name}. Title: ${title}. Skills: ${skills}. Experience: ${education + "\n" + certs}. Summary goals: ${aboutMe}.`;

        const url = "https://api.openai.com/v1/chat/completions";

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            let errorMsg = response.statusText || "Unknown Error";

            if (errorBody.error) {
                errorMsg = errorBody.error.message || JSON.stringify(errorBody.error);
            }

            throw new Error(`OpenAI API Error (${response.status}): ${errorMsg}`);
        }

        const aiData = await response.json();
        const rawAiResponse = aiData.choices?.[0]?.message?.content;

        if (!rawAiResponse) throw new Error("AI returned an empty response.");



        const cleanJsonStr = rawAiResponse.replace(/```json|```/gi, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        // 3. Render into Preview Div (New professional layout)
        console.log("Rendering AI content into professional template...");

        document.getElementById('res-name').innerText = name;
        document.getElementById('res-email').innerText = email;
        document.getElementById('res-phone').innerText = phone;
        document.getElementById('res-location').innerText = location;
        const liEl = document.getElementById('res-linkedin');
        const ghEl = document.getElementById('res-github');

        if (linkedin) {
            liEl.innerText = linkedin.replace(/^https?:\/\/(www\.)?/, '');
            document.getElementById('res-linkedin-wrap').style.display = 'inline';
        } else {
            document.getElementById('res-linkedin-wrap').style.display = 'none';
        }

        if (github) {
            ghEl.innerText = github.replace(/^https?:\/\/(www\.)?/, '');
            document.getElementById('res-github-wrap').style.display = 'inline';
        } else {
            document.getElementById('res-github-wrap').style.display = 'none';
        }

        if (!phone) document.getElementById('res-phone-wrap').style.display = 'none';
        else document.getElementById('res-phone-wrap').style.display = 'inline';

        if (!location) document.getElementById('res-location-wrap').style.display = 'none';
        else document.getElementById('res-location-wrap').style.display = 'inline';

        // Summary
        document.getElementById('res-summary').innerText = parsed.summary;

        // Education
        const eduList = document.getElementById('res-education-list');
        if (educationEntries.length > 0) {
            eduList.innerHTML = educationEntries.map(edu => `
                <div class="entry-header">
                    <span>${edu.degree}</span>
                    <span>${edu.year}</span>
                </div>
                <div class="entry-sub">
                    <span>${edu.institution}</span>
                </div>
            `).join('');
        } else {
            eduList.innerHTML = '<p>Information not provided.</p>';
        }

        // Experience (rendered as-is from profile data)
        const resExp = document.getElementById('res-experience');
        if (experienceEntries.length > 0) {
            resExp.innerHTML = experienceEntries.map(exp => `
                <div class="entry-header">
                    <span>${exp.position}</span>
                    <span>${exp.years} Yrs</span>
                </div>
                <div class="entry-sub">
                    <span>${exp.company}</span>
                </div>
                ${exp.description ? `<p style="margin-top:4px; text-align:justify;">${exp.description}</p>` : ''}
            `).join('');
        } else {
            resExp.innerHTML = '<p>No experience listed.</p>';
        }

        // Skills
        const skillsSection = document.getElementById('res-skills-section');
        const skillsContent = document.getElementById('res-skills-content');
        if (skills) {
            skillsSection.style.display = 'block';
            skillsContent.innerHTML = `<p>${skills}</p>`;
        } else {
            skillsSection.style.display = 'none';
        }

        // Projects (rendered as-is from profile data)
        const projSection = document.getElementById('res-projects-section');
        const projContent = document.getElementById('res-projects-content');
        if (projectEntries.length > 0) {
            projSection.style.display = 'block';
            projContent.innerHTML = projectEntries.map(proj => `
                <div class="entry-header">
                    <span>${proj.title}</span>
                </div>
                ${proj.subtitle ? `<div class="entry-sub"><span>${proj.subtitle}</span></div>` : ''}
                ${proj.description ? `<p style="margin-top:4px; text-align:justify;">${proj.description}</p>` : ''}
            `).join('');
        } else {
            projSection.style.display = 'none';
        }

        // Certs
        const certSection = document.getElementById('res-certs-section');
        const certGrid = document.getElementById('res-certs-grid');
        if (certs) {
            certSection.style.display = 'block';
            certGrid.innerHTML = certs.split('\n').filter(c => c.trim()).map(c => `<div class="cert-item">${c.trim()}</div>`).join('');
        } else {
            certSection.style.display = 'none';
        }

        document.getElementById('res-footer-email').innerText = email;

        console.log("Template rendering complete.");

        // 4. Download PDF
        const element = document.getElementById('resume-preview');
        element.style.display = 'block';
        element.style.position = 'static';
        element.style.left = '0';

        await new Promise(r => setTimeout(r, 200));

        const opt = {
            margin: [10, 0, 10, 0],
            filename: `Resume_${name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        await html2pdf().set(opt).from(element).save();

        element.style.display = 'none';
        element.style.position = 'absolute';
        element.style.left = '-9999px';

        alert("Resume Generated & Downloaded!");

    } catch (err) {
        console.error("AI Resume Error:", err);
        alert("Could not generate AI resume. Error: " + err.message);
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalText;
    }
}

// ── PDF Generator (client-side, no email needed) ──────────────────────────────
window.downloadOfferPDF = (appId, jobTitle, companyName, applicantName) => {
    try {
        if (!window.jspdf) { alert("PDF library not loaded. Please try the View Letter page to print."); return; }
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const name = applicantName || 'Applicant';
        const company = companyName || 'Our Company';
        const job = jobTitle || 'Position';
        const pageW = pdf.internal.pageSize.getWidth();
        let y = 0;

        // Header bar
        pdf.setFillColor(99, 102, 241);
        pdf.rect(0, 0, pageW, 22, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(company, pageW / 2, 14, { align: 'center' });

        // Title
        y = 35;
        pdf.setTextColor(30, 30, 30);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Offer of Employment', pageW / 2, y, { align: 'center' });

        // Date
        y += 8;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Date: ${today}`, pageW / 2, y, { align: 'center' });

        // Divider
        y += 8;
        pdf.setDrawColor(200, 200, 220);
        pdf.line(20, y, pageW - 20, y);

        // Body
        y += 12;
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Dear ${name},`, 20, y);

        y += 10;
        const body1 = pdf.splitTextToSize(`We are pleased to extend a formal Offer of Employment for the position of "${job}" at ${company}.`, pageW - 40);
        pdf.text(body1, 20, y);
        y += body1.length * 7 + 4;

        const body2 = pdf.splitTextToSize('After a thorough evaluation of your qualifications, experience, and interview performance, we are confident that you will be a valuable addition to our team.', pageW - 40);
        pdf.text(body2, 20, y);
        y += body2.length * 7 + 4;

        const body3 = pdf.splitTextToSize('Please review this offer carefully. To accept, visit your Job Portal profile and click "View Letter".', pageW - 40);
        pdf.text(body3, 20, y);
        y += body3.length * 7 + 10;

        // Details box
        pdf.setFillColor(245, 245, 255);
        pdf.setDrawColor(180, 180, 220);
        pdf.roundedRect(20, y, pageW - 40, 36, 3, 3, 'FD');
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80, 80, 180);
        pdf.text('Position:', 28, y + 10);
        pdf.text('Organisation:', 28, y + 22);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 30, 30);
        pdf.text(job, 70, y + 10);
        pdf.text(company, 70, y + 22);
        y += 50;

        // Signature
        pdf.setTextColor(30, 30, 30);
        pdf.setFontSize(12);
        pdf.text('Warm regards,', 20, y);
        y += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.text(company, 20, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(120, 120, 120);
        pdf.text('Hiring Team', 20, y);

        // Footer
        const pageH = pdf.internal.pageSize.getHeight();
        pdf.setFillColor(99, 102, 241);
        pdf.rect(0, pageH - 12, pageW, 12, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text('This is an official offer letter generated from Job Portal.', pageW / 2, pageH - 4, { align: 'center' });

        pdf.save(`Offer_Letter_${company.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
        console.error("PDF error:", err);
        alert("Could not generate PDF. Please use the View Letter page to print/save.");
    }
};