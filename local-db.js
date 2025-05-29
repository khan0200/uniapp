// Local Database Alternative using IndexedDB
// This provides faster performance when Firebase is slow

class LocalDatabase {
    constructor(dbName = 'UniAppDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.stores = ['students', 'payments', 'metadata'];
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Local database initialized');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create students store
                if (!db.objectStoreNames.contains('students')) {
                    const studentStore = db.createObjectStore('students', { keyPath: 'id' });
                    studentStore.createIndex('studentId', 'studentId', { unique: true });
                    studentStore.createIndex('fullname', 'fullname', { unique: false });
                    studentStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Create payments store
                if (!db.objectStoreNames.contains('payments')) {
                    const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
                    paymentStore.createIndex('studentId', 'studentId', { unique: false });
                    paymentStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Create metadata store
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
                
                console.log('📦 Database stores created');
            };
        });
    }
    
    async add(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const dataWithId = {
            ...data,
            id: data.id || this.generateId(),
            timestamp: data.timestamp || Date.now()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.add(dataWithId);
            request.onsuccess = () => resolve(dataWithId);
            request.onerror = () => reject(request.error);
        });
    }
    
    async update(storeName, id, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const existingData = getRequest.result;
                if (!existingData) {
                    reject(new Error('Record not found'));
                    return;
                }
                
                const updatedData = {
                    ...existingData,
                    ...data,
                    lastModified: Date.now()
                };
                
                const putRequest = store.put(updatedData);
                putRequest.onsuccess = () => resolve(updatedData);
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }
    
    async get(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getAll(storeName, limit = 100, offset = 0) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result
                    .slice(offset, offset + limit);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    async search(storeName, indexName, searchValue) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        
        return new Promise((resolve, reject) => {
            const results = [];
            const request = index.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const value = cursor.value[indexName];
                    if (value && value.toString().toLowerCase().includes(searchValue.toLowerCase())) {
                        results.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async delete(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    async clear(storeName) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    async setMetadata(key, value) {
        const transaction = this.db.transaction(['metadata'], 'readwrite');
        const store = transaction.objectStore('metadata');
        
        return new Promise((resolve, reject) => {
            const request = store.put({ key, value, timestamp: Date.now() });
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getMetadata(key) {
        const transaction = this.db.transaction(['metadata'], 'readonly');
        const store = transaction.objectStore('metadata');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }
    
    generateId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Hybrid service that uses both Firebase and local database
class HybridDataService {
    constructor() {
        this.localDB = new LocalDatabase();
        this.firebaseAvailable = false;
        this.syncPending = [];
        this.init();
    }
    
    async init() {
        await this.localDB.init();
        
        // Test Firebase availability
        try {
            if (window.FirebaseService) {
                this.firebaseAvailable = true;
                console.log('🔥 Firebase available - using hybrid mode');
                await this.syncFromFirebase();
            }
        } catch (error) {
            console.log('📱 Firebase unavailable - using local mode only');
            this.firebaseAvailable = false;
        }
    }
    
    async syncFromFirebase() {
        if (!this.firebaseAvailable) return;
        
        try {
            console.log('🔄 Syncing data from Firebase...');
            
            // Sync students
            const students = await window.FirebaseService.getStudents(1000);
            if (students && students.students) {
                await this.localDB.clear('students');
                for (const student of students.students) {
                    await this.localDB.add('students', student);
                }
            }
            
            // Sync payments
            const payments = await window.FirebaseService.getPayments(1000);
            if (payments && payments.payments) {
                await this.localDB.clear('payments');
                for (const payment of payments.payments) {
                    await this.localDB.add('payments', payment);
                }
            }
            
            await this.localDB.setMetadata('lastSync', Date.now());
            console.log('✅ Firebase sync completed');
            
        } catch (error) {
            console.error('❌ Firebase sync failed:', error);
        }
    }
    
    async getStudents(pageSize = 20, offset = 0) {
        const startTime = performance.now();
        
        try {
            const students = await this.localDB.getAll('students', pageSize, offset);
            
            console.log(`🚀 Local database query: ${(performance.now() - startTime).toFixed(2)}ms`);
            
            return {
                students: students,
                hasMore: students.length === pageSize,
                source: 'local'
            };
        } catch (error) {
            console.error('❌ Local database error:', error);
            
            if (this.firebaseAvailable) {
                console.log('🔄 Falling back to Firebase...');
                return await window.FirebaseService.getStudents(pageSize);
            }
            
            throw error;
        }
    }
    
    async getPayments(pageSize = 20, offset = 0) {
        const startTime = performance.now();
        
        try {
            const payments = await this.localDB.getAll('payments', pageSize, offset);
            
            console.log(`🚀 Local database query: ${(performance.now() - startTime).toFixed(2)}ms`);
            
            return {
                payments: payments,
                hasMore: payments.length === pageSize,
                source: 'local'
            };
        } catch (error) {
            console.error('❌ Local database error:', error);
            
            if (this.firebaseAvailable) {
                console.log('🔄 Falling back to Firebase...');
                return await window.FirebaseService.getPayments(pageSize);
            }
            
            throw error;
        }
    }
    
    async searchStudents(searchTerm, field = 'fullname') {
        const startTime = performance.now();
        
        try {
            const results = await this.localDB.search('students', field, searchTerm);
            
            console.log(`🔍 Local search completed: ${(performance.now() - startTime).toFixed(2)}ms`);
            
            return results;
        } catch (error) {
            console.error('❌ Local search error:', error);
            
            if (this.firebaseAvailable) {
                console.log('🔄 Falling back to Firebase search...');
                return await window.FirebaseService.searchStudents(searchTerm, field);
            }
            
            throw error;
        }
    }
    
    async addStudent(studentData) {
        try {
            // Add to local database first
            const localResult = await this.localDB.add('students', studentData);
            
            // Try to sync to Firebase
            if (this.firebaseAvailable) {
                try {
                    const firebaseResult = await window.FirebaseService.addStudent(studentData);
                    // Update local record with Firebase ID
                    if (firebaseResult) {
                        await this.localDB.update('students', localResult.id, { firebaseId: firebaseResult });
                    }
                } catch (error) {
                    console.warn('Failed to sync to Firebase, will retry later:', error);
                    this.syncPending.push({ type: 'add', store: 'students', data: studentData });
                }
            }
            
            return localResult;
        } catch (error) {
            console.error('❌ Failed to add student:', error);
            throw error;
        }
    }
    
    async updateStudent(studentId, updateData) {
        try {
            // Update local database first
            const localResult = await this.localDB.update('students', studentId, updateData);
            
            // Try to sync to Firebase
            if (this.firebaseAvailable) {
                try {
                    await window.FirebaseService.updateStudent(studentId, updateData);
                } catch (error) {
                    console.warn('Failed to sync update to Firebase, will retry later:', error);
                    this.syncPending.push({ type: 'update', store: 'students', id: studentId, data: updateData });
                }
            }
            
            return localResult;
        } catch (error) {
            console.error('❌ Failed to update student:', error);
            throw error;
        }
    }
    
    async getLastSyncTime() {
        return await this.localDB.getMetadata('lastSync');
    }
    
    async forceSyncToFirebase() {
        if (!this.firebaseAvailable) {
            console.log('Firebase not available for sync');
            return;
        }
        
        console.log('🔄 Force syncing to Firebase...');
        await this.syncFromFirebase();
    }
}

// Initialize hybrid service
const hybridService = new HybridDataService();

// Export for global access
window.HybridDataService = hybridService;
window.LocalDatabase = LocalDatabase;

console.log('💾 Local database and hybrid service initialized'); 