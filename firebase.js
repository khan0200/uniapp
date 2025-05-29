// Centralized Firebase Configuration
// This file initializes Firebase once and exports all necessary functions

// Import Firebase modules once
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    setDoc,
    writeBatch,
    query, 
    orderBy, 
    limit, 
    startAfter,
    where,
    serverTimestamp,
    connectFirestoreEmulator 
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDtc3StzPcG7oivivYlXnKrR6S0c0xelJg",
    authDomain: "uniuni-dd4af.firebaseapp.com",
    projectId: "uniuni-dd4af",
    storageBucket: "uniuni-dd4af.firebasestorage.app",
    messagingSenderId: "583982319464",
    appId: "1:583982319464:web:ed3021724ef42f196df8dd"
};

// Initialize Firebase
let app;
let db;
let isInitialized = false;

export async function initializeFirebase() {
    if (isInitialized) {
        return { app, db };
    }
    
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        isInitialized = true;
        console.log('✅ Firebase initialized successfully');
        return { app, db };
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        throw error;
    }
}

// Optimized data fetching functions
export class FirebaseService {
    static async getStudents(pageSize = 50, lastStudent = null) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const studentsRef = collection(db, "register");
            let q = query(studentsRef, orderBy("timestamp", "desc"), limit(pageSize));
            
            if (lastStudent) {
                q = query(studentsRef, orderBy("timestamp", "desc"), startAfter(lastStudent), limit(pageSize));
            }
            
            const snapshot = await getDocs(q);
            return {
                students: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === pageSize
            };
        } catch (error) {
            console.error('❌ Error fetching students:', error);
            throw error;
        }
    }
    
    static async getPayments(pageSize = 50, lastPayment = null) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const paymentsRef = collection(db, "payments");
            let q = query(paymentsRef, limit(pageSize));
            
            if (lastPayment) {
                q = query(paymentsRef, startAfter(lastPayment), limit(pageSize));
            }
            
            const snapshot = await getDocs(q);
            return {
                payments: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === pageSize
            };
        } catch (error) {
            console.error('❌ Error fetching payments:', error);
            throw error;
        }
    }
    
    static async getStudentById(studentId) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const studentRef = doc(db, "register", studentId);
            const studentDoc = await getDoc(studentRef);
            
            if (studentDoc.exists()) {
                return { id: studentDoc.id, ...studentDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching student:', error);
            throw error;
        }
    }
    
    static async searchStudents(searchTerm, field = 'fullname') {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const studentsRef = collection(db, "register");
            const q = query(
                studentsRef, 
                where(field, '>=', searchTerm),
                where(field, '<=', searchTerm + '\uf8ff'),
                limit(20)
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Error searching students:', error);
            throw error;
        }
    }
    
    static async addStudent(studentData) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const studentsRef = collection(db, "register");
            const docRef = await addDoc(studentsRef, {
                ...studentData,
                timestamp: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('❌ Error adding student:', error);
            throw error;
        }
    }
    
    static async updateStudent(studentId, updateData) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const studentRef = doc(db, "register", studentId);
            await updateDoc(studentRef, {
                ...updateData,
                lastModified: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('❌ Error updating student:', error);
            throw error;
        }
    }
    
    static async addPayment(paymentData) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const paymentsRef = collection(db, "payments");
            const docRef = await addDoc(paymentsRef, {
                ...paymentData,
                timestamp: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('❌ Error adding payment:', error);
            throw error;
        }
    }
    
    static async updatePayment(paymentId, updateData) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const paymentRef = doc(db, "payments", paymentId);
            await updateDoc(paymentRef, {
                ...updateData,
                lastModified: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('❌ Error updating payment:', error);
            throw error;
        }
    }
    
    static async getDocument(collectionName, docId) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error getting document:', error);
            throw error;
        }
    }

    static async setDocument(collectionName, docId, data) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, {
                ...data,
                timestamp: serverTimestamp()
            });
            return docId;
        } catch (error) {
            console.error('❌ Error setting document:', error);
            throw error;
        }
    }
    
    static async deleteDocument(collectionName, docId) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const docRef = doc(db, collectionName, docId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error('❌ Error deleting document:', error);
            throw error;
        }
    }
    
    static async batchWrite(operations) {
        if (!isInitialized) await initializeFirebase();
        
        try {
            const batch = writeBatch(db);
            
            operations.forEach(operation => {
                const { type, ref, data } = operation;
                switch (type) {
                    case 'set':
                        batch.set(ref, data);
                        break;
                    case 'update':
                        batch.update(ref, data);
                        break;
                    case 'delete':
                        batch.delete(ref);
                        break;
                }
            });
            
            await batch.commit();
            return true;
        } catch (error) {
            console.error('❌ Error executing batch write:', error);
            throw error;
        }
    }
}

// Export individual functions for backward compatibility
export {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    writeBatch,
    query,
    orderBy,
    limit,
    startAfter,
    where,
    serverTimestamp,
    db
};

// Initialize Firebase when module loads
initializeFirebase(); 