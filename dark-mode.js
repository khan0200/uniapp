// Dark Mode System - Persistent across all pages
class DarkModeManager {
    constructor() {
        this.storageKey = 'uniapp-dark-mode';
        this.init();
    }

    init() {
        // Apply theme immediately to prevent flash
        this.applyTheme(this.getStoredTheme());
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }

    getStoredTheme() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) return stored;
        
        // Default to system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setTheme(theme) {
        localStorage.setItem(this.storageKey, theme);
        this.applyTheme(theme);
        this.updateToggleButton(theme);
    }

    applyTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        metaThemeColor.content = theme === 'dark' ? '#0f172a' : '#ffffff';
    }

    toggle() {
        const currentTheme = this.getStoredTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Add ripple effect to toggle button
        this.addRippleEffect();
        
        return newTheme;
    }

    setupUI() {
        this.createToggleButton();
        this.updateToggleButton(this.getStoredTheme());
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    createToggleButton() {
        // Check if button already exists
        if (document.getElementById('dark-mode-toggle')) return;

        const toggleButton = document.createElement('button');
        toggleButton.id = 'dark-mode-toggle';
        toggleButton.className = `
            fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full 
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700
            shadow-lg dark:shadow-gray-900/30
            flex items-center justify-center
            transition-all duration-300 ease-in-out
            hover:scale-110 hover:shadow-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-800
            group overflow-hidden
        `.replace(/\s+/g, ' ').trim();

        toggleButton.innerHTML = `
            <div class="relative w-6 h-6">
                <!-- Sun Icon -->
                <svg class="sun-icon absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-300 transform rotate-0 scale-100 opacity-100 dark:rotate-90 dark:scale-0 dark:opacity-0" 
                     fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
                </svg>
                
                <!-- Moon Icon -->
                <svg class="moon-icon absolute inset-0 w-6 h-6 text-blue-400 transition-all duration-300 transform rotate-90 scale-0 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100" 
                     fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
            </div>
            
            <!-- Ripple effect -->
            <div class="ripple absolute inset-0 rounded-full bg-blue-400 opacity-0 scale-0 transition-all duration-500"></div>
        `;

        toggleButton.addEventListener('click', () => {
            this.toggle();
        });

        // Add to body
        document.body.appendChild(toggleButton);
    }

    updateToggleButton(theme) {
        const button = document.getElementById('dark-mode-toggle');
        if (!button) return;

        // Update aria-label for accessibility
        button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        button.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }

    addRippleEffect() {
        const button = document.getElementById('dark-mode-toggle');
        if (!button) return;

        const ripple = button.querySelector('.ripple');
        if (!ripple) return;

        // Reset animation
        ripple.classList.remove('animate');
        
        // Trigger animation
        setTimeout(() => {
            ripple.style.opacity = '0.3';
            ripple.style.transform = 'scale(2)';
            
            setTimeout(() => {
                ripple.style.opacity = '0';
                ripple.style.transform = 'scale(0)';
            }, 300);
        }, 10);
    }

    // Method to get current theme
    getCurrentTheme() {
        return this.getStoredTheme();
    }

    // Method for other scripts to listen to theme changes
    onThemeChange(callback) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isDark = document.documentElement.classList.contains('dark');
                    callback(isDark ? 'dark' : 'light');
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return observer;
    }
}

// Initialize dark mode system immediately
const darkMode = new DarkModeManager();

// Export for use in other scripts
window.darkModeManager = darkMode; 