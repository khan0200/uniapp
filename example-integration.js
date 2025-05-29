// Example: How to integrate Enhanced Cache into your existing pages
// This shows the before/after comparison for studentlist.html

// ❌ BEFORE: Direct Firebase calls (slow, no caching)
async function loadDataDirectly_OLD() {
    console.log('🔄 Loading student data...');
    const tbody = document.getElementById('studentTableBody');
    
    try {
        // Show loading state in table
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    <div class="loading-spinner"></div>
                    <p>Loading student data...</p>
                </td>
            </tr>
        `;
        
        // ❌ Direct Firebase call - always slow
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js');
        const { getFirestore, collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
        
        const firebaseConfig = { /* config */ };
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // This takes 2-5 seconds EVERY TIME
        const studentsRef = collection(db, "register");
        const q = query(studentsRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        console.log(`✅ Found ${querySnapshot.size} students`);
        
        // Store all students data
        allStudents = [];
        querySnapshot.forEach((docSnap) => {
            const student = docSnap.data();
            allStudents.push({
                id: docSnap.id,
                ...student
            });
        });
        
        // Initialize filtered students
        filteredStudents = [...allStudents];
        currentPage = 1;
        updateTable();
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        displayError(`Error loading data: ${error.message}`);
    }
}

// ✅ AFTER: Using Enhanced Cache (fast, offline support)
async function loadDataDirectly_NEW() {
    console.log('🔄 Loading student data...');
    const tbody = document.getElementById('studentTableBody');
    
    try {
        // Show loading state in table
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    <div class="loading-spinner"></div>
                    <p>Loading student data...</p>
                </td>
            </tr>
        `;
        
        // ✅ Smart cache call - instant if cached, fast if not
        const result = await window.SmartDataService.getStudents(50, 1);
        
        // Store data globally (same as before)
        allStudents = result.students || [];
        filteredStudents = [...allStudents];
        currentPage = 1;
        
        // Update table (same as before)
        updateTable();
        
        console.log(`✅ Loaded ${allStudents.length} students`);
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        displayError(`Error loading data: ${error.message}`);
    }
}

// 🔄 Example: How to handle page navigation with caching
function setupPaginationWithCache() {
    document.getElementById('prevPage').addEventListener('click', async () => {
        if (currentPage > 1) {
            currentPage--;
            
            // ✅ This will be instant if data is cached
            const result = await window.SmartDataService.getStudents(20, currentPage);
            displayStudents(result.students);
            updatePagination(result.hasMore);
        }
    });

    document.getElementById('nextPage').addEventListener('click', async () => {
        currentPage++;
        
        // ✅ This will be instant if data is cached
        const result = await window.SmartDataService.getStudents(20, currentPage);
        displayStudents(result.students);
        updatePagination(result.hasMore);
    });
}

// 📱 Example: Offline-aware operations
async function addStudentWithOfflineSupport(studentData) {
    try {
        // ✅ This works both online and offline
        const result = await window.SmartDataService.addStudent(studentData);
        
        if (navigator.onLine) {
            console.log('✅ Student added to Firebase:', result.id);
            showSuccessMessage('Student added successfully!');
        } else {
            console.log('📝 Student queued for sync when online');
            showInfoMessage('Student saved offline. Will sync when connection is restored.');
        }
        
        // Refresh the current view
        await loadDataDirectly_NEW();
        
    } catch (error) {
        console.error('❌ Error adding student:', error);
        showErrorMessage('Failed to add student: ' + error.message);
    }
}

// 🔄 Example: Force refresh when you know data has changed
async function refreshDataWhenNeeded() {
    // Use this when you know data has been updated elsewhere
    console.log('🔄 Force refreshing data...');
    
    // Clear cache and fetch fresh data
    await window.SmartDataService.refreshAll();
    
    // Reload current page data
    await loadDataDirectly_NEW();
    
    console.log('✅ Data refreshed from server');
}

// 📊 Example: Monitor cache performance
function showCacheStats() {
    const stats = window.SmartDataService.getCacheStats();
    
    console.log('📊 Cache Statistics:');
    console.log(`Memory entries: ${stats.memoryEntries}`);
    console.log(`Memory size: ${stats.memorySize}`);
    console.log(`Online status: ${stats.isOnline}`);
    console.log(`Sync queue: ${stats.syncQueueLength} pending operations`);
    
    // You can display this in your UI
    const statusElement = document.getElementById('cache-status');
    if (statusElement) {
        statusElement.innerHTML = `
            <div class="cache-stats">
                <span class="stat">📦 ${stats.memoryEntries} cached</span>
                <span class="stat">💾 ${stats.memorySize}</span>
                <span class="stat ${stats.isOnline ? 'online' : 'offline'}">
                    ${stats.isOnline ? '🌐 Online' : '📱 Offline'}
                </span>
            </div>
        `;
    }
}

// 🎯 Example: Complete integration for a page
function integrateEnhancedCacheIntoPage() {
    // Wait for SmartDataService to be ready
    if (window.SmartDataService && window.SmartDataService.isInitialized) {
        initializePage();
    } else {
        // Wait for it to initialize
        const checkInterval = setInterval(() => {
            if (window.SmartDataService && window.SmartDataService.isInitialized) {
                clearInterval(checkInterval);
                initializePage();
            }
        }, 100);
    }
}

async function initializePage() {
    console.log('🚀 Initializing page with enhanced cache...');
    
    // Load initial data (will be cached)
    await loadDataDirectly_NEW();
    
    // Setup pagination with caching
    setupPaginationWithCache();
    
    // Show cache stats (optional)
    showCacheStats();
    
    // Setup periodic cache stats update
    setInterval(showCacheStats, 30000); // Every 30 seconds
    
    console.log('✅ Page initialized with enhanced cache support');
}

// 🔧 Example: Configuration options
function configureCacheSettings() {
    // You can access the cache manager directly for advanced configuration
    const cacheManager = window.SmartDataService.cache;
    
    // Example: Change cache expiry time (default is 30 minutes)
    // cacheManager.cacheExpiry = 60 * 60 * 1000; // 1 hour
    
    // Example: Change memory limit (default is 50MB)
    // cacheManager.maxMemorySize = 100 * 1024 * 1024; // 100MB
    
    console.log('⚙️ Cache settings configured');
}

// 🚨 Example: Error handling with fallbacks
async function robustDataLoading() {
    try {
        // Try to load with cache
        const result = await window.SmartDataService.getStudents(20, 1);
        return result.students;
        
    } catch (error) {
        console.error('❌ Smart data service failed:', error);
        
        // Fallback to direct Firebase (old method)
        try {
            console.log('🔄 Falling back to direct Firebase...');
            return await loadFromFirebaseDirectly();
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            
            // Show user-friendly error
            showErrorMessage('Unable to load data. Please check your connection and try again.');
            return [];
        }
    }
}

// 📱 Example: Offline status handling
function setupOfflineStatusHandling() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
        console.log('🌐 Back online - syncing data...');
        showSuccessMessage('Connection restored! Syncing your changes...');
        
        // Optionally refresh data when back online
        setTimeout(() => {
            refreshDataWhenNeeded();
        }, 1000);
    });
    
    window.addEventListener('offline', () => {
        console.log('📱 Gone offline - using cached data');
        showInfoMessage('You are offline. Using cached data.');
    });
}

// 🎉 Example: Complete setup function
function setupEnhancedCacheIntegration() {
    console.log('🚀 Setting up enhanced cache integration...');
    
    // Configure cache settings
    configureCacheSettings();
    
    // Setup offline status handling
    setupOfflineStatusHandling();
    
    // Initialize the page
    integrateEnhancedCacheIntoPage();
    
    console.log('✅ Enhanced cache integration complete!');
}

// Auto-run setup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEnhancedCacheIntegration);
} else {
    setupEnhancedCacheIntegration();
}

// Export functions for global access
window.loadDataWithCache = loadDataDirectly_NEW;
window.addStudentOffline = addStudentWithOfflineSupport;
window.refreshData = refreshDataWhenNeeded;
window.showCacheStats = showCacheStats; 