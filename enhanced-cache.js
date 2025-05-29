// Enhanced Caching and Offline Sync System
// This provides persistent data storage and intelligent cache management

class EnhancedCacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.persistentCache = null;
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
        this.maxMemorySize = 50 * 1024 * 1024; // 50MB
        this.isInitialized = false;
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        
        this.setupEventListeners();
        this.init();
    }
    
    async init() {
        try {
            // Initialize IndexedDB for persistent caching
            this.persistentCache = await this.initIndexedDB();
            this.isInitialized = true;
            console.log('✅ Enhanced Cache Manager initialized');
            
            // Load cached data from IndexedDB to memory
            await this.loadFromPersistentCache();
            
            // Setup periodic cleanup
            setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
            
        } catch (error) {
            console.error('❌ Cache initialization failed:', error);
        }
    }
    
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('UniAppCache', 2);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Cache store for data
                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                    cacheStore.createIndex('collection', 'collection', { unique: false });
                }
                
                // Sync queue store for offline operations
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    syncStore.createIndex('operation', 'operation', { unique: false });
                }
                
                // Metadata store
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }
    
    setupEventListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored');
            this.isOnline = true;
            this.syncOfflineOperations();
            this.hideOfflineIndicator();
        });
        
        window.addEventListener('offline', () => {
            console.log('📱 App is now offline');
            this.isOnline = false;
            this.showOfflineIndicator();
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.refreshStaleData();
            }
        });
    }
    
    // Get data with intelligent fallback
    async get(key, collection = null) {
        // Try memory cache first
        const memoryData = this.memoryCache.get(key);
        if (memoryData && !this.isExpired(memoryData.timestamp)) {
            console.log(`📦 Memory cache hit: ${key}`);
            return memoryData.data;
        }
        
        // Try persistent cache
        if (this.isInitialized) {
            const persistentData = await this.getFromPersistentCache(key);
            if (persistentData && !this.isExpired(persistentData.timestamp)) {
                console.log(`💾 Persistent cache hit: ${key}`);
                // Load back to memory cache
                this.memoryCache.set(key, persistentData);
                return persistentData.data;
            }
        }
        
        console.log(`❌ Cache miss: ${key}`);
        return null;
    }
    
    // Set data in both memory and persistent cache
    async set(key, data, collection = null) {
        const cacheEntry = {
            data,
            timestamp: Date.now(),
            collection,
            size: this.calculateSize(data)
        };
        
        // Set in memory cache
        this.memoryCache.set(key, cacheEntry);
        
        // Set in persistent cache
        if (this.isInitialized) {
            await this.setInPersistentCache(key, cacheEntry);
        }
        
        // Check memory usage
        this.checkMemoryUsage();
        
        console.log(`💾 Cached: ${key} (${this.formatSize(cacheEntry.size)})`);
    }
    
    async getFromPersistentCache(key) {
        if (!this.persistentCache) return null;
        
        return new Promise((resolve, reject) => {
            const transaction = this.persistentCache.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async setInPersistentCache(key, data) {
        if (!this.persistentCache) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.persistentCache.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.put({ key, ...data });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async loadFromPersistentCache() {
        if (!this.persistentCache) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.persistentCache.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const results = request.result;
                let loadedCount = 0;
                
                results.forEach(item => {
                    if (!this.isExpired(item.timestamp)) {
                        this.memoryCache.set(item.key, {
                            data: item.data,
                            timestamp: item.timestamp,
                            collection: item.collection,
                            size: item.size
                        });
                        loadedCount++;
                    }
                });
                
                console.log(`📦 Loaded ${loadedCount} items from persistent cache`);
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    // Invalidate cache by pattern
    async invalidate(pattern) {
        const keysToDelete = [];
        
        // Clear from memory cache
        for (const [key] of this.memoryCache) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
                this.memoryCache.delete(key);
            }
        }
        
        // Clear from persistent cache
        if (this.isInitialized) {
            await this.clearFromPersistentCache(keysToDelete);
        }
        
        console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries for pattern: ${pattern}`);
    }
    
    async clearFromPersistentCache(keys) {
        if (!this.persistentCache) return;
        
        const transaction = this.persistentCache.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        keys.forEach(key => {
            store.delete(key);
        });
    }
    
    // Add operation to sync queue for offline support
    async addToSyncQueue(operation) {
        if (!this.persistentCache) return;
        
        const syncItem = {
            operation: operation.type,
            data: operation.data,
            timestamp: Date.now(),
            retryCount: 0
        };
        
        return new Promise((resolve, reject) => {
            const transaction = this.persistentCache.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.add(syncItem);
            
            request.onsuccess = () => {
                console.log(`📝 Added to sync queue: ${operation.type}`);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    // Sync offline operations when back online
    async syncOfflineOperations() {
        if (!this.persistentCache || !this.isOnline) return;
        
        const operations = await this.getSyncQueue();
        if (operations.length === 0) return;
        
        console.log(`🔄 Syncing ${operations.length} offline operations...`);
        
        for (const operation of operations) {
            try {
                await this.executeSyncOperation(operation);
                await this.removeFromSyncQueue(operation.id);
                console.log(`✅ Synced: ${operation.operation}`);
            } catch (error) {
                console.error(`❌ Sync failed for ${operation.operation}:`, error);
                // Increment retry count
                operation.retryCount = (operation.retryCount || 0) + 1;
                if (operation.retryCount < 3) {
                    await this.updateSyncQueueItem(operation);
                } else {
                    await this.removeFromSyncQueue(operation.id);
                    console.error(`🚫 Max retries exceeded for ${operation.operation}`);
                }
            }
        }
    }
    
    async getSyncQueue() {
        if (!this.persistentCache) return [];
        
        return new Promise((resolve, reject) => {
            const transaction = this.persistentCache.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async removeFromSyncQueue(id) {
        if (!this.persistentCache) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.persistentCache.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async executeSyncOperation(operation) {
        // Import Firebase service dynamically
        const { FirebaseService } = window;
        
        switch (operation.operation) {
            case 'addStudent':
                return await FirebaseService.addStudent(operation.data);
            case 'updateStudent':
                return await FirebaseService.updateStudent(operation.data.id, operation.data);
            case 'addPayment':
                return await FirebaseService.addPayment(operation.data);
            case 'updatePayment':
                return await FirebaseService.updatePayment(operation.data.id, operation.data);
            default:
                throw new Error(`Unknown operation: ${operation.operation}`);
        }
    }
    
    // Refresh stale data in background
    async refreshStaleData() {
        const staleKeys = [];
        const staleThreshold = 10 * 60 * 1000; // 10 minutes
        
        for (const [key, entry] of this.memoryCache) {
            if (Date.now() - entry.timestamp > staleThreshold) {
                staleKeys.push(key);
            }
        }
        
        if (staleKeys.length > 0) {
            console.log(`🔄 Refreshing ${staleKeys.length} stale cache entries...`);
            // Trigger background refresh for stale data
            this.backgroundRefresh(staleKeys);
        }
    }
    
    async backgroundRefresh(keys) {
        // Implement background refresh logic here
        // This should fetch fresh data without blocking the UI
        for (const key of keys) {
            try {
                // Parse key to determine what data to fetch
                if (key.includes('students')) {
                    // Refresh students data
                } else if (key.includes('payments')) {
                    // Refresh payments data
                }
            } catch (error) {
                console.error(`❌ Background refresh failed for ${key}:`, error);
            }
        }
    }
    
    // Utility methods
    isExpired(timestamp) {
        return Date.now() - timestamp > this.cacheExpiry;
    }
    
    calculateSize(data) {
        return new Blob([JSON.stringify(data)]).size;
    }
    
    formatSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    checkMemoryUsage() {
        let totalSize = 0;
        for (const [, entry] of this.memoryCache) {
            totalSize += entry.size || 0;
        }
        
        if (totalSize > this.maxMemorySize) {
            console.warn(`⚠️ Memory cache size exceeded: ${this.formatSize(totalSize)}`);
            this.cleanup();
        }
    }
    
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        // Remove expired entries from memory cache
        for (const [key, entry] of this.memoryCache) {
            if (this.isExpired(entry.timestamp)) {
                this.memoryCache.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
        }
        
        // Clean up persistent cache periodically
        this.cleanupPersistentCache();
    }
    
    async cleanupPersistentCache() {
        if (!this.persistentCache) return;
        
        const transaction = this.persistentCache.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const index = store.index('timestamp');
        const cutoff = Date.now() - this.cacheExpiry;
        
        const range = IDBKeyRange.upperBound(cutoff);
        const request = index.openCursor(range);
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
    }
    
    showOfflineIndicator() {
        let indicator = document.getElementById('offline-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.className = 'fixed top-0 left-0 right-0 bg-yellow-600 text-white p-2 text-center z-50 text-sm';
            indicator.innerHTML = '📱 You are offline. Changes will be synced when connection is restored.';
            document.body.appendChild(indicator);
        }
    }
    
    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Get cache statistics
    getStats() {
        let memorySize = 0;
        for (const [, entry] of this.memoryCache) {
            memorySize += entry.size || 0;
        }
        
        return {
            memoryEntries: this.memoryCache.size,
            memorySize: this.formatSize(memorySize),
            isOnline: this.isOnline,
            syncQueueLength: this.syncQueue.length
        };
    }
}

// Enhanced Data Service with intelligent caching
class SmartDataService {
    constructor() {
        this.cache = new EnhancedCacheManager();
        this.isInitialized = false;
    }
    
    async init() {
        await this.cache.init();
        this.isInitialized = true;
        console.log('✅ Smart Data Service initialized');
    }
    
    async getStudents(pageSize = 20, page = 1, forceRefresh = false) {
        const cacheKey = `students_page_${page}_size_${pageSize}`;
        
        if (!forceRefresh) {
            const cached = await this.cache.get(cacheKey, 'students');
            if (cached) {
                console.log(`📦 Using cached students data (page ${page})`);
                return cached;
            }
        }
        
        try {
            // If offline, return what we have in cache
            if (!this.cache.isOnline) {
                console.log('📱 Offline mode: returning cached data only');
                return await this.cache.get(cacheKey, 'students') || { students: [], hasMore: false };
            }
            
            // Fetch from Firebase
            const { FirebaseService } = window;
            const result = await FirebaseService.getStudents(pageSize);
            
            // Cache the result
            await this.cache.set(cacheKey, result, 'students');
            
            console.log(`✅ Fetched and cached ${result.students?.length || 0} students`);
            return result;
            
        } catch (error) {
            console.error('❌ Error fetching students:', error);
            
            // Return cached data as fallback
            const cached = await this.cache.get(cacheKey, 'students');
            if (cached) {
                console.log('🔄 Returning cached data as fallback');
                return cached;
            }
            
            throw error;
        }
    }
    
    async getPayments(pageSize = 20, page = 1, forceRefresh = false) {
        const cacheKey = `payments_page_${page}_size_${pageSize}`;
        
        if (!forceRefresh) {
            const cached = await this.cache.get(cacheKey, 'payments');
            if (cached) {
                console.log(`📦 Using cached payments data (page ${page})`);
                return cached;
            }
        }
        
        try {
            if (!this.cache.isOnline) {
                console.log('📱 Offline mode: returning cached data only');
                return await this.cache.get(cacheKey, 'payments') || { payments: [], hasMore: false };
            }
            
            const { FirebaseService } = window;
            const result = await FirebaseService.getPayments(pageSize);
            
            await this.cache.set(cacheKey, result, 'payments');
            
            console.log(`✅ Fetched and cached ${result.payments?.length || 0} payments`);
            return result;
            
        } catch (error) {
            console.error('❌ Error fetching payments:', error);
            
            const cached = await this.cache.get(cacheKey, 'payments');
            if (cached) {
                console.log('🔄 Returning cached data as fallback');
                return cached;
            }
            
            throw error;
        }
    }
    
    async addStudent(studentData) {
        try {
            if (this.cache.isOnline) {
                const { FirebaseService } = window;
                const result = await FirebaseService.addStudent(studentData);
                
                // Invalidate students cache
                await this.cache.invalidate('students');
                
                return result;
            } else {
                // Add to sync queue for offline processing
                await this.cache.addToSyncQueue({
                    type: 'addStudent',
                    data: studentData
                });
                
                console.log('📝 Student added to offline sync queue');
                return { id: 'offline_' + Date.now() };
            }
        } catch (error) {
            console.error('❌ Error adding student:', error);
            throw error;
        }
    }
    
    async updateStudent(studentId, updateData) {
        try {
            if (this.cache.isOnline) {
                const { FirebaseService } = window;
                const result = await FirebaseService.updateStudent(studentId, updateData);
                
                // Invalidate students cache
                await this.cache.invalidate('students');
                
                return result;
            } else {
                // Add to sync queue for offline processing
                await this.cache.addToSyncQueue({
                    type: 'updateStudent',
                    data: { id: studentId, ...updateData }
                });
                
                console.log('📝 Student update added to offline sync queue');
                return true;
            }
        } catch (error) {
            console.error('❌ Error updating student:', error);
            throw error;
        }
    }
    
    // Force refresh all cached data
    async refreshAll() {
        console.log('🔄 Force refreshing all cached data...');
        await this.cache.invalidate('students');
        await this.cache.invalidate('payments');
    }
    
    // Get cache statistics
    getCacheStats() {
        return this.cache.getStats();
    }
}

// Initialize and export
window.SmartDataService = new SmartDataService();
window.EnhancedCacheManager = EnhancedCacheManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.SmartDataService.init();
    });
} else {
    window.SmartDataService.init();
}

console.log('🚀 Enhanced Cache and Offline Sync System loaded'); 