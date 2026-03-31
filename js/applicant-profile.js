import { db, doc, getDoc } from "./firebase-config.js";

const urlParams = new URLSearchParams(window.location.search);
const applicantUid = urlParams.get('uid');

if (!applicantUid) {
    alert("No applicant specified.");
    window.location.href = "company-applications.html";
}

async function loadApplicantData(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            document.getElementById('view-fullname').innerText = data.fullName || "N/A";
            document.getElementById('view-email').innerText = data.email || "N/A";
            document.getElementById('view-title').innerText = data.jobTitle || "N/A";
            document.getElementById('view-location').innerText = data.location || "N/A";
            document.getElementById('view-aboutme').innerText = data.aboutMe || "N/A";
            document.getElementById('view-certs').innerText = data.certifications || "N/A";

            // Render Education History
            renderEducation(data.educationHistory || []);

            // Render Experience History
            renderExperience(data.experienceHistory || []);

            // Render Projects History
            renderProjects(data.projectsHistory || []);
        } else {
            document.querySelector('.container').innerHTML = "<h3>Applicant profile not found.</h3>";
        }
    } catch (error) {
        console.error("Error fetching applicant data:", error);
        document.querySelector('.container').innerHTML = "<h3>Error loading profile.</h3>";
    }
}

function renderExperience(entries) {
    const list = document.getElementById('view-experience-list');
    const totalExpEl = document.getElementById('view-total-exp');
    list.innerHTML = '';

    let totalYears = 0;
    if (entries.length === 0) {
        list.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No experience listed.</p>';
        totalExpEl.innerText = '(Total: 0 Yrs)';
        return;
    }

    entries.forEach(exp => {
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

function renderEducation(entries) {
    const list = document.getElementById('view-education-list');
    list.innerHTML = '';

    if (entries.length === 0) {
        list.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No education listed.</p>';
        return;
    }

    entries.forEach(edu => {
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

function renderProjects(entries) {
    const list = document.getElementById('view-projects-list');
    list.innerHTML = '';

    if (entries.length === 0) {
        list.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No projects listed.</p>';
        return;
    }

    entries.forEach(proj => {
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

loadApplicantData(applicantUid);
