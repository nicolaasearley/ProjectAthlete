// Theme Management
const THEME_STORAGE_KEY = 'fitness-app-theme';
const DEFAULT_THEME = 'light';

// Theme names for display
const themeNames = {
    gold: 'Gold',
    light: 'Light',
    dark: 'Dark',
    blue: 'Blue',
    pink: 'Pink'
};

// Initialize theme on page load
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    setTheme(savedTheme);
    
    // Set up theme selector UI
    setupThemeSelector();
}

// Set the theme
function setTheme(theme) {
    // Validate theme
    if (!['gold', 'light', 'dark', 'blue', 'pink'].includes(theme)) {
        theme = DEFAULT_THEME;
    }
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // Update UI if theme selector exists
    updateThemeSelectorUI(theme);
}

// Get current theme
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
}

// Set up theme selector UI
function setupThemeSelector() {
    const themeButton = document.getElementById('themeButton');
    const themeMenu = document.getElementById('themeMenu');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    if (!themeButton || !themeMenu) return;
    
    // Update button text
    const currentTheme = getCurrentTheme();
    updateThemeButtonText(currentTheme);
    
    // Toggle menu on button click
    themeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        themeMenu.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!themeButton.contains(e.target) && !themeMenu.contains(e.target)) {
            themeMenu.classList.remove('show');
        }
    });
    
    // Handle theme option clicks
    themeOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const theme = option.getAttribute('data-theme');
            if (theme) {
                setTheme(theme);
                themeMenu.classList.remove('show');
            }
        });
    });
}

// Update theme selector UI to show active theme
function updateThemeSelectorUI(theme) {
    // Update button text
    updateThemeButtonText(theme);
    
    // Update active state of options
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Update theme button text
function updateThemeButtonText(theme) {
    const themeButtonText = document.getElementById('themeButtonText');
    if (themeButtonText) {
        themeButtonText.textContent = themeNames[theme] || 'Theme';
    }
}

// Initialize theme when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

