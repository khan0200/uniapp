// Performance Monitoring and Optimization for UniApp
// This file provides additional performance enhancements and monitoring

// Performance metrics tracking
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.thresholds = {
            slow: 1000, // 1 second
            warning: 500, // 500ms
            critical: 2000 // 2 seconds
        };
    }
    
    startMeasure(operationName) {
        this.metrics.set(operationName, {
            startTime: performance.now(),
            endTime: null,
            duration: null
        });
    }
    
    endMeasure(operationName) {
        const metric = this.metrics.get(operationName);
        if (!metric) return;
        
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;
        
        this.logPerformance(operationName, metric.duration);
        return metric.duration;
    }
    
    logPerformance(operation, duration) {
        const color = duration > this.thresholds.critical ? '🔴' :
                     duration > this.thresholds.slow ? '🟠' :
                     duration > this.thresholds.warning ? '🟡' : '🟢';
        
        console.log(`${color} ${operation}: ${duration.toFixed(2)}ms`);
        
        if (duration > this.thresholds.slow) {
            console.warn(`⚠️ Slow operation detected: ${operation} (${duration.toFixed(2)}ms)`);
            this.suggestOptimizations(operation, duration);
        }
    }
    
    suggestOptimizations(operation, duration) {
        const suggestions = {
            'firebase_query': [
                '• Use pagination with limit()',
                '• Add proper indexing in Firestore',
                '• Implement caching for repeated queries',
                '• Use compound queries instead of multiple single queries'
            ],
            'dom_update': [
                '• Use DocumentFragment for batch DOM updates',
                '• Implement virtual scrolling for large lists',
                '• Debounce rapid updates',
                '• Use CSS transforms instead of layout changes'
            ],
            'search': [
                '• Implement debouncing (already done)',
                '• Use server-side search for better performance',
                '• Cache search results',
                '• Implement search indexing'
            ]
        };
        
        const matchedSuggestions = Object.keys(suggestions).find(key => 
            operation.toLowerCase().includes(key)
        );
        
        if (matchedSuggestions) {
            console.group(`💡 Optimization suggestions for ${operation}:`);
            suggestions[matchedSuggestions].forEach(suggestion => 
                console.log(suggestion)
            );
            console.groupEnd();
        }
    }
    
    getMetrics() {
        return Array.from(this.metrics.entries()).map(([name, metric]) => ({
            name,
            ...metric
        }));
    }
    
    clearMetrics() {
        this.metrics.clear();
    }
}

// Offline support and data synchronization
class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.localStorageKey = 'uniapp_offline_data';
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored');
            this.isOnline = true;
            this.syncPendingOperations();
        });
        
        window.addEventListener('offline', () => {
            console.log('📱 App is now offline');
            this.isOnline = false;
            this.showOfflineMessage();
        });
    }
    
    showOfflineMessage() {
        const message = document.createElement('div');
        message.id = 'offline-message';
        message.className = 'fixed top-0 left-0 right-0 bg-yellow-600 text-white p-2 text-center z-50';
        message.innerHTML = '📱 You are offline. Changes will be synced when connection is restored.';
        
        if (!document.getElementById('offline-message')) {
            document.body.appendChild(message);
        }
    }
    
    hideOfflineMessage() {
        const message = document.getElementById('offline-message');
        if (message) {
            message.remove();
        }
    }
    
    addPendingOperation(operation) {
        this.pendingOperations.push({
            ...operation,
            timestamp: Date.now()
        });
        this.saveToLocalStorage();
    }
    
    async syncPendingOperations() {
        if (!this.isOnline || this.pendingOperations.length === 0) return;
        
        console.log(`🔄 Syncing ${this.pendingOperations.length} pending operations...`);
        
        const operations = [...this.pendingOperations];
        this.pendingOperations = [];
        
        for (const operation of operations) {
            try {
                await this.executePendingOperation(operation);
                console.log(`✅ Synced operation: ${operation.type}`);
            } catch (error) {
                console.error(`❌ Failed to sync operation:`, error);
                this.pendingOperations.push(operation); // Re-add failed operation
            }
        }
        
        this.saveToLocalStorage();
        this.hideOfflineMessage();
    }
    
    async executePendingOperation(operation) {
        const { FirebaseService } = window;
        
        switch (operation.type) {
            case 'addStudent':
                return await FirebaseService.addStudent(operation.data);
            case 'updateStudent':
                return await FirebaseService.updateStudent(operation.id, operation.data);
            case 'addPayment':
                return await FirebaseService.addPayment(operation.data);
            case 'updatePayment':
                return await FirebaseService.updatePayment(operation.id, operation.data);
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }
    
    saveToLocalStorage() {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.pendingOperations));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }
    
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.localStorageKey);
            if (data) {
                this.pendingOperations = JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.pendingOperations = [];
        }
    }
}

// Memory usage optimization
class MemoryOptimizer {
    constructor() {
        this.checkInterval = 30000; // 30 seconds
        this.memoryThreshold = 50; // MB
        this.startMonitoring();
    }
    
    startMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                this.checkMemoryUsage();
            }, this.checkInterval);
        }
    }
    
    checkMemoryUsage() {
        if (!('memory' in performance)) return;
        
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        
        if (usedMB > this.memoryThreshold) {
            console.warn(`⚠️ High memory usage: ${usedMB.toFixed(2)}MB`);
            this.optimizeMemory();
        }
    }
    
    optimizeMemory() {
        // Clear old cache entries
        const { CacheManager } = window;
        if (CacheManager) {
            console.log('🧹 Clearing old cache entries to free memory');
            CacheManager.clear();
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear unused DOM references
        this.clearUnusedDOMReferences();
    }
    
    clearUnusedDOMReferences() {
        // Remove old error messages
        const oldErrors = document.querySelectorAll('#error-message');
        oldErrors.forEach(error => {
            if (error.parentNode) {
                error.remove();
            }
        });
    }
}

// Network optimization
class NetworkOptimizer {
    constructor() {
        this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        this.setupNetworkAdaptation();
    }
    
    setupNetworkAdaptation() {
        if (this.connection) {
            this.connection.addEventListener('change', () => {
                this.adaptToConnectionSpeed();
            });
            
            // Initial adaptation
            this.adaptToConnectionSpeed();
        }
    }
    
    adaptToConnectionSpeed() {
        if (!this.connection) return;
        
        const effectiveType = this.connection.effectiveType;
        
        switch (effectiveType) {
            case 'slow-2g':
            case '2g':
                this.configureForSlowConnection();
                break;
            case '3g':
                this.configureForMediumConnection();
                break;
            case '4g':
                this.configureForFastConnection();
                break;
        }
    }
    
    configureForSlowConnection() {
        console.log('🐌 Slow connection detected - optimizing for low bandwidth');
        // Reduce page size, disable real-time features
        if (window.uniApp) {
            window.uniApp.pageSize = 10;
            window.uniApp.realTimeEnabled = false;
        }
    }
    
    configureForMediumConnection() {
        console.log('🚶 Medium connection detected - using balanced settings');
        if (window.uniApp) {
            window.uniApp.pageSize = 20;
            window.uniApp.realTimeEnabled = true;
        }
    }
    
    configureForFastConnection() {
        console.log('🏃 Fast connection detected - enabling all features');
        if (window.uniApp) {
            window.uniApp.pageSize = 50;
            window.uniApp.realTimeEnabled = true;
        }
    }
}

// Initialize performance optimization
const performanceMonitor = new PerformanceMonitor();
const offlineManager = new OfflineManager();
const memoryOptimizer = new MemoryOptimizer();
const networkOptimizer = new NetworkOptimizer();

// Load pending operations from localStorage
offlineManager.loadFromLocalStorage();

// Export for global access
window.PerformanceMonitor = performanceMonitor;
window.OfflineManager = offlineManager;
window.MemoryOptimizer = memoryOptimizer;
window.NetworkOptimizer = networkOptimizer;

// Helper function to measure Firebase operations
window.measureFirebaseOperation = async function(operationName, operation) {
    performanceMonitor.startMeasure(operationName);
    try {
        const result = await operation();
        return result;
    } finally {
        performanceMonitor.endMeasure(operationName);
    }
};

console.log('🚀 Performance optimization modules loaded successfully'); 