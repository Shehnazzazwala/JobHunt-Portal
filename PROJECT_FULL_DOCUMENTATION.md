# JobHunt: AI-Driven Full-Stack Recruitment Ecosystem

JobHunt is a cutting-edge, full-stack platform that leverages **Generative AI** to solve real-world recruitment bottlenecks. Designed with a high-performance **BaaS (Backend-as-a-Service)** architecture and a sophisticated **OpenAI integration**, it demonstrates the seamless orchestration of LLMs within production web environments.

---

## 🤖 AI/ML & Intelligent Automation

### 1. Generative AI Orchestration (OpenAI GPT Integration)
The core "killer feature" is the **Automated Resume Builder**, which utilizes the OpenAI API to transform fragmented user data into professional, high-impact career narratives.
- **Prompt Engineering**: Developed custom system-level instructions to enforce strict **JSON schema output**, ensuring reliability in frontend parsing.
- **Contextual Synthesis**: Implemented logic to scrape and preprocess user-provided education, job titles, and experience histories into a cohesive prompt for the model.
- **Advanced Error Handling**: Built robust asynchronous fetch wrappers to handle API timeouts, rate limits, and non-conforming LLM responses.

### 2. Decision Support Systems
- **Intelligent ATS**: The platform provides structured decision-making tools for employers, filtering candidates through a real-time status management system that prepares data for further automated processing.

---

## 🏗 Full-Stack Architecture & Orchestration

### 1. Reactive Frontend & BaaS Integration
- **State Management**: Utilized **Firebase Firestore** on-snapshot listeners for real-time reactivity between the employer's ATS and the applicant's dashboard.
- **Asynchronous Workflows**: Orchestrated complex multi-step processes where frontend events trigger AI calls, followed by dynamic PDF generation and database updates.

### 2. Document Automation Engine
- **Client-Side Rendering**: Built a sophisticated document generation engine using `jspdf` and `html2pdf.js`, converting AI-generated JSON into pixel-perfect PDF Resumes and Offer Letters without server-side overhead.

---

## 🛠 Tech Stack Details

- **AI/ML**: OpenAI GPT API (Generative AI, Prompt Engineering, Structured Parsing)
- **Database**: Firebase Firestore (NoSQL, Real-time Sync)
- **Auth**: Firebase Authentication (Multi-Role RBAC - Role-Based Access Control)
- **Frontend**: ES6+ JavaScript, Glassmorphism CSS Design System
- **PDF Core**: jspdf, html2pdf.js

---

## 🏗 Key Technical Implementation Highlights

### 1. Robust AI Integration Pipeline
The implementation goes beyond simple API calls. It involves a "Scrape -> Synthesize -> Prompt -> Parse -> Render" pipeline:
```javascript
// Example of the structured parsing logic used for AI responses
const cleanJsonStr = rawAiResponse.replace(/```json|```/gi, '').trim();
const parsed = JSON.parse(cleanJsonStr); // AI-enforced JSON schema
```

### 2. Secure Multi-Role RBAC
Implemented a scalable redirection and data-access layer that distinguishes between **Applicants**, **Companies**, and **Administrators**, ensuring data integrity across the platform.

### 3. Glassmorphism Design System
Created a custom UI framework from scratch using CSS variables for transparency, backdrop-filter blur, and adaptive border effects, achieving a "premium-tier" aesthetic.

---

## 📂 Project Structure

```text
Job-Portal/
├── js/
│   ├── firebase-config.js   # Centralized DB & Auth config
│   ├── auth.js              # Multi-role authentication logic
│   ├── profile.js           # Applicant profile & AI Resume builder
│   ├── company-applications.js # ATS Logic & Status management
│   ├── admin.js             # Platform analytics & Governance
│   └── main.js              # Global job discovery features
├── index.html               # Main entry point
├── profile.html             # User dashboard
├── company-dashboard.html   # Employer dashboard
├── admin-panel.html         # Admin dashboard
└── style.css                # Global design system
```
