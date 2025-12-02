// Menu System
document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('menuButton');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuClose = document.getElementById('menuClose');
    
    if (menuButton && menuOverlay) {
        menuButton.addEventListener('click', function() {
            menuOverlay.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
    if (menuClose && menuOverlay) {
        menuClose.addEventListener('click', function() {
            menuOverlay.classList.remove('show');
            document.body.style.overflow = ''; // Restore scrolling
        });
    }
    
    // Close menu when clicking outside
    if (menuOverlay) {
        menuOverlay.addEventListener('click', function(e) {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuOverlay && menuOverlay.classList.contains('show')) {
            menuOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
    
    // Handle theme selection in menu
    const menuThemeOptions = document.querySelectorAll('.menu-theme-option');
    menuThemeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            if (theme && typeof setTheme === 'function') {
                setTheme(theme);
                // Update active state
                menuThemeOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Set initial active theme in menu
    const currentTheme = getCurrentTheme ? getCurrentTheme() : 'light';
    menuThemeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === currentTheme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
});

