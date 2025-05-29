// Example integration of Audit Logger into existing UniApp pages
// This file shows how to add audit logging to your existing functionality

// ===== REGISTER.HTML INTEGRATION =====
// Add this to your existing register.html script section

/*
// After successful student registration, add audit logging:

async function registerStudent(studentData) {
    try {
        // Your existing registration code...
        const docRef = await addDoc(collection(db, "register"), {
            ...studentData,
            timestamp: serverTimestamp()
        });
        
        // ADD AUDIT LOGGING HERE:
        if (window.auditLogger) {
            await window.auditLogger.logRegistration(studentData);
        }
        
        console.log("Student registered successfully!");
        
    } catch (error) {
        console.error("Error registering student:", error);
    }
}
*/

// ===== STUDENTLIST.HTML INTEGRATION =====
// Add this to your existing student edit functionality

/*
// When editing student data, track changes:

async function updateStudentData(studentId, originalData, newData) {
    try {
        // Find what fields changed
        const changedFields = [];
        for (const key in newData) {
            if (originalData[key] !== newData[key]) {
                changedFields.push(key);
            }
        }
        
        if (changedFields.length === 0) {
            console.log("No changes detected");
            return;
        }
        
        // Update the student document
        const studentRef = doc(db, "register", studentId);
        await updateDoc(studentRef, {
            ...newData,
            lastModified: serverTimestamp()
        });
        
        // ADD AUDIT LOGGING HERE:
        if (window.auditLogger) {
            await window.auditLogger.logStudentEdit(
                studentId,
                newData.fullname || originalData.fullname,
                originalData,
                newData,
                changedFields
            );
        }
        
        console.log("Student data updated successfully!");
        
    } catch (error) {
        console.error("Error updating student:", error);
    }
}
*/

// ===== PAYMENTS.HTML INTEGRATION =====
// Add this to your payment processing functionality

/*
// When recording a payment:

async function recordPayment(studentId, studentName, paymentData) {
    try {
        // Your existing payment recording code...
        const paymentRef = collection(db, `payments${studentId}`, "paymentHistory");
        await addDoc(paymentRef, {
            ...paymentData,
            timestamp: serverTimestamp()
        });
        
        // ADD AUDIT LOGGING HERE:
        if (window.auditLogger) {
            await window.auditLogger.logPayment(studentId, studentName, paymentData);
        }
        
        console.log("Payment recorded successfully!");
        
    } catch (error) {
        console.error("Error recording payment:", error);
    }
}

// When updating payment status:
async function updatePaymentStatus(studentId, studentName, updateType, description) {
    try {
        // Your existing payment update code...
        
        // ADD AUDIT LOGGING HERE:
        if (window.auditLogger) {
            await window.auditLogger.logPaymentUpdate(
                studentId,
                studentName,
                updateType,
                description,
                { timestamp: new Date() }
            );
        }
        
        console.log("Payment status updated!");
        
    } catch (error) {
        console.error("Error updating payment status:", error);
    }
}
*/

// ===== SYSTEM ACTIONS INTEGRATION =====
// For tracking system-level actions

/*
// Example: When bulk operations are performed
async function performBulkOperation(operation, items) {
    try {
        // Perform your bulk operation...
        
        // ADD AUDIT LOGGING HERE:
        if (window.auditLogger) {
            await window.auditLogger.logBulkOperation(
                operation,
                items.length,
                `Bulk ${operation} performed on ${items.length} items`
            );
        }
        
    } catch (error) {
        console.error("Error in bulk operation:", error);
    }
}

// Example: When data is deleted
async function deleteStudent(studentId, studentName, reason) {
    try {
        // Your deletion code...
        
        // ADD AUDIT LOGGING HERE:
        if (window.auditLogger) {
            await window.auditLogger.logDeletion(
                'Student',
                studentId,
                studentName,
                reason
            );
        }
        
    } catch (error) {
        console.error("Error deleting student:", error);
    }
}
*/

// ===== INITIALIZATION TEMPLATE =====
// Add this to the beginning of each page that needs audit logging

/*
// Initialize audit logger on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Your existing Firebase initialization...
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Initialize audit logger
        if (window.auditLogger) {
            await window.auditLogger.initialize(db);
            window.auditLogger.setCurrentUser('admin'); // Set current user
        }
        
    } catch (error) {
        console.error('Error initializing audit logger:', error);
    }
});
*/

// ===== UTILITY FUNCTIONS =====
// Helper functions for common audit logging scenarios

function logUserLogin(username) {
    if (window.auditLogger) {
        window.auditLogger.logUserActivity('user_login', username, {
            timestamp: new Date(),
            page: window.location.pathname
        });
    }
}

function logUserLogout(username) {
    if (window.auditLogger) {
        window.auditLogger.logUserActivity('user_logout', username, {
            timestamp: new Date(),
            page: window.location.pathname
        });
    }
}

function logSystemError(error, context) {
    if (window.auditLogger) {
        window.auditLogger.logSystemAction(
            'system_error',
            'System Error Occurred',
            `Error: ${error.message} in ${context}`,
            {
                error: error.toString(),
                stack: error.stack,
                context: context,
                timestamp: new Date()
            }
        );
    }
}

// ===== REAL-TIME ACTIVITY TRACKING =====
// For pages that need to show recent activities

async function loadRecentActivities(containerId, limit = 5) {
    try {
        if (!window.auditLogger) return;
        
        const activities = await window.auditLogger.getRecentActivities(limit);
        const container = document.getElementById(containerId);
        
        if (!container) return;
        
        const activitiesHTML = activities.map(activity => `
            <div class="recent-activity-item">
                <div class="activity-icon ${activity.action}">
                    ${getActivityIcon(activity.action)}
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${formatRelativeTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = activitiesHTML;
        
    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

function getActivityIcon(action) {
    const icons = {
        'student_registration': '👤',
        'student_edit': '✏️',
        'payment_received': '💳',
        'payment_update': '💰',
        'system_action': '⚙️',
        'data_deletion': '🗑️',
        'user_login': '🔑',
        'user_logout': '🚪',
        'bulk_operation': '📦'
    };
    return icons[action] || '📝';
}

function formatRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

// ===== EXAMPLE USAGE IN HTML =====
/*
<!-- Add this to your HTML head section -->
<script src="./audit-logger.js"></script>

<!-- Add this to show recent activities widget -->
<div class="recent-activities-widget">
    <h3>Recent Activities</h3>
    <div id="recentActivities">
        <!-- Activities will be loaded here -->
    </div>
</div>

<!-- Add this script to load activities -->
<script>
    // Load recent activities every 30 seconds
    setInterval(() => {
        loadRecentActivities('recentActivities', 5);
    }, 30000);
    
    // Load initially
    loadRecentActivities('recentActivities', 5);
</script>
*/

console.log('📋 Audit Integration Examples Loaded - Ready to implement in your pages!'); 