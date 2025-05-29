// Optimized UniApp Scripts with Performance Improvements
import { FirebaseService, initializeFirebase } from './firebase.js';

// Performance optimizations
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Cache management
class CacheManager {
    static set(key, data) {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    static get(key) {
        const cached = cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > CACHE_TTL) {
            cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    static clear() {
        cache.clear();
    }
    
    static invalidate(pattern) {
        for (const key of cache.keys()) {
            if (key.includes(pattern)) {
                cache.delete(key);
            }
        }
    }
}

// Global app state
window.uniApp = {
    isLoading: false,
    currentPage: 1,
    hasMore: true,
    lastDoc: null,
    searchTerm: '',
    cache: CacheManager
};

// Optimized data loading with pagination
async function loadDataWithPagination(collection, pageSize = 20, reset = false) {
    const app = window.uniApp;
    
    if (app.isLoading) return;
    
    if (reset) {
        app.currentPage = 1;
        app.lastDoc = null;
        app.hasMore = true;
        CacheManager.invalidate(collection);
    }
    
    const cacheKey = `${collection}_page_${app.currentPage}`;
    const cached = CacheManager.get(cacheKey);
    
    if (cached) {
        console.log(`📦 Using cached data for ${collection}`);
        return cached;
    }
    
    app.isLoading = true;
    showLoadingIndicator();
    
    try {
        let result;
        
        if (collection === 'students') {
            result = await FirebaseService.getStudents(pageSize, app.lastDoc);
        } else if (collection === 'payments') {
            result = await FirebaseService.getPayments(pageSize, app.lastDoc);
        }
        
        if (result) {
            app.lastDoc = result.lastDoc;
            app.hasMore = result.hasMore;
            
            CacheManager.set(cacheKey, result);
            console.log(`✅ Loaded ${result[collection]?.length || 0} ${collection} (Page ${app.currentPage})`);
            
            return result;
        }
        
    } catch (error) {
        console.error(`❌ Error loading ${collection}:`, error);
        showErrorMessage(`Failed to load ${collection}: ${error.message}`);
    } finally {
        app.isLoading = false;
        hideLoadingIndicator();
    }
    
    return null;
}

// Optimized search with debouncing
const debouncedSearch = debounce(async (searchTerm, field = 'fullname') => {
    if (!searchTerm.trim()) {
        // Reset to normal pagination view
        await loadDataWithPagination('students', 20, true);
        return;
    }
    
    const cacheKey = `search_${field}_${searchTerm}`;
    const cached = CacheManager.get(cacheKey);
    
    if (cached) {
        console.log('📦 Using cached search results');
        displaySearchResults(cached);
        return;
    }
    
    showLoadingIndicator();
    
    try {
        const results = await FirebaseService.searchStudents(searchTerm, field);
        CacheManager.set(cacheKey, results);
        displaySearchResults(results);
        console.log(`✅ Search found ${results.length} results for "${searchTerm}"`);
    } catch (error) {
        console.error('❌ Search error:', error);
        showErrorMessage(`Search failed: ${error.message}`);
    } finally {
        hideLoadingIndicator();
    }
}, 300); // 300ms debounce delay

// UI Helper functions
function showLoadingIndicator() {
    const indicators = document.querySelectorAll('.loading-indicator, #loadingSpinner');
    indicators.forEach(indicator => {
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    });
}

function hideLoadingIndicator() {
    const indicators = document.querySelectorAll('.loading-indicator, #loadingSpinner');
    indicators.forEach(indicator => {
        if (indicator) {
            indicator.classList.add('hidden');
        }
    });
}

function showErrorMessage(message) {
    // Create or update error display
    let errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md';
        document.body.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function displaySearchResults(results) {
    // This function should be implemented based on your specific UI needs
    console.log('Displaying search results:', results);
}

// Initialize optimized app
async function initializeOptimizedApp() {
    console.log('🚀 Initializing optimized UniApp...');
    
    try {
        // Initialize Firebase
        await initializeFirebase();
        
        // Set up search functionality if search input exists
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                window.uniApp.searchTerm = e.target.value;
                debouncedSearch(e.target.value);
            });
        }
        
        // Set up pagination buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (window.uniApp.currentPage > 1) {
                    window.uniApp.currentPage--;
                    loadDataWithPagination('students');
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (window.uniApp.hasMore) {
                    window.uniApp.currentPage++;
                    loadDataWithPagination('students');
                }
            });
        }
        
        // Load initial data based on current page
        const currentPath = window.location.pathname;
        if (currentPath.includes('studentlist')) {
            await loadDataWithPagination('students', 20, true);
        } else if (currentPath.includes('payments')) {
            await loadDataWithPagination('payments', 20, true);
        }
        
        console.log('✅ Optimized UniApp initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize optimized app:', error);
        showErrorMessage('Failed to initialize application');
    }
}

// Performance monitoring
function logPerformance(operation, startTime) {
    const duration = performance.now() - startTime;
    console.log(`⏱️ ${operation} took ${duration.toFixed(2)}ms`);
    
    if (duration > 1000) {
        console.warn(`⚠️ Slow operation detected: ${operation} (${duration.toFixed(2)}ms)`);
    }
}

// Export functions for global access
window.loadDataWithPagination = loadDataWithPagination;
window.debouncedSearch = debouncedSearch;
window.FirebaseService = FirebaseService;
window.CacheManager = CacheManager;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOptimizedApp);
} else {
    initializeOptimizedApp();
}
