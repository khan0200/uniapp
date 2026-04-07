// ==========================================
// FIREBASE FIRESTORE CONFIGURATION
// ==========================================

// Firebase Configuration for unibridge-7d530
const firebaseConfig = {
    apiKey: "AIzaSyDbtscTvtaAj2UKxCddU-0OeUPoAMhc60c",
    authDomain: "unibridge-7d530.firebaseapp.com",
    projectId: "unibridge-7d530",
    storageBucket: "unibridge-7d530.firebasestorage.app",
    messagingSenderId: "562821836520",
    appId: "1:562821836520:web:2f4acaff9428ec3f18235d"
};

// ==========================================
// FIREBASE INITIALIZATION
// ==========================================

let db = null;
let firebaseInitialized = false;

// Check if Firebase SDK is loaded
if (typeof firebase !== 'undefined') {
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        firebaseInitialized = true;
        console.log('✅ Firestore initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.log('⚠️ Falling back to localStorage');
    }
} else {
    console.warn('⚠️ Firebase SDK not loaded. Using localStorage as fallback.');
}

// ==========================================
// TELEGRAM NOTIFICATIONS
// ==========================================

async function sendTelegramNotification(message) {
    try {
        const response = await fetch('/api/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            console.error('Failed to send Telegram notification');
        }
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
    }
}

// ==========================================
// SAVE STUDENT TO FIRESTORE
// ==========================================

async function saveStudentToFirestore(studentData) {
    const saveBtn = document.getElementById('saveStudentBtn');
    const saveIcon = document.getElementById('saveStudentIcon');
    const saveSpinner = document.getElementById('saveStudentSpinner');
    const saveText = document.getElementById('saveStudentText');

    // UI Loading state
    if (saveBtn) {
        saveBtn.disabled = true;
        if (saveSpinner) saveSpinner.classList.remove('d-none');
        if (saveIcon) saveIcon.classList.add('d-none');
        if (saveText) saveText.textContent = 'Saving...';
    }

    if (!firebaseInitialized) {
        console.log('Firebase not available, saving to localStorage');
        saveToLocalStorage(studentData);
        resetSaveButtonState(saveBtn, saveIcon, saveSpinner, saveText);
        return;
    }

    try {
        // Add timestamp
        studentData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        studentData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        // Add to Firestore
        const docRef = await db.collection('students').add(studentData);

        console.log('✅ Student saved to Firestore with ID:', docRef.id);

        if (typeof showNotification === 'function') {
            showNotification('Student saved successfully!', 'success');
        }

        // Send Telegram Notification
        const safeName = studentData.fullName ? studentData.fullName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Unknown';
        const safeOffice = studentData.office ? studentData.office.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '-';
        const notifMsg = `🆕 <b>New Registration!</b>\n\n👤 <b>Name:</b> ${safeName}\n🆔 <b>ID:</b> ${studentData.id || '-'}\n🏢 <b>Office:</b> ${safeOffice}`;
        sendTelegramNotification(notifMsg);

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
        if (modal) {
            modal.hide();
        }
        document.getElementById('addStudentForm').reset();

        // Reload students
        loadStudentsFromFirestore();
    } catch (error) {
        console.error('❌ Error saving student to Firestore:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error saving student: ' + error.message, 'error');
        }
        // Fallback to localStorage
        saveToLocalStorage(studentData);
    } finally {
        resetSaveButtonState(saveBtn, saveIcon, saveSpinner, saveText);
    }
}

// Helper to reset the save button
function resetSaveButtonState(btn, icon, spinner, text) {
    if (btn) btn.disabled = false;
    if (spinner) spinner.classList.add('d-none');
    if (icon) icon.classList.remove('d-none');
    if (text) text.textContent = 'Save Student';
}

// ==========================================
// LOAD STUDENTS FROM FIRESTORE
// ==========================================

function loadStudentsFromFirestore() {
    if (!firebaseInitialized) {
        console.log('Firebase not available, loading from localStorage');
        loadFromLocalStorage();
        return;
    }

    // Real-time listener for students collection
    db.collection('students')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            window.studentsData = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                // Convert Firestore timestamp to ISO string
                if (data.createdAt && data.createdAt.toDate) {
                    data.createdAt = data.createdAt.toDate().toISOString();
                }
                if (data.updatedAt && data.updatedAt.toDate) {
                    data.updatedAt = data.updatedAt.toDate().toISOString();
                }

                window.studentsData.push({
                    firestoreId: doc.id,
                    ...data
                });
            });

            console.log(`✅ Loaded ${window.studentsData.length} students from Firestore`);

            // Update UI
            if (typeof renderStudents === 'function') {
                renderStudents();
            }

            // Also save to localStorage as backup
            localStorage.setItem('studentsData', JSON.stringify(window.studentsData));
        }, (error) => {
            console.error('❌ Error loading students from Firestore:', error);
            loadFromLocalStorage();
        });
}

// ==========================================
// UPDATE STUDENT IN FIRESTORE
// ==========================================

async function updateStudentInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) {
        console.log('Firebase not available or no ID provided');
        return;
    }

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        await db.collection('students').doc(firestoreId).update(updatedData);

        console.log('✅ Student updated successfully');
        if (typeof showNotification === 'function') {
            showNotification('Student updated successfully!', 'success');
        }

        // Removed Profile Updated notification per user request

    } catch (error) {
        console.error('❌ Error updating student:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error updating student: ' + error.message, 'error');
        }
    }
}

// ==========================================
// DELETE STUDENT FROM FIRESTORE
// ==========================================

async function deleteStudentFromFirestore(firestoreId) {
    if (!firebaseInitialized || !firestoreId) {
        console.log('Firebase not available or no ID provided');
        return;
    }

    try {
        await db.collection('students').doc(firestoreId).delete();

        console.log('✅ Student deleted successfully');
        if (typeof showNotification === 'function') {
            showNotification('Student deleted successfully!', 'success');
        }
    } catch (error) {
        console.error('❌ Error deleting student:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error deleting student: ' + error.message, 'error');
        }
    }
}

// ==========================================
// LOCALSTORAGE FALLBACK FUNCTIONS
// ==========================================

function saveToLocalStorage(studentData) {
    let students = [];
    const savedData = localStorage.getItem('studentsData');

    if (savedData) {
        students = JSON.parse(savedData);
    }

    students.push(studentData);
    localStorage.setItem('studentsData', JSON.stringify(students));

    window.studentsData = students;

    if (typeof showNotification === 'function') {
        showNotification('Student saved to local storage!', 'success');
    }

    if (typeof renderStudents === 'function') {
        renderStudents();
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
    if (modal) {
        modal.hide();
    }
    document.getElementById('addStudentForm').reset();
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('studentsData');

    if (savedData) {
        window.studentsData = JSON.parse(savedData);
        console.log(`📦 Loaded ${window.studentsData.length} students from localStorage`);
    } else {
        window.studentsData = [];
    }

    if (typeof renderStudents === 'function') {
        renderStudents();
    }
}

// Note: Data loading is now consolidated in a single DOMContentLoaded listener at the end of this file

// ==========================================
// PAYMENTS FIRESTORE FUNCTIONS
// ==========================================

// Global payments data array
window.paymentsData = [];

// Save payment to Firestore
async function savePaymentToFirestore(paymentData) {
    if (!firebaseInitialized) {
        console.log('Firebase not available, saving payment to localStorage');
        savePaymentToLocalStorage(paymentData);
        return;
    }

    try {
        // Add timestamp
        paymentData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

        // Add to Firestore payments collection
        const docRef = await db.collection('payments').add(paymentData);

        console.log('✅ Payment saved to Firestore with ID:', docRef.id);

        // If payment is linked to a student, update student's balance
        if (paymentData.studentFirestoreId) {
            await updateStudentBalance(paymentData.studentFirestoreId, paymentData.amount);
        }

        if (typeof showNotification === 'function') {
            const message = paymentData.isWithdrawal ? 'Withdrawal recorded successfully!' : 'Payment recorded successfully!';
            showNotification(message, 'success');
        }

        // Send Telegram Notification
        const safeName = paymentData.studentName ? paymentData.studentName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Unknown';
        const amountFormatted = new Intl.NumberFormat('uz-UZ').format(paymentData.amount) + ' UZS';
        const strId = paymentData.studentId || '-';

        // Get student's new balance to show
        let finalBalanceStr = '-';
        let tariffName = '-';
        if (paymentData.studentFirestoreId) {
            const sIdx = window.studentsData.findIndex(s => s.firestoreId === paymentData.studentFirestoreId);
            if (sIdx !== -1) {
                finalBalanceStr = new Intl.NumberFormat('uz-UZ').format(window.studentsData[sIdx].balance) + ' UZS';
                tariffName = window.studentsData[sIdx].tariff || '-';
            }
        }

        let notifMsg = '';
        if (paymentData.isWithdrawal) {
            notifMsg = `🟥 <b>Withdrawal</b>\n\n👤 <b>Student:</b> ${safeName}\n💰 <b>Amount:</b> -${amountFormatted}\n📝 <b>Note:</b> ${paymentData.notes || 'None'}`;
        } else if (paymentData.isDiscount) {
            notifMsg = `🟨 <b>Discount Added</b>\n\n🆔 <b>ID:</b> ${strId}\n👤 <b>Student:</b> ${safeName}\n💰 <b>Amount:</b> ${amountFormatted}\n📝 <b>Note:</b> ${paymentData.notes || 'None'}`;
        } else {
            const curDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            notifMsg = `🟩 <b>Payment Received</b>\n\n🆔 <b>ID:</b> ${strId}\n👤 <b>Name:</b> ${safeName}\n\n📰 <b>Tariff:</b> ${tariffName}\n💰 <b>Amount:</b> ${amountFormatted}\n💼 <b>Balance:</b> ${finalBalanceStr}\n💳 <b>Payment Type:</b> ${paymentData.method || '-'}\n🧾 <b>Received by:</b> ${paymentData.receivedBy || '-'}\n\n📝 <b>Note:</b> ${paymentData.notes || 'None'}\n\n📅 <b>Date:</b> ${curDate}`;
        }

        sendTelegramNotification(notifMsg);

        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving payment to Firestore:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error saving payment: ' + error.message, 'error');
        }
        // Fallback to localStorage
        savePaymentToLocalStorage(paymentData);
    }
}

// Update student balance after payment
async function updateStudentBalance(studentFirestoreId, paymentAmount) {
    if (!firebaseInitialized || !studentFirestoreId) return;

    try {
        // Get current student data
        const studentDoc = await db.collection('students').doc(studentFirestoreId).get();
        if (!studentDoc.exists) {
            console.error('Student not found:', studentFirestoreId);
            return;
        }

        const studentData = studentDoc.data();
        const currentBalance = parseFloat(studentData.balance) || 0;
        const newBalance = currentBalance + parseFloat(paymentAmount);

        // Update student balance in Firestore
        await db.collection('students').doc(studentFirestoreId).update({
            balance: newBalance,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Student balance updated:', newBalance);

        // Also update local data immediately for instant UI refresh
        const studentIndex = window.studentsData.findIndex(s => s.firestoreId === studentFirestoreId);
        if (studentIndex !== -1) {
            window.studentsData[studentIndex].balance = newBalance;
            console.log('✅ Local student data updated');

            // Refresh the payments UI if the function exists
            if (typeof renderPaymentStudents === 'function') {
                renderPaymentStudents();
            }
        }
    } catch (error) {
        console.error('❌ Error updating student balance:', error);
    }
}

// Update student discount after DISCOUNT payment
// Note: Balance is already updated by updateStudentBalance() when the payment is saved.
// This function only updates the discount field to avoid double-counting.
async function updateStudentDiscount(studentFirestoreId, discountAmount) {
    if (!firebaseInitialized || !studentFirestoreId) return;

    try {
        // Get current student data
        const studentDoc = await db.collection('students').doc(studentFirestoreId).get();
        if (!studentDoc.exists) {
            console.error('Student not found:', studentFirestoreId);
            return;
        }

        const studentData = studentDoc.data();
        const currentDiscount = parseFloat(studentData.discount) || 0;
        const newDiscount = currentDiscount + parseFloat(discountAmount);

        // Update student with new discount only (balance already updated by updateStudentBalance)
        await db.collection('students').doc(studentFirestoreId).update({
            discount: newDiscount,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Student discount updated:', newDiscount);

        // Also update local data
        const studentIndex = window.studentsData.findIndex(s => s.firestoreId === studentFirestoreId);
        if (studentIndex !== -1) {
            window.studentsData[studentIndex].discount = newDiscount;

            // Refresh the payments UI if the function exists
            if (typeof renderPaymentStudents === 'function') {
                renderPaymentStudents();
            }
        }
    } catch (error) {
        console.error('❌ Error updating student discount:', error);
    }
}

// Load payments from Firestore
function loadPaymentsFromFirestore() {
    if (!firebaseInitialized) {
        console.log('Firebase not available, loading payments from localStorage');
        loadPaymentsFromLocalStorage();
        return;
    }

    // Real-time listener for payments collection
    db.collection('payments')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            window.paymentsData = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                // Convert Firestore timestamp to ISO string
                if (data.createdAt && data.createdAt.toDate) {
                    data.createdAt = data.createdAt.toDate().toISOString();
                }

                window.paymentsData.push({
                    firestoreId: doc.id,
                    ...data
                });
            });

            console.log(`✅ Loaded ${window.paymentsData.length} payments from Firestore`);

            // Update Payment History UI if the function exists
            if (typeof renderPaymentHistory === 'function') {
                renderPaymentHistory();
            }

            // Also save to localStorage as backup
            localStorage.setItem('paymentsData', JSON.stringify(window.paymentsData));
        }, (error) => {
            console.error('❌ Error loading payments from Firestore:', error);
            loadPaymentsFromLocalStorage();
        });
}

// LocalStorage fallback for payments
function savePaymentToLocalStorage(paymentData) {
    let payments = [];
    const savedData = localStorage.getItem('paymentsData');

    if (savedData) {
        payments = JSON.parse(savedData);
    }

    paymentData.createdAt = new Date().toISOString();
    payments.unshift(paymentData); // Add to beginning
    localStorage.setItem('paymentsData', JSON.stringify(payments));

    window.paymentsData = payments;

    // Update student balance in localStorage
    if (paymentData.studentFirestoreId) {
        const studentIndex = window.studentsData.findIndex(s =>
            s.firestoreId === paymentData.studentFirestoreId || s.id === paymentData.studentId
        );
        if (studentIndex !== -1) {
            const currentBalance = parseFloat(window.studentsData[studentIndex].balance) || 0;
            window.studentsData[studentIndex].balance = currentBalance + parseFloat(paymentData.amount);
            localStorage.setItem('studentsData', JSON.stringify(window.studentsData));
        }
    }

    if (typeof showNotification === 'function') {
        showNotification('Payment saved to local storage!', 'success');
    }

    if (typeof renderPaymentHistory === 'function') {
        renderPaymentHistory();
    }
    if (typeof renderPaymentStudents === 'function') {
        renderPaymentStudents();
    }
}

function loadPaymentsFromLocalStorage() {
    const savedData = localStorage.getItem('paymentsData');

    if (savedData) {
        window.paymentsData = JSON.parse(savedData);
        console.log(`📦 Loaded ${window.paymentsData.length} payments from localStorage`);
    } else {
        window.paymentsData = [];
    }

    if (typeof renderPaymentHistory === 'function') {
        renderPaymentHistory();
    }
}

// Update payment in Firestore
async function updatePaymentInFirestore(paymentFirestoreId, updatedData, originalAmount, studentFirestoreId) {
    if (!firebaseInitialized || !paymentFirestoreId) {
        console.log('Firebase not available or no ID provided');
        showNotification('Error: Unable to update payment', 'error');
        return;
    }

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        await db.collection('payments').doc(paymentFirestoreId).update(updatedData);

        console.log('✅ Payment updated successfully');

        // Update payment in local data and refresh UI
        const paymentIndex = window.paymentsData.findIndex(p => p.firestoreId === paymentFirestoreId);
        if (paymentIndex !== -1) {
            // Merge updated data with existing payment
            window.paymentsData[paymentIndex] = {
                ...window.paymentsData[paymentIndex],
                ...updatedData
            };
            console.log('✅ Payment updated in local data');
            if (typeof renderPaymentHistory === 'function') {
                renderPaymentHistory();
            }
        }

        // If payment is linked to a student and amount changed, adjust balance
        if (studentFirestoreId && updatedData.amount !== originalAmount) {
            const amountDifference = updatedData.amount - originalAmount;

            // Get current student balance and adjust
            const studentDoc = await db.collection('students').doc(studentFirestoreId).get();
            if (studentDoc.exists) {
                const currentBalance = parseFloat(studentDoc.data().balance) || 0;
                const newBalance = currentBalance + amountDifference;

                await db.collection('students').doc(studentFirestoreId).update({
                    balance: newBalance,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log('✅ Student balance adjusted by:', amountDifference);

                // Update local data and refresh UI
                const studentIndex = window.studentsData.findIndex(s => s.firestoreId === studentFirestoreId);
                if (studentIndex !== -1) {
                    window.studentsData[studentIndex].balance = newBalance;
                    if (typeof renderPaymentStudents === 'function') {
                        renderPaymentStudents();
                    }
                }
            }
        }

        if (typeof showNotification === 'function') {
            showNotification('Payment updated successfully!', 'success');
        }
    } catch (error) {
        console.error('❌ Error updating payment:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error updating payment: ' + error.message, 'error');
        }
    }
}

// Delete payment from Firestore
async function deletePaymentFromFirestore(paymentFirestoreId, amount, studentFirestoreId, isDiscount = false) {
    if (!firebaseInitialized || !paymentFirestoreId) {
        console.log('Firebase not available or no ID provided');
        showNotification('Error: Unable to delete payment', 'error');
        return;
    }

    try {
        // Capture the payment details before deleting in case the real-time listener clears it early
        const paymentIndex = window.paymentsData.findIndex(p => p.firestoreId === paymentFirestoreId);
        let deletedPayment = null;
        if (paymentIndex !== -1) {
            deletedPayment = window.paymentsData[paymentIndex];
        }

        await db.collection('payments').doc(paymentFirestoreId).delete();

        console.log('✅ Payment deleted successfully');

        // Remove payment from local data and refresh UI
        const newPaymentIndex = window.paymentsData.findIndex(p => p.firestoreId === paymentFirestoreId);
        if (newPaymentIndex !== -1) {
            window.paymentsData.splice(newPaymentIndex, 1);
            console.log('✅ Payment removed from local data');
            if (typeof renderPaymentHistory === 'function') {
                renderPaymentHistory();
            }
        }

        // If payment was linked to a student, reverse the balance change
        if (studentFirestoreId) {
            const studentDoc = await db.collection('students').doc(studentFirestoreId).get();
            if (studentDoc.exists) {
                const currentBalance = parseFloat(studentDoc.data().balance) || 0;
                const currentDiscount = parseFloat(studentDoc.data().discount) || 0;

                // Reverse the payment amount from balance
                const newBalance = currentBalance - parseFloat(amount);
                let newDiscount = currentDiscount;

                const updateData = {
                    balance: newBalance,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // If it was a discount payment, also reverse the discount
                if (isDiscount) {
                    newDiscount = currentDiscount - parseFloat(amount);
                    updateData.discount = newDiscount;
                    console.log('✅ Reversing discount:', updateData.discount);
                }

                await db.collection('students').doc(studentFirestoreId).update(updateData);

                console.log('✅ Student balance reversed:', newBalance);

                // Update local data and refresh UI
                const studentIndex = window.studentsData.findIndex(s => s.firestoreId === studentFirestoreId);
                if (studentIndex !== -1) {
                    window.studentsData[studentIndex].balance = newBalance;
                    if (isDiscount) {
                        window.studentsData[studentIndex].discount = newDiscount;
                    }
                    if (typeof renderPaymentStudents === 'function') {
                        renderPaymentStudents();
                    }
                }
            }
        }

        if (typeof showNotification === 'function') {
            showNotification('Payment deleted successfully!', 'success');
        }

        // Send Telegram Notification
        const safeName = deletedPayment && deletedPayment.studentName ? deletedPayment.studentName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Unknown';
        const strId = deletedPayment && deletedPayment.studentId ? deletedPayment.studentId : '-';
        let finalBalance = '-';
        if (studentFirestoreId) {
            const sIndex = window.studentsData.findIndex(s => s.firestoreId === studentFirestoreId);
            if (sIndex !== -1) {
                finalBalance = new Intl.NumberFormat('uz-UZ').format(window.studentsData[sIndex].balance) + ' UZS';
            }
        }
        const notifMsg = `🟥 <b>Payment Deleted</b>\n\n🆔 <b>ID:</b> ${strId}\n👤 <b>Student:</b> ${safeName}\n💰 <b>Amount:</b> -${new Intl.NumberFormat('uz-UZ').format(amount)} UZS\n💼 <b>Balance:</b> ${finalBalance}`;
        sendTelegramNotification(notifMsg);
    } catch (error) {
        console.error('❌ Error deleting payment:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error deleting payment: ' + error.message, 'error');
        }
    }
}

// ==========================================
// SETTINGS FIRESTORE FUNCTIONS
// Tariffs, Levels, Universities
// ==========================================

// Default data to seed Firestore if empty
const defaultTariffs = [{
    name: 'STANDART',
    price: 13000000
},
{
    name: 'PREMIUM',
    price: 32500000
},
{
    name: 'VISA PLUS',
    price: 65000000
},
{
    name: 'E-VISA',
    price: 2000000
},
{
    name: 'REGIONAL VISA',
    price: 2000000
}
];

const defaultLevels = [{
    name: 'COLLEGE'
},
{
    name: 'BACHELOR'
},
{
    name: 'MASTERS'
},
{
    name: 'MASTER NO CERTIFICATE'
},
{
    name: 'LANGUAGE COURSE'
}
];

function normalizeSettingName(name) {
    return (name || '').trim().toUpperCase();
}

function dedupeTariffsByNameAndPrice(items) {
    const unique = new Map();
    (items || []).forEach((item) => {
        const key = `${normalizeSettingName(item.name)}|${Number(item.price) || 0}`;
        if (!unique.has(key)) {
            unique.set(key, item);
        }
    });
    return Array.from(unique.values());
}

function dedupeLevelsByName(items) {
    const unique = new Map();
    (items || []).forEach((item) => {
        const key = normalizeSettingName(item.name);
        if (key && !unique.has(key)) {
            unique.set(key, item);
        }
    });
    return Array.from(unique.values());
}

function buildDeterministicDocId(prefix, rawValue) {
    const normalized = String(rawValue || '').trim().toLowerCase();
    const encoded = encodeURIComponent(normalized)
        .replace(/%/g, '')
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    const suffix = encoded || 'item';
    return `${prefix}_${suffix}`.slice(0, 120);
}

function normalizeVideoUrl(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url.trim());
        let host = parsed.hostname.toLowerCase();
        host = host.replace(/^www\./, '').replace(/^m\./, '');
        let youtubeId = '';

        if (host === 'youtu.be') {
            youtubeId = parsed.pathname.replace(/^\/+/, '').split('/')[0];
        } else if (host.includes('youtube.com')) {
            youtubeId = parsed.searchParams.get('v') || '';
            if (!youtubeId) {
                const parts = parsed.pathname.split('/').filter(Boolean);
                if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') {
                    youtubeId = parts[1] || '';
                }
            }
        }

        if (youtubeId) {
            return `https://youtube.com/watch?v=${youtubeId}`;
        }

        const path = parsed.pathname.replace(/\/+$/, '');
        return `https://${host}${path}`;
    } catch (e) {
        return String(url).trim();
    }
}

function dedupeVideosByUrl(items) {
    const unique = new Map();
    (items || []).forEach((item) => {
        const key = normalizeVideoUrl(item.url) || normalizeSettingName(item.name);
        if (key && !unique.has(key)) unique.set(key, item);
    });
    return Array.from(unique.values());
}

// ==========================================
// TARIFFS FIRESTORE FUNCTIONS
// ==========================================

async function saveTariffToFirestore(tariffData) {
    if (!firebaseInitialized) {
        console.log('Firebase not available');
        showNotification('Error: Firebase not available', 'error');
        return;
    }

    try {
        const normalizedName = normalizeSettingName(tariffData.name);
        const tariffId = buildDeterministicDocId('tariff', normalizedName);
        const existingTariffs = await db.collection('tariffs').get();
        const hasDuplicate = existingTariffs.docs.some((doc) => {
            const data = doc.data() || {};
            return normalizeSettingName(data.name) === normalizedName;
        });

        if (hasDuplicate) {
            console.warn('Tariff with this name already exists');
            showNotification(`Tariff "${tariffData.name}" already exists!`, 'error');
            return;
        }

        const payload = {
            ...tariffData,
            name: normalizedName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('tariffs').doc(tariffId).set(payload);
        console.log('Tariff saved with ID:', tariffId);
        showNotification('Tariff saved successfully!', 'success');
        await loadTariffsFromFirestore();
    } catch (error) {
        console.error('Error saving tariff:', error);
        showNotification('Error saving tariff: ' + error.message, 'error');
    }
}
async function loadTariffsFromFirestore() {
    if (!firebaseInitialized) {
        console.log('Firebase not available, using default tariffs');
        window.tariffsData = defaultTariffs.map((t, i) => ({
            ...t,
            firestoreId: 'local-' + i
        }));
        if (typeof renderTariffsList === 'function') renderTariffsList();
        if (typeof updateTariffDropdowns === 'function') updateTariffDropdowns();
        return;
    }

    try {
        const snapshot = await db.collection('tariffs').orderBy('name').get();
        window.tariffsData = [];

        // If empty, seed with default data
        if (snapshot.empty) {
            console.log('📦 Seeding tariffs collection with defaults...');
            for (const tariff of defaultTariffs) {
                const tariffName = normalizeSettingName(tariff.name);
                const tariffId = buildDeterministicDocId('tariff', tariffName);
                await db.collection('tariffs').doc(tariffId).set({
                    ...tariff,
                    name: tariffName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            // Reload after seeding
            return loadTariffsFromFirestore();
        }

        snapshot.forEach((doc) => {
            window.tariffsData.push({
                firestoreId: doc.id,
                ...doc.data()
            });
        });

        // Remove duplicates by content (name + price), not only by Firestore doc ID
        window.tariffsData = dedupeTariffsByNameAndPrice(window.tariffsData);

        console.log(`✅ Loaded ${window.tariffsData.length} tariffs from Firestore`);

        if (typeof renderTariffsList === 'function') renderTariffsList();
        if (typeof updateTariffDropdowns === 'function') updateTariffDropdowns();
    } catch (error) {
        console.error('❌ Error loading tariffs:', error);
    }
}

async function updateTariffInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        const normalizedName = normalizeSettingName(updatedData.name);
        const existingTariffs = await db.collection('tariffs').get();
        const hasDuplicate = existingTariffs.docs.some((doc) => {
            if (doc.id === firestoreId) return false;
            const data = doc.data() || {};
            return normalizeSettingName(data.name) === normalizedName;
        });

        if (hasDuplicate) {
            showNotification(`Tariff "${updatedData.name}" already exists!`, 'error');
            return;
        }

        updatedData.name = normalizedName;
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('tariffs').doc(firestoreId).update(updatedData);
        console.log('Tariff updated');
        showNotification('Tariff updated successfully!', 'success');
        await loadTariffsFromFirestore();
    } catch (error) {
        console.error('Error updating tariff:', error);
        showNotification('Error updating tariff: ' + error.message, 'error');
    }
}
async function deleteTariffFromFirestore(firestoreId) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        await db.collection('tariffs').doc(firestoreId).delete();
        console.log('✅ Tariff deleted');
        showNotification('Tariff deleted successfully!', 'success');
        await loadTariffsFromFirestore();
    } catch (error) {
        console.error('❌ Error deleting tariff:', error);
        showNotification('Error deleting tariff: ' + error.message, 'error');
    }
}

// ==========================================
// LEVELS FIRESTORE FUNCTIONS
// ==========================================

async function saveLevelToFirestore(levelData) {
    if (!firebaseInitialized) {
        console.log('Firebase not available');
        showNotification('Error: Firebase not available', 'error');
        return;
    }

    try {
        const normalizedName = normalizeSettingName(levelData.name);
        const levelId = buildDeterministicDocId('level', normalizedName);
        const existingLevels = await db.collection('levels').get();
        const hasDuplicate = existingLevels.docs.some((doc) => {
            const data = doc.data() || {};
            return normalizeSettingName(data.name) === normalizedName;
        });

        if (hasDuplicate) {
            console.warn('Education level with this name already exists');
            showNotification(`Education level "${levelData.name}" already exists!`, 'error');
            return;
        }

        const payload = {
            ...levelData,
            name: normalizedName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('levels').doc(levelId).set(payload);
        console.log('Level saved with ID:', levelId);
        showNotification('Education level saved successfully!', 'success');
        await loadLevelsFromFirestore();
    } catch (error) {
        console.error('Error saving level:', error);
        showNotification('Error saving level: ' + error.message, 'error');
    }
}
async function loadLevelsFromFirestore() {
    if (!firebaseInitialized) {
        console.log('Firebase not available, using default levels');
        window.levelsData = defaultLevels.map((l, i) => ({
            ...l,
            firestoreId: 'local-' + i
        }));
        if (typeof renderLevelsList === 'function') renderLevelsList();
        if (typeof updateLevelDropdowns === 'function') updateLevelDropdowns();
        return;
    }

    try {
        const snapshot = await db.collection('levels').orderBy('name').get();
        window.levelsData = [];

        // If empty, seed with default data
        if (snapshot.empty) {
            console.log('📦 Seeding levels collection with defaults...');
            for (const level of defaultLevels) {
                const levelName = normalizeSettingName(level.name);
                const levelId = buildDeterministicDocId('level', levelName);
                await db.collection('levels').doc(levelId).set({
                    ...level,
                    name: levelName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            // Reload after seeding
            return loadLevelsFromFirestore();
        }

        snapshot.forEach((doc) => {
            window.levelsData.push({
                firestoreId: doc.id,
                ...doc.data()
            });
        });

        // Remove duplicates by level name, not only by Firestore doc ID
        window.levelsData = dedupeLevelsByName(window.levelsData);

        console.log(`✅ Loaded ${window.levelsData.length} levels from Firestore`);

        if (typeof renderLevelsList === 'function') renderLevelsList();
        if (typeof updateLevelDropdowns === 'function') updateLevelDropdowns();
    } catch (error) {
        console.error('❌ Error loading levels:', error);
    }
}

async function updateLevelInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        const normalizedName = normalizeSettingName(updatedData.name);
        const existingLevels = await db.collection('levels').get();
        const hasDuplicate = existingLevels.docs.some((doc) => {
            if (doc.id === firestoreId) return false;
            const data = doc.data() || {};
            return normalizeSettingName(data.name) === normalizedName;
        });

        if (hasDuplicate) {
            showNotification(`Education level "${updatedData.name}" already exists!`, 'error');
            return;
        }

        updatedData.name = normalizedName;
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('levels').doc(firestoreId).update(updatedData);
        console.log('Level updated');
        showNotification('Education level updated successfully!', 'success');
        await loadLevelsFromFirestore();
    } catch (error) {
        console.error('Error updating level:', error);
        showNotification('Error updating level: ' + error.message, 'error');
    }
}
async function deleteLevelFromFirestore(firestoreId) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        // Also delete universities linked to this level
        const level = window.levelsData.find(l => l.firestoreId === firestoreId);
        if (level) {
            const linkedUnis = await db.collection('universities')
                .where('levelId', '==', firestoreId)
                .get();

            const batch = db.batch();
            linkedUnis.forEach(doc => batch.delete(doc.ref));
            batch.delete(db.collection('levels').doc(firestoreId));
            await batch.commit();

            console.log(`✅ Level deleted with ${linkedUnis.size} linked universities`);
        } else {
            await db.collection('levels').doc(firestoreId).delete();
        }

        showNotification('Education level deleted successfully!', 'success');
        await loadLevelsFromFirestore();
        await loadUniversitiesFromFirestore();
    } catch (error) {
        console.error('❌ Error deleting level:', error);
        showNotification('Error deleting level: ' + error.message, 'error');
    }
}

// ==========================================
// UNIVERSITIES FIRESTORE FUNCTIONS
// ==========================================

async function saveUniversityToFirestore(universityData) {
    if (!firebaseInitialized) {
        console.log('Firebase not available');
        showNotification('Error: Firebase not available', 'error');
        return;
    }

    try {
        // ✨ DUPLICATE PREVENTION: Check if university with same name and level already exists
        const existingUniversities = await db.collection('universities')
            .where('name', '==', universityData.name)
            .where('levelId', '==', universityData.levelId)
            .get();

        if (!existingUniversities.empty) {
            console.warn('⚠️ University with this name and level already exists');
            showNotification(`University "${universityData.name}" already exists for this education level!`, 'error');
            return;
        }

        universityData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = await db.collection('universities').add(universityData);
        console.log('✅ University saved with ID:', docRef.id);
        showNotification('University saved successfully!', 'success');
        await loadUniversitiesFromFirestore();
    } catch (error) {
        console.error('❌ Error saving university:', error);
        showNotification('Error saving university: ' + error.message, 'error');
    }
}

async function loadUniversitiesFromFirestore() {
    if (!firebaseInitialized) {
        console.log('Firebase not available, using empty universities');
        window.universitiesData = [];
        if (typeof renderUniversitiesList === 'function') renderUniversitiesList();
        return;
    }

    try {
        // Don't use orderBy so we can load ALL documents including those with missing levelName
        const snapshot = await db.collection('universities').get();
        window.universitiesData = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            window.universitiesData.push({
                firestoreId: doc.id,
                name: data.name || '',
                levelId: data.levelId || '',
                // Support both 'levelName' and 'level' field names for backwards compatibility
                levelName: data.levelName || data.level || 'Unknown Level',
                ...data
            });
        });

        // Remove duplicates by firestoreId
        window.universitiesData = Array.from(new Map(window.universitiesData.map(u => [u.firestoreId, u])).values());

        // Sort by levelName client-side
        window.universitiesData.sort((a, b) => (a.levelName || '').localeCompare(b.levelName || ''));

        console.log(`✅ Loaded ${window.universitiesData.length} universities from Firestore`);

        if (typeof renderUniversitiesList === 'function') renderUniversitiesList();

        // Refresh university dropdowns if a level is already selected
        const levelSelect = document.getElementById('levelSelect');
        if (levelSelect && levelSelect.value && typeof updateUniversityDropdowns === 'function') {
            updateUniversityDropdowns(levelSelect.value);
        }
    } catch (error) {
        console.error('❌ Error loading universities:', error);
    }
}

async function updateUniversityInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('universities').doc(firestoreId).update(updatedData);
        console.log('✅ University updated');
        showNotification('University updated successfully!', 'success');
        await loadUniversitiesFromFirestore();
    } catch (error) {
        console.error('❌ Error updating university:', error);
        showNotification('Error updating university: ' + error.message, 'error');
    }
}

async function deleteUniversityFromFirestore(firestoreId) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        await db.collection('universities').doc(firestoreId).delete();
        console.log('✅ University deleted');
        showNotification('University deleted successfully!', 'success');
        await loadUniversitiesFromFirestore();
    } catch (error) {
        console.error('❌ Error deleting university:', error);
        showNotification('Error deleting university: ' + error.message, 'error');
    }
}

// ==========================================
// GROUPS FIRESTORE FUNCTIONS
// ==========================================

async function saveGroupToFirestore(groupData) {
    if (!firebaseInitialized) {
        console.log('Firebase not available');
        showNotification('Error: Firebase not available', 'error');
        return;
    }

    try {
        // ✨ DUPLICATE PREVENTION: Check if group with same name already exists
        const existingGroups = await db.collection('groups')
            .where('name', '==', groupData.name)
            .get();

        if (!existingGroups.empty) {
            console.warn('⚠️ Group with this name already exists');
            showNotification(`Group "${groupData.name}" already exists!`, 'error');
            return;
        }

        groupData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = await db.collection('groups').add(groupData);
        console.log('✅ Group saved with ID:', docRef.id);
        showNotification('Group saved successfully!', 'success');
        await loadGroupsFromFirestore();
    } catch (error) {
        console.error('❌ Error saving group:', error);
        showNotification('Error saving group: ' + error.message, 'error');
    }
}

async function loadGroupsFromFirestore() {
    if (!firebaseInitialized) {
        console.log('Firebase not available, using empty groups');
        window.groupsData = [];
        if (typeof renderGroupsList === 'function') renderGroupsList();
        if (typeof updateGroupDropdowns === 'function') updateGroupDropdowns();
        return;
    }

    try {
        const snapshot = await db.collection('groups').orderBy('name').get();
        window.groupsData = [];

        snapshot.forEach((doc) => {
            window.groupsData.push({
                firestoreId: doc.id,
                ...doc.data()
            });
        });

        // Remove duplicates by firestoreId
        window.groupsData = Array.from(new Map(window.groupsData.map(g => [g.firestoreId, g])).values());

        console.log(`✅ Loaded ${window.groupsData.length} groups from Firestore`);

        if (typeof renderGroupsList === 'function') renderGroupsList();
        if (typeof updateGroupDropdowns === 'function') updateGroupDropdowns();
    } catch (error) {
        console.error('❌ Error loading groups:', error);
    }
}

async function updateGroupInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('groups').doc(firestoreId).update(updatedData);
        console.log('✅ Group updated');
        showNotification('Group updated successfully!', 'success');
        await loadGroupsFromFirestore();
    } catch (error) {
        console.error('❌ Error updating group:', error);
        showNotification('Error updating group: ' + error.message, 'error');
    }
}

async function deleteGroupFromFirestore(firestoreId) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        await db.collection('groups').doc(firestoreId).delete();
        console.log('✅ Group deleted');
        showNotification('Group deleted successfully!', 'success');
        await loadGroupsFromFirestore();
    } catch (error) {
        console.error('❌ Error deleting group:', error);
        showNotification('Error deleting group: ' + error.message, 'error');
    }
}

// ==========================================
// INITIALIZE ALL DATA ON PAGE LOAD
// ==========================================

let settingsDataLoaded = false;

document.addEventListener('DOMContentLoaded', function () {
    if (firebaseInitialized) {
        console.log('🔄 Loading all data from Firestore...');

        // Load students and payments
        loadStudentsFromFirestore();
        loadPaymentsFromFirestore();

        // Load admissions and notifications
        loadAdmissionsFromFirestore();
        loadNotificationsFromFirestore();

        // Load settings data (only once)
        if (!settingsDataLoaded) {
            settingsDataLoaded = true;
            loadTariffsFromFirestore();
            loadLevelsFromFirestore();
            loadUniversitiesFromFirestore();
            loadGroupsFromFirestore();
            loadVideosFromFirestore();
        }
    } else {
        console.log('📦 Using localStorage mode');
        loadFromLocalStorage();
        loadPaymentsFromLocalStorage();
        loadAdmissionsFromLocalStorage();
        loadNotificationsFromLocalStorage();
    }

    // Setup filter event listeners for Students tab
    const searchInput = document.getElementById('searchInput');
    const filterTariff = document.getElementById('filterTariff');
    const filterLevel = document.getElementById('filterLevel');
    const filterGroup = document.getElementById('filterGroup');

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        });
    }

    if (filterTariff) {
        filterTariff.addEventListener('change', function () {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        });
    }

    if (filterLevel) {
        filterLevel.addEventListener('change', function () {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        });
    }

    if (filterGroup) {
        filterGroup.addEventListener('change', function () {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        });
    }
});

// Export functions for global use
window.saveStudentToFirestore = saveStudentToFirestore;
window.loadStudentsFromFirestore = loadStudentsFromFirestore;
window.deleteStudentFromFirestore = deleteStudentFromFirestore;
window.updateStudentInFirestore = updateStudentInFirestore;
window.savePaymentToFirestore = savePaymentToFirestore;
window.loadPaymentsFromFirestore = loadPaymentsFromFirestore;
window.updateStudentDiscount = updateStudentDiscount;
window.updatePaymentInFirestore = updatePaymentInFirestore;
window.deletePaymentFromFirestore = deletePaymentFromFirestore;
window.firebaseInitialized = firebaseInitialized;

// Settings exports
window.saveTariffToFirestore = saveTariffToFirestore;
window.loadTariffsFromFirestore = loadTariffsFromFirestore;
window.updateTariffInFirestore = updateTariffInFirestore;
window.deleteTariffFromFirestore = deleteTariffFromFirestore;
window.saveLevelToFirestore = saveLevelToFirestore;
window.loadLevelsFromFirestore = loadLevelsFromFirestore;
window.updateLevelInFirestore = updateLevelInFirestore;
window.deleteLevelFromFirestore = deleteLevelFromFirestore;
window.saveUniversityToFirestore = saveUniversityToFirestore;
window.loadUniversitiesFromFirestore = loadUniversitiesFromFirestore;
window.updateUniversityInFirestore = updateUniversityInFirestore;
window.deleteUniversityFromFirestore = deleteUniversityFromFirestore;
window.saveGroupToFirestore = saveGroupToFirestore;
window.loadGroupsFromFirestore = loadGroupsFromFirestore;
window.updateGroupInFirestore = updateGroupInFirestore;
window.deleteGroupFromFirestore = deleteGroupFromFirestore;

// ==========================================
// ADMISSIONS FIRESTORE FUNCTIONS
// ==========================================

async function saveAdmissionToFirestore(admissionData) {
    if (!firebaseInitialized) {
        console.log('Firebase not available, saving admission to localStorage');
        saveAdmissionToLocalStorage(admissionData);
        return;
    }

    try {
        admissionData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        admissionData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        const docRef = await db.collection('admissions').add(admissionData);
        console.log('✅ Admission saved to Firestore with ID:', docRef.id);

        if (typeof showNotification === 'function') {
            showNotification('Admission saved successfully!', 'success');
        }

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addAdmissionModal'));
        if (modal) {
            modal.hide();
        }
        document.getElementById('addAdmissionForm').reset();
        document.getElementById('admissionEditId').value = '';
        document.getElementById('admissionModalTitle').textContent = 'Add Admission Record';

        // Reload admissions
        loadAdmissionsFromFirestore();
    } catch (error) {
        console.error('❌ Error saving admission to Firestore:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error saving admission: ' + error.message, 'error');
        }
        saveAdmissionToLocalStorage(admissionData);
    }
}

function loadAdmissionsFromFirestore() {
    if (!firebaseInitialized) {
        console.log('Firebase not available, loading admissions from localStorage');
        loadAdmissionsFromLocalStorage();
        return;
    }

    db.collection('admissions')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            window.admissionsData = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.createdAt && data.createdAt.toDate) {
                    data.createdAt = data.createdAt.toDate().toISOString();
                }
                if (data.updatedAt && data.updatedAt.toDate) {
                    data.updatedAt = data.updatedAt.toDate().toISOString();
                }

                window.admissionsData.push({
                    firestoreId: doc.id,
                    ...data
                });
            });

            console.log(`✅ Loaded ${window.admissionsData.length} admissions from Firestore`);

            if (typeof renderAdmissions === 'function') {
                renderAdmissions();
            }

            localStorage.setItem('admissionsData', JSON.stringify(window.admissionsData));
        }, (error) => {
            console.error('❌ Error loading admissions from Firestore:', error);
            loadAdmissionsFromLocalStorage();
        });
}

async function updateAdmissionInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) {
        console.log('Firebase not available or no ID provided');
        return;
    }

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('admissions').doc(firestoreId).update(updatedData);
        console.log('✅ Admission updated successfully');

        if (typeof showNotification === 'function') {
            showNotification('Admission updated successfully!', 'success');
        }
    } catch (error) {
        console.error('❌ Error updating admission:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error updating admission: ' + error.message, 'error');
        }
    }
}

async function deleteAdmissionFromFirestore(firestoreId) {
    if (!firebaseInitialized || !firestoreId) {
        console.log('Firebase not available or no ID provided');
        return;
    }

    try {
        await db.collection('admissions').doc(firestoreId).delete();
        console.log('✅ Admission deleted successfully');

        if (typeof showNotification === 'function') {
            showNotification('Admission deleted successfully!', 'success');
        }
    } catch (error) {
        console.error('❌ Error deleting admission:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error deleting admission: ' + error.message, 'error');
        }
    }
}

function saveAdmissionToLocalStorage(admissionData) {
    let admissions = [];
    const savedData = localStorage.getItem('admissionsData');

    if (savedData) {
        admissions = JSON.parse(savedData);
    }

    admissionData.createdAt = new Date().toISOString();
    admissions.unshift(admissionData);
    localStorage.setItem('admissionsData', JSON.stringify(admissions));

    window.admissionsData = admissions;

    if (typeof showNotification === 'function') {
        showNotification('Admission saved to local storage!', 'success');
    }

    if (typeof renderAdmissions === 'function') {
        renderAdmissions();
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('addAdmissionModal'));
    if (modal) {
        modal.hide();
    }
    document.getElementById('addAdmissionForm').reset();
}

function loadAdmissionsFromLocalStorage() {
    const savedData = localStorage.getItem('admissionsData');

    if (savedData) {
        window.admissionsData = JSON.parse(savedData);
        console.log(`📦 Loaded ${window.admissionsData.length} admissions from localStorage`);
    } else {
        window.admissionsData = [];
    }

    if (typeof renderAdmissions === 'function') {
        renderAdmissions();
    }
}

// ==========================================
// NOTIFICATIONS FIRESTORE FUNCTIONS
// ==========================================

async function saveNotificationToFirestore(notificationData) {
    if (!firebaseInitialized) {
        console.log('Firebase not available, saving notification to localStorage');
        saveNotificationToLocalStorage(notificationData);
        return;
    }

    try {
        notificationData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        notificationData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        const docRef = await db.collection('notifications').add(notificationData);
        console.log('✅ Notification saved to Firestore with ID:', docRef.id);

        if (typeof showNotification === 'function') {
            showNotification('Notification saved successfully!', 'success');
        }

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addNotificationModal'));
        if (modal) {
            modal.hide();
        }
        document.getElementById('addNotificationForm').reset();
        document.getElementById('notificationEditId').value = '';
        document.getElementById('notificationModalTitle').textContent = 'Add Notification';

        // Reload notifications
        loadNotificationsFromFirestore();
    } catch (error) {
        console.error('❌ Error saving notification to Firestore:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error saving notification: ' + error.message, 'error');
        }
        saveNotificationToLocalStorage(notificationData);
    }
}

function loadNotificationsFromFirestore() {
    if (!firebaseInitialized) {
        console.log('Firebase not available, loading notifications from localStorage');
        loadNotificationsFromLocalStorage();
        return;
    }

    db.collection('notifications')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            window.notificationsData = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.createdAt && data.createdAt.toDate) {
                    data.createdAt = data.createdAt.toDate().toISOString();
                }
                if (data.updatedAt && data.updatedAt.toDate) {
                    data.updatedAt = data.updatedAt.toDate().toISOString();
                }

                window.notificationsData.push({
                    firestoreId: doc.id,
                    ...data
                });
            });

            console.log(`✅ Loaded ${window.notificationsData.length} notifications from Firestore`);

            if (typeof renderNotifications === 'function') {
                renderNotifications();
            }

            localStorage.setItem('notificationsData', JSON.stringify(window.notificationsData));
        }, (error) => {
            console.error('❌ Error loading notifications from Firestore:', error);
            loadNotificationsFromLocalStorage();
        });
}

async function updateNotificationInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) {
        console.log('Firebase not available or no ID provided');
        return;
    }

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('notifications').doc(firestoreId).update(updatedData);
        console.log('✅ Notification updated successfully');

        if (typeof showNotification === 'function') {
            showNotification('Notification updated successfully!', 'success');
        }
    } catch (error) {
        console.error('❌ Error updating notification:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error updating notification: ' + error.message, 'error');
        }
    }
}

async function deleteNotificationFromFirestore(firestoreId) {
    if (!firebaseInitialized || !firestoreId) {
        console.log('Firebase not available or no ID provided');
        return;
    }

    try {
        await db.collection('notifications').doc(firestoreId).delete();
        console.log('✅ Notification deleted successfully');

        if (typeof showNotification === 'function') {
            showNotification('Notification deleted successfully!', 'success');
        }
    } catch (error) {
        console.error('❌ Error deleting notification:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error deleting notification: ' + error.message, 'error');
        }
    }
}

function saveNotificationToLocalStorage(notificationData) {
    let notifications = [];
    const savedData = localStorage.getItem('notificationsData');

    if (savedData) {
        notifications = JSON.parse(savedData);
    }

    notificationData.createdAt = new Date().toISOString();
    notifications.unshift(notificationData);
    localStorage.setItem('notificationsData', JSON.stringify(notifications));

    window.notificationsData = notifications;

    if (typeof showNotification === 'function') {
        showNotification('Notification saved to local storage!', 'success');
    }

    if (typeof renderNotifications === 'function') {
        renderNotifications();
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('addNotificationModal'));
    if (modal) {
        modal.hide();
    }
    document.getElementById('addNotificationForm').reset();
}

function loadNotificationsFromLocalStorage() {
    const savedData = localStorage.getItem('notificationsData');

    if (savedData) {
        window.notificationsData = JSON.parse(savedData);
        console.log(`📦 Loaded ${window.notificationsData.length} notifications from localStorage`);
    } else {
        window.notificationsData = [];
    }

    if (typeof renderNotifications === 'function') {
        renderNotifications();
    }
}

// Export admissions functions
window.saveAdmissionToFirestore = saveAdmissionToFirestore;
window.loadAdmissionsFromFirestore = loadAdmissionsFromFirestore;
window.updateAdmissionInFirestore = updateAdmissionInFirestore;
window.deleteAdmissionFromFirestore = deleteAdmissionFromFirestore;

// Export notifications functions
window.saveNotificationToFirestore = saveNotificationToFirestore;
window.loadNotificationsFromFirestore = loadNotificationsFromFirestore;
window.updateNotificationInFirestore = updateNotificationInFirestore;
window.deleteNotificationFromFirestore = deleteNotificationFromFirestore;

// ==========================================
// VIDEOS FIRESTORE FUNCTIONS
// ==========================================

// Default videos to seed Firestore if empty
const defaultVideos = [{
    name: "NIKOH HOLATI MA'LUMOTNOMASINI OLISH",
    url: "https://youtube.com/shorts/yjl4f1BVgEE?si=Vexz6TbX_aXiVfsA"
},
{
    name: "OTA-ONA DAROMADINI MA'LUMOTNOMASINI OLISH",
    url: "https://youtu.be/ViKiiLUPq1g?si=ge0ZEZmTYGDSgD0W"
}
];

async function saveVideoToFirestore(videoData) {
    if (!firebaseInitialized) {
        console.log('Firebase not available');
        showNotification('Error: Firebase not available', 'error');
        return;
    }

    try {
        const normalizedUrl = normalizeVideoUrl(videoData.url);
        const normalizedName = (videoData.name || '').trim();
        const videoId = buildDeterministicDocId('video', normalizedUrl || normalizedName);

        const existingVideos = await db.collection('videos').get();
        const hasDuplicate = existingVideos.docs.some((doc) => {
            const data = doc.data() || {};
            return normalizeVideoUrl(data.url) === normalizedUrl && normalizedUrl;
        });

        if (hasDuplicate) {
            console.warn('Video with this link already exists');
            showNotification('This video link already exists!', 'error');
            return;
        }

        const payload = {
            ...videoData,
            name: normalizedName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('videos').doc(videoId).set(payload);
        console.log('Video saved with ID:', videoId);
        showNotification('Video saved successfully!', 'success');
        await loadVideosFromFirestore();
    } catch (error) {
        console.error('Error saving video:', error);
        showNotification('Error saving video: ' + error.message, 'error');
    }
}
async function loadVideosFromFirestore() {
    if (!firebaseInitialized) {
        console.log('Firebase not available, using default videos');
        window.videosData = defaultVideos.map((v, i) => ({
            ...v,
            firestoreId: 'local-' + i
        }));
        if (typeof renderVideosList === 'function') renderVideosList();
        return;
    }

    try {
        // Do not query with orderBy(createdAt): docs missing createdAt can be excluded and falsely trigger reseeding.
        const snapshot = await db.collection('videos').get();
        window.videosData = [];

        // If empty, seed with default data
        if (snapshot.empty) {
            console.log('📦 Seeding videos collection with defaults...');
            for (const video of defaultVideos) {
                const videoId = buildDeterministicDocId('video', normalizeVideoUrl(video.url) || video.name);
                await db.collection('videos').doc(videoId).set({
                    ...video,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            // Reload after seeding
            return loadVideosFromFirestore();
        }

        snapshot.forEach((doc) => {
            window.videosData.push({
                firestoreId: doc.id,
                ...doc.data()
            });
        });

        // Remove duplicates by normalized URL (or name fallback)
        window.videosData = dedupeVideosByUrl(window.videosData);
        window.videosData.sort((a, b) => {
            const aSec = a.createdAt && typeof a.createdAt.seconds === 'number' ? a.createdAt.seconds : 0;
            const bSec = b.createdAt && typeof b.createdAt.seconds === 'number' ? b.createdAt.seconds : 0;
            return aSec - bSec;
        });

        console.log(`✅ Loaded ${window.videosData.length} videos from Firestore`);

        if (typeof renderVideosList === 'function') renderVideosList();
    } catch (error) {
        console.error('❌ Error loading videos:', error);
    }
}

async function updateVideoInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        const normalizedUrl = normalizeVideoUrl(updatedData.url);
        const existingVideos = await db.collection('videos').get();
        const hasDuplicate = existingVideos.docs.some((doc) => {
            if (doc.id === firestoreId) return false;
            const data = doc.data() || {};
            return normalizeVideoUrl(data.url) === normalizedUrl && normalizedUrl;
        });

        if (hasDuplicate) {
            showNotification('This video link already exists!', 'error');
            return;
        }

        updatedData.name = updatedData.name ? updatedData.name.trim() : '';
        updatedData.url = updatedData.url ? updatedData.url.trim() : '';
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('videos').doc(firestoreId).update(updatedData);
        console.log('Video updated');
        showNotification('Video updated successfully!', 'success');
        await loadVideosFromFirestore();
    } catch (error) {
        console.error('Error updating video:', error);
        showNotification('Error updating video: ' + error.message, 'error');
    }
}
async function deleteVideoFromFirestore(firestoreId) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        await db.collection('videos').doc(firestoreId).delete();
        console.log('✅ Video deleted');
        showNotification('Video deleted successfully!', 'success');
        await loadVideosFromFirestore();
    } catch (error) {
        console.error('❌ Error deleting video:', error);
        showNotification('Error deleting video: ' + error.message, 'error');
    }
}

// Export videos functions
window.saveVideoToFirestore = saveVideoToFirestore;
window.loadVideosFromFirestore = loadVideosFromFirestore;
window.updateVideoInFirestore = updateVideoInFirestore;
window.deleteVideoFromFirestore = deleteVideoFromFirestore;



