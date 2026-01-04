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
// SAVE STUDENT TO FIRESTORE
// ==========================================

async function saveStudentToFirestore(studentData) {
    if (!firebaseInitialized) {
        console.log('Firebase not available, saving to localStorage');
        saveToLocalStorage(studentData);
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
    }
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
        await db.collection('payments').doc(paymentFirestoreId).delete();

        console.log('✅ Payment deleted successfully');

        // Remove payment from local data and refresh UI
        const paymentIndex = window.paymentsData.findIndex(p => p.firestoreId === paymentFirestoreId);
        if (paymentIndex !== -1) {
            window.paymentsData.splice(paymentIndex, 1);
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
        tariffData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = await db.collection('tariffs').add(tariffData);
        console.log('✅ Tariff saved with ID:', docRef.id);
        showNotification('Tariff saved successfully!', 'success');
    } catch (error) {
        console.error('❌ Error saving tariff:', error);
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

    db.collection('tariffs')
        .orderBy('name')
        .onSnapshot(async (snapshot) => {
            window.tariffsData = [];

            // If empty, seed with default data
            if (snapshot.empty) {
                console.log('📦 Seeding tariffs collection with defaults...');
                for (const tariff of defaultTariffs) {
                    await db.collection('tariffs').add({
                        ...tariff,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                return; // onSnapshot will fire again after seeding
            }

            snapshot.forEach((doc) => {
                window.tariffsData.push({
                    firestoreId: doc.id,
                    ...doc.data()
                });
            });

            // Remove duplicates by firestoreId
            window.tariffsData = Array.from(new Map(window.tariffsData.map(t => [t.firestoreId, t])).values());

            console.log(`✅ Loaded ${window.tariffsData.length} tariffs from Firestore`);

            if (typeof renderTariffsList === 'function') renderTariffsList();
            if (typeof updateTariffDropdowns === 'function') updateTariffDropdowns();
        }, (error) => {
            console.error('❌ Error loading tariffs:', error);
        });
}

async function updateTariffInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('tariffs').doc(firestoreId).update(updatedData);
        console.log('✅ Tariff updated');
        showNotification('Tariff updated successfully!', 'success');
    } catch (error) {
        console.error('❌ Error updating tariff:', error);
        showNotification('Error updating tariff: ' + error.message, 'error');
    }
}

async function deleteTariffFromFirestore(firestoreId) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        await db.collection('tariffs').doc(firestoreId).delete();
        console.log('✅ Tariff deleted');
        showNotification('Tariff deleted successfully!', 'success');
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
        levelData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = await db.collection('levels').add(levelData);
        console.log('✅ Level saved with ID:', docRef.id);
        showNotification('Education level saved successfully!', 'success');
    } catch (error) {
        console.error('❌ Error saving level:', error);
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

    db.collection('levels')
        .orderBy('name')
        .onSnapshot(async (snapshot) => {
            window.levelsData = [];

            // If empty, seed with default data
            if (snapshot.empty) {
                console.log('📦 Seeding levels collection with defaults...');
                for (const level of defaultLevels) {
                    await db.collection('levels').add({
                        ...level,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                return;
            }

            snapshot.forEach((doc) => {
                window.levelsData.push({
                    firestoreId: doc.id,
                    ...doc.data()
                });
            });

            // Remove duplicates by firestoreId
            window.levelsData = Array.from(new Map(window.levelsData.map(l => [l.firestoreId, l])).values());

            console.log(`✅ Loaded ${window.levelsData.length} levels from Firestore`);

            if (typeof renderLevelsList === 'function') renderLevelsList();
            if (typeof updateLevelDropdowns === 'function') updateLevelDropdowns();
        }, (error) => {
            console.error('❌ Error loading levels:', error);
        });
}

async function updateLevelInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('levels').doc(firestoreId).update(updatedData);
        console.log('✅ Level updated');
        showNotification('Education level updated successfully!', 'success');
    } catch (error) {
        console.error('❌ Error updating level:', error);
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
        universityData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = await db.collection('universities').add(universityData);
        console.log('✅ University saved with ID:', docRef.id);
        showNotification('University saved successfully!', 'success');
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

    db.collection('universities')
        .orderBy('levelName')
        .onSnapshot((snapshot) => {
            window.universitiesData = [];

            snapshot.forEach((doc) => {
                window.universitiesData.push({
                    firestoreId: doc.id,
                    ...doc.data()
                });
            });

            // Remove duplicates by firestoreId
            window.universitiesData = Array.from(new Map(window.universitiesData.map(u => [u.firestoreId, u])).values());

            console.log(`✅ Loaded ${window.universitiesData.length} universities from Firestore`);

            if (typeof renderUniversitiesList === 'function') renderUniversitiesList();

            // Refresh university dropdowns if a level is already selected
            const levelSelect = document.getElementById('levelSelect');
            if (levelSelect && levelSelect.value && typeof updateUniversityDropdowns === 'function') {
                updateUniversityDropdowns(levelSelect.value);
            }
        }, (error) => {
            console.error('❌ Error loading universities:', error);
        });
}

async function updateUniversityInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('universities').doc(firestoreId).update(updatedData);
        console.log('✅ University updated');
        showNotification('University updated successfully!', 'success');
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
        groupData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = await db.collection('groups').add(groupData);
        console.log('✅ Group saved with ID:', docRef.id);
        showNotification('Group saved successfully!', 'success');
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

    db.collection('groups')
        .orderBy('name')
        .onSnapshot((snapshot) => {
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
        }, (error) => {
            console.error('❌ Error loading groups:', error);
        });
}

async function updateGroupInFirestore(firestoreId, updatedData) {
    if (!firebaseInitialized || !firestoreId) return;

    try {
        updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('groups').doc(firestoreId).update(updatedData);
        console.log('✅ Group updated');
        showNotification('Group updated successfully!', 'success');
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