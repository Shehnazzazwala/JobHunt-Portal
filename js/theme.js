// Theme Management
const themeToggle = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleIcon(newTheme);
};

const updateToggleIcon = (theme) => {
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
};

// Initialize Theme
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark as per current UI
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Wait for DOM to ensure toggle icon exists
    window.addEventListener('DOMContentLoaded', () => {
        updateToggleIcon(savedTheme);
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', themeToggle);
        }
    });
};

initTheme();
