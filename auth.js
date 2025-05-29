// Authentication system for UniApp
(function() {
    'use strict';
    
    const SESSION_KEY = 'uniapp_authenticated';
    const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const LOGIN_PAGE = 'login.html';
    
    // Check if current page is the login page
    function isLoginPage() {
        return window.location.pathname.endsWith('login.html') || 
               window.location.pathname.endsWith('/login.html') ||
               window.location.pathname === '/login.html';
    }
    
    // Check authentication status
    function checkAuthentication() {
        // Skip authentication check for login page
        if (isLoginPage()) {
            return true;
        }
        
        const authData = localStorage.getItem(SESSION_KEY);
        
        if (!authData) {
            redirectToLogin();
            return false;
        }
        
        try {
            const { timestamp, authenticated } = JSON.parse(authData);
            const now = Date.now();
            
            // Check if session is still valid (24 hours)
            if (authenticated && (now - timestamp) < SESSION_DURATION) {
                return true;
            } else {
                // Session expired
                localStorage.removeItem(SESSION_KEY);
                redirectToLogin();
                return false;
            }
        } catch (error) {
            // Invalid auth data
            localStorage.removeItem(SESSION_KEY);
            redirectToLogin();
            return false;
        }
    }
    
    // Redirect to login page
    function redirectToLogin() {
        if (!isLoginPage()) {
            console.log('🔒 Authentication required. Redirecting to login...');
            window.location.href = LOGIN_PAGE;
        }
    }
    
    // Logout function
    function logout() {
        localStorage.removeItem(SESSION_KEY);
        console.log('👋 User logged out');
        window.location.href = LOGIN_PAGE;
    }
    
    // Add logout button to sidebar (instead of top-right)
    function addLogoutButton() {
        // Skip for login page
        if (isLoginPage()) {
            return;
        }
        
        // Find the sidebar navigation
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (!sidebarNav) {
            console.warn('Sidebar navigation not found, adding logout button to top-right');
            addTopRightLogoutButton();
            return;
        }
        
        // Create logout button as a nav item
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'nav-item logout-nav-item';
        logoutBtn.setAttribute('data-tooltip', 'Logout');
        logoutBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
            </svg>
        `;
        
        // Add custom styles for logout button
        logoutBtn.style.cssText = `
            margin-top: auto;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
        `;
        
        // Add hover effects
        logoutBtn.addEventListener('mouseenter', () => {
            logoutBtn.style.background = 'rgba(239, 68, 68, 0.9)';
            logoutBtn.style.color = '#ffffff';
            logoutBtn.style.borderColor = 'rgba(239, 68, 68, 1)';
        });
        
        logoutBtn.addEventListener('mouseleave', () => {
            logoutBtn.style.background = 'rgba(239, 68, 68, 0.1)';
            logoutBtn.style.color = '#94a3b8';
            logoutBtn.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        });
        
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
        
        // Add to sidebar navigation
        sidebarNav.appendChild(logoutBtn);
        
        // Add CSS to make sidebar flex column with logout at bottom
        sidebarNav.style.cssText = `
            padding: 0 12px;
            display: flex;
            flex-direction: column;
            height: calc(100vh - 120px);
        `;
    }
    
    // Fallback function for top-right logout button
    function addTopRightLogoutButton() {
        // Create logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
        `;
        logoutBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: rgba(239, 68, 68, 0.9);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        `;
        
        // Hover effects
        logoutBtn.addEventListener('mouseenter', () => {
            logoutBtn.style.background = 'rgba(220, 38, 38, 0.9)';
            logoutBtn.style.transform = 'translateY(-1px)';
            logoutBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        });
        
        logoutBtn.addEventListener('mouseleave', () => {
            logoutBtn.style.background = 'rgba(239, 68, 68, 0.9)';
            logoutBtn.style.transform = 'translateY(0)';
            logoutBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
        
        logoutBtn.addEventListener('click', logout);
        
        // Add to page
        document.body.appendChild(logoutBtn);
    }
    
    // Session refresh function
    function refreshSession() {
        const authData = localStorage.getItem(SESSION_KEY);
        if (authData) {
            try {
                const { authenticated } = JSON.parse(authData);
                if (authenticated) {
                    // Update timestamp to extend session
                    const newAuthData = {
                        authenticated: true,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(SESSION_KEY, JSON.stringify(newAuthData));
                }
            } catch (error) {
                console.error('Error refreshing session:', error);
            }
        }
    }
    
    // Auto-refresh session every 30 minutes
    function startSessionRefresh() {
        if (!isLoginPage()) {
            setInterval(refreshSession, 30 * 60 * 1000); // 30 minutes
        }
    }
    
    // Initialize authentication
    function initAuth() {
        // Check authentication immediately
        if (!checkAuthentication()) {
            return;
        }
        
        // Add logout button
        addLogoutButton();
        
        // Start session refresh
        startSessionRefresh();
        
        // Refresh session on user activity
        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, refreshSession, { passive: true, once: false });
        });
        
        console.log('🔐 Authentication system initialized');
    }
    
    // Export functions globally
    window.authSystem = {
        checkAuth: checkAuthentication,
        logout: logout,
        refreshSession: refreshSession,
        isAuthenticated: () => {
            const authData = localStorage.getItem(SESSION_KEY);
            if (!authData) return false;
            
            try {
                const { timestamp, authenticated } = JSON.parse(authData);
                const now = Date.now();
                return authenticated && (now - timestamp) < SESSION_DURATION;
            } catch {
                return false;
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
    
})(); 