// Audit Logger System for UniApp
// This module handles logging all activities and changes across the system

class AuditLogger {
    constructor() {
        this.db = null;
        this.currentUser = 'admin'; // Default user, can be set dynamically
    }

    // Initialize with Firebase database
    async initialize(database) {
        this.db = database;
        console.log('✅ Audit Logger initialized');
    }

    // Set current user for logging
    setCurrentUser(username) {
        this.currentUser = username;
    }

    // Log student registration
    async logRegistration(studentData) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const auditLogRef = collection(this.db, "auditLog");
            await addDoc(auditLogRef, {
                action: 'student_registration',
                title: 'New Student Registered',
                description: `${studentData.fullname} (ID: ${studentData.studentId}) registered for ${studentData.educationLevel} program`,
                studentId: studentData.studentId,
                studentName: studentData.fullname,
                user: this.currentUser,
                timestamp: serverTimestamp(),
                metadata: {
                    educationLevel: studentData.educationLevel,
                    tariff: studentData.tariff,
                    university1: studentData.university1,
                    phone1: studentData.phone1 || studentData.phoneNumber
                }
            });
            
            console.log('📝 Logged student registration:', studentData.studentId);
        } catch (error) {
            console.error('❌ Error logging registration:', error);
        }
    }

    // Log student data edits with detailed change tracking
    async logStudentEdit(studentId, studentName, originalData, newData, changedFields) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            // Create detailed change list
            const changes = changedFields.map(field => ({
                field: field,
                oldValue: originalData[field] || '',
                newValue: newData[field] || ''
            }));

            const auditLogRef = collection(this.db, "auditLog");
            await addDoc(auditLogRef, {
                action: 'student_edit',
                title: 'Student Data Updated',
                description: `Student information updated for ${studentName} (ID: ${studentId})`,
                studentId: studentId,
                studentName: studentName,
                user: this.currentUser,
                timestamp: serverTimestamp(),
                changes: changes,
                originalData: originalData,
                newData: newData,
                metadata: {
                    fieldsChanged: changedFields.length,
                    changeType: 'data_update'
                }
            });
            
            console.log('📝 Logged student edit:', studentId, 'Fields changed:', changedFields);
        } catch (error) {
            console.error('❌ Error logging student edit:', error);
        }
    }

    // Log payment activities
    async logPayment(studentId, studentName, paymentData) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const auditLogRef = collection(this.db, "auditLog");
            await addDoc(auditLogRef, {
                action: 'payment_received',
                title: 'Payment Received',
                description: `Payment of ${this.formatCurrency(paymentData.amount)} received via ${paymentData.paymentMethod} for ${studentName} (ID: ${studentId})`,
                studentId: studentId,
                studentName: studentName,
                user: paymentData.receivedBy || this.currentUser,
                timestamp: serverTimestamp(),
                metadata: {
                    amount: paymentData.amount,
                    paymentMethod: paymentData.paymentMethod,
                    receivedBy: paymentData.receivedBy,
                    paymentType: paymentData.paymentType || 'tuition'
                }
            });
            
            console.log('📝 Logged payment:', studentId, 'Amount:', paymentData.amount);
        } catch (error) {
            console.error('❌ Error logging payment:', error);
        }
    }

    // Log application fee payments
    async logApplicationFee(studentId, studentName, feeData) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const auditLogRef = collection(this.db, "auditLog");
            await addDoc(auditLogRef, {
                action: 'application_fee_payment',
                title: 'Application Fee Payment',
                description: `Application fee payment of ${this.formatCurrency(feeData.totalAmount || feeData.amount)} updated for ${studentName} (ID: ${studentId}) - ${feeData.feeBreakdown}`,
                studentId: studentId,
                studentName: studentName,
                user: this.currentUser,
                timestamp: serverTimestamp(),
                metadata: {
                    totalAmount: feeData.totalAmount || feeData.amount,
                    university: feeData.university,
                    paymentMethod: feeData.paymentMethod,
                    receivedBy: feeData.receivedBy,
                    feeBreakdown: feeData.feeBreakdown,
                    paymentType: 'application_fee',
                    // Only include fee1/fee2 if they exist and are not undefined
                    ...(feeData.fee1 !== undefined && { fee1: feeData.fee1 }),
                    ...(feeData.fee2 !== undefined && { fee2: feeData.fee2 })
                }
            });
            
            console.log('📝 Logged application fee:', studentId, 'Amount:', feeData.totalAmount || feeData.amount);
        } catch (error) {
            console.error('❌ Error logging application fee:', error);
        }
    }

    // Log payment status updates
    async logPaymentUpdate(studentId, studentName, updateType, description, metadata = {}) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const auditLogRef = collection(this.db, "auditLog");
            await addDoc(auditLogRef, {
                action: 'payment_update',
                title: 'Payment Status Updated',
                description: `${description} for ${studentName} (ID: ${studentId})`,
                studentId: studentId,
                studentName: studentName,
                user: this.currentUser,
                timestamp: serverTimestamp(),
                metadata: {
                    updateType: updateType,
                    ...metadata
                }
            });
            
            console.log('📝 Logged payment update:', studentId, updateType);
        } catch (error) {
            console.error('❌ Error logging payment update:', error);
        }
    }

    // Log system actions
    async logSystemAction(action, title, description, metadata = {}) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const auditLogRef = collection(this.db, "auditLog");
            await addDoc(auditLogRef, {
                action: action,
                title: title,
                description: description,
                user: 'system',
                timestamp: serverTimestamp(),
                metadata: metadata
            });
            
            console.log('📝 Logged system action:', action);
        } catch (error) {
            console.error('❌ Error logging system action:', error);
        }
    }

    // Log data deletion
    async logDeletion(entityType, entityId, entityName, reason = '') {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const auditLogRef = collection(this.db, "auditLog");
            await addDoc(auditLogRef, {
                action: 'data_deletion',
                title: `${entityType} Deleted`,
                description: `${entityType} "${entityName}" (ID: ${entityId}) was deleted${reason ? '. Reason: ' + reason : ''}`,
                entityType: entityType,
                entityId: entityId,
                entityName: entityName,
                user: this.currentUser,
                timestamp: serverTimestamp(),
                metadata: {
                    reason: reason,
                    deletionType: entityType
                }
            });
            
            console.log('📝 Logged deletion:', entityType, entityId);
        } catch (error) {
            console.error('❌ Error logging deletion:', error);
        }
    }

    // Log user login/logout
    async logUserActivity(action, username, metadata = {}) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const auditLogRef = collection(this.db, "auditLog");
            await addDoc(auditLogRef, {
                action: action,
                title: action === 'user_login' ? 'User Login' : 'User Logout',
                description: `User ${username} ${action === 'user_login' ? 'logged in' : 'logged out'}`,
                user: username,
                timestamp: serverTimestamp(),
                metadata: {
                    userAgent: navigator.userAgent,
                    ...metadata
                }
            });
            
            console.log('📝 Logged user activity:', action, username);
        } catch (error) {
            console.error('❌ Error logging user activity:', error);
        }
    }

    // Log bulk operations
    async logBulkOperation(operation, affectedCount, description, metadata = {}) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const auditLogRef = collection(this.db, "auditLog");
            await addDoc(auditLogRef, {
                action: 'bulk_operation',
                title: `Bulk ${operation}`,
                description: `${description} (${affectedCount} items affected)`,
                user: this.currentUser,
                timestamp: serverTimestamp(),
                metadata: {
                    operation: operation,
                    affectedCount: affectedCount,
                    ...metadata
                }
            });
            
            console.log('📝 Logged bulk operation:', operation, affectedCount);
        } catch (error) {
            console.error('❌ Error logging bulk operation:', error);
        }
    }

    // Utility function to compare objects and find changed fields
    findChangedFields(originalData, newData) {
        const changedFields = [];
        const allKeys = new Set([...Object.keys(originalData), ...Object.keys(newData)]);
        
        for (const key of allKeys) {
            if (originalData[key] !== newData[key]) {
                changedFields.push(key);
            }
        }
        
        return changedFields;
    }

    // Format currency for logging
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }

    // Get recent activities (for dashboard widgets)
    async getRecentActivities(limit = 10) {
        try {
            const { collection, query, orderBy, limit: limitQuery, getDocs } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const auditLogRef = collection(this.db, "auditLog");
            const q = query(auditLogRef, orderBy("timestamp", "desc"), limitQuery(limit));
            const snapshot = await getDocs(q);
            
            const activities = [];
            snapshot.forEach((doc) => {
                activities.push({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate() || new Date()
                });
            });
            
            return activities;
        } catch (error) {
            console.error('❌ Error getting recent activities:', error);
            return [];
        }
    }

    // Clean up old audit logs (optional maintenance function)
    async cleanupOldLogs(daysToKeep = 90) {
        try {
            const { collection, query, where, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const auditLogRef = collection(this.db, "auditLog");
            const q = query(auditLogRef, where("timestamp", "<", cutoffDate));
            const snapshot = await getDocs(q);
            
            const deletePromises = [];
            snapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            
            await Promise.all(deletePromises);
            
            console.log(`🧹 Cleaned up ${snapshot.size} old audit log entries`);
            return snapshot.size;
        } catch (error) {
            console.error('❌ Error cleaning up old logs:', error);
            return 0;
        }
    }
}

// Create global instance
window.auditLogger = new AuditLogger();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditLogger;
} 