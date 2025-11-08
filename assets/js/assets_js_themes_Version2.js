class ThemeManager {
    constructor() {
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.initializeTheme();
        this.addThemeToggle();
    }

    initializeTheme() {
        const root = document.documentElement;
        if (this.darkMode) {
            root.classList.add('dark-theme');
        }
    }

    addThemeToggle() {
        // Add theme toggle button to sidebar
        const navMenu = document.querySelector('.nav-menu');
        const themeToggle = document.createElement('li');
        themeToggle.className = 'nav-item';
        themeToggle.innerHTML = `
            <a href="#" class="nav-link" id="themeToggle">
                <i class="fas ${this.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
                <span>Toggle Theme</span>
            </a>
        `;
        navMenu.appendChild(themeToggle);

        document.getElementById('themeToggle').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTheme();
        });
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        const root = document.documentElement;
        root.classList.toggle('dark-theme');
        
        // Update icon
        const icon = document.querySelector('#themeToggle i');
        icon.className = `fas ${this.darkMode ? 'fa-sun' : 'fa-moon'}`;
    }
}