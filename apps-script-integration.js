// apps-script-integration.js

// IMPORTANT: Replace 'YOUR_APPS_SCRIPT_WEB_APP_URL' with the actual URL of your deployed Google Apps Script Web App.
const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6ZvR_vT75odpZTN2PoqW6ZkjUdq63CV5qCb4Fpk7ZLlBkrZr7soLb8ysF8sZSYpKDyg/exec';

window.appsScriptGoogleSheets = {
    writeRegistrationData: function(studentData) {
        return new Promise((resolve, reject) => {
            if (APPS_SCRIPT_WEB_APP_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
                const message = "Apps Script Web App URL is not configured in apps-script-integration.js. Skipping Google Sheets.";
                console.warn(message);
                resolve({ status: 'skipped', message: message });
                return;
            }

            // Prepare the data in the format expected by the working Google Apps Script
            // Send as a flat JSON object with the field names as keys
            const formData = {
                'student-id': studentData.studentId || '',
                'full-name': studentData.fullname || '',
                'phone1': studentData.phone1 || '',
                'phone2': studentData.phone2 || '',
                'email': studentData.email || ''
            };

            // Prepare COMPLETE Telegram data for student registration with ALL fields
            const telegramData = {
                studentId: studentData.studentId || '',
                fullName: studentData.fullname || '',
                email: studentData.email || '',
                phone1: studentData.phone1 || '',
                phone2: studentData.phone2 || '',
                educationLevel: studentData.educationLevel || '',
                university1: studentData.university1 || '',
                university2: studentData.university2 || '',
                tariff: studentData.tariff || '',
                languageCertificate: studentData.languageCertificate || '',
                hearAboutUs: studentData.hearAboutUs || '',
                // Additional fields that might be useful
                passportNumber: studentData.passportNumber || '',
                birthDate: studentData.birthDate || '',
                address: studentData.address || '',
                additionalNotes: studentData.additionalNotes || ''
            };

            // Add Telegram data to the form
            formData['telegram-data'] = JSON.stringify(telegramData);

            // Use URLSearchParams to send as form data instead of JSON to avoid preflight
            const params = new URLSearchParams();
            Object.keys(formData).forEach(key => {
                params.append(key, formData[key]);
            });

            fetch(APPS_SCRIPT_WEB_APP_URL, {
                method: 'POST',
                body: params
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Network response was not ok (${response.status}): ${text}`);
                    });
                }
                return response.json();
            })
            .then(result => {
                if (result && result.status === 'success') {
                    console.log('Google Sheets API success:', result.message);
                    resolve(result);
                } else {
                    const errorMessage = result && result.message ? result.message : 'Unknown error from Google Apps Script';
                    console.error('Google Sheets API error:', errorMessage);
                    reject(new Error(errorMessage));
                }
            })
            .catch(error => {
                console.error('Error calling Google Apps Script:', error);
                reject(error);
            });
        });
    },

    writePaymentData: function(studentId, fullName, paymentData) {
        return new Promise((resolve, reject) => {
            if (APPS_SCRIPT_WEB_APP_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
                const message = "Apps Script Web App URL is not configured in apps-script-integration.js. Skipping Google Sheets.";
                console.warn(message);
                resolve({ status: 'skipped', message: message });
                return;
            }

            // Prepare the payment data for the Payments sheet
            // Format: Timestamp, ID, FULL NAME, Amount, Payment method, Received by
            const formData = {
                'action': 'addPayment',
                'timestamp': new Date().toISOString(),
                'student-id': studentId || '',
                'full-name': fullName || '',
                'amount': paymentData.amount || 0,
                'payment-method': paymentData.paymentMethod || '',
                'received-by': paymentData.receivedBy || ''
            };

            // Prepare Telegram data for payment notification
            const telegramData = {
                studentName: fullName || '',
                studentId: studentId || '',
                amount: paymentData.amount || 0,
                currency: 'UZS',
                paymentMethod: paymentData.paymentMethod || '',
                paymentType: 'Shartnoma uchun to\'lov',
                receivedBy: paymentData.receivedBy || '',
                remainingDebt: paymentData.remainingDebt || 0,
                transactionId: `TXN${studentId}${Date.now().toString().slice(-6)}`
            };

            // Add Telegram data to the form
            formData['telegram-data'] = JSON.stringify(telegramData);

            // Use URLSearchParams to send as form data
            const params = new URLSearchParams();
            Object.keys(formData).forEach(key => {
                params.append(key, formData[key]);
            });

            fetch(APPS_SCRIPT_WEB_APP_URL, {
                method: 'POST',
                body: params
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Network response was not ok (${response.status}): ${text}`);
                    });
                }
                return response.json();
            })
            .then(result => {
                if (result && result.status === 'success') {
                    console.log('Google Sheets Payment API success:', result.message);
                    resolve(result);
                } else {
                    const errorMessage = result && result.message ? result.message : 'Unknown error from Google Apps Script';
                    console.error('Google Sheets Payment API error:', errorMessage);
                    reject(new Error(errorMessage));
                }
            })
            .catch(error => {
                console.error('Error calling Google Apps Script for payment:', error);
                reject(error);
            });
        });
    },

    writeAppFeeData: function(studentId, fullName, appFeeData) {
        return new Promise((resolve, reject) => {
            console.log('🚀 Starting writeAppFeeData for student:', studentId);
            console.log('📋 AppFee data to send:', appFeeData);
            
            if (APPS_SCRIPT_WEB_APP_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
                const message = "Apps Script Web App URL is not configured in apps-script-integration.js. Skipping Google Sheets.";
                console.warn(message);
                resolve({ status: 'skipped', message: message });
                return;
            }

            // Prepare the app fee data for the AppFee sheet
            // Format: Timestamp, ID, FULL NAME, Amount, Payment method, Received by, University name
            const formData = {
                'action': 'addAppFee',
                'student-id': studentId || '',
                'full-name': fullName || '',
                'amount': appFeeData.amount || 0,
                'payment-method': appFeeData.paymentMethod || 'Application Fee',
                'received-by': appFeeData.receivedBy || 'Admin',
                'university1': appFeeData.university1 || '',
                'university2': appFeeData.university2 || ''
            };

            console.log('📤 Form data prepared:', formData);

            // Prepare Telegram data for app fee notification
            const telegramData = {
                studentName: fullName || '',
                studentId: studentId || '',
                university1: appFeeData.university1 || '',
                university2: appFeeData.university2 || '',
                amount: appFeeData.amount || 0,
                currency: 'UZS',
                paymentMethod: appFeeData.paymentMethod || 'Application Fee',
                receivedBy: appFeeData.receivedBy || 'Admin',
                status: 'Completed'
            };

            // Add Telegram data to the form
            formData['telegram-data'] = JSON.stringify(telegramData);

            // Use URLSearchParams to send as form data
            const params = new URLSearchParams();
            Object.keys(formData).forEach(key => {
                params.append(key, formData[key]);
            });

            console.log('🌐 Sending request to Google Apps Script...');
            console.log('🔗 URL:', APPS_SCRIPT_WEB_APP_URL);

            fetch(APPS_SCRIPT_WEB_APP_URL, {
                method: 'POST',
                body: params
            })
            .then(response => {
                console.log('📥 Response status:', response.status);
                console.log('📥 Response ok:', response.ok);
                
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('❌ Network response was not ok:', text);
                        throw new Error(`Network response was not ok (${response.status}): ${text}`);
                    });
                }
                return response.json();
            })
            .then(result => {
                console.log('📊 Google Apps Script response:', result);
                
                if (result && result.status === 'success') {
                    console.log('✅ Google Sheets App Fee API success:', result.message);
                    resolve(result);
                } else {
                    const errorMessage = result && result.message ? result.message : 'Unknown error from Google Apps Script';
                    console.error('❌ Google Sheets App Fee API error:', errorMessage);
                    reject(new Error(errorMessage));
                }
            })
            .catch(error => {
                console.error('❌ Error calling Google Apps Script for app fee:', error);
                reject(error);
            });
        });
    },

    writeGivenSheetData: function(studentIds, studentNames, paymentData) {
        return new Promise((resolve, reject) => {
            console.log('🚀 Starting writeGivenSheetData for students:', studentIds);
            console.log('📋 Payment data to send:', paymentData);
            
            if (APPS_SCRIPT_WEB_APP_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
                const message = "Apps Script Web App URL is not configured in apps-script-integration.js. Skipping Google Sheets.";
                console.warn(message);
                resolve({ status: 'skipped', message: message });
                return;
            }

            // Prepare the bulk payment data for the Given sheet
            // Format: Timestamp, IDs, Amount, Receiver, Payment method, Responsible, University name
            const formData = {
                'action': 'givenSheet',
                'timestamp': new Date().toISOString(),
                'student-ids': Array.isArray(studentIds) ? studentIds.join(', ') : studentIds,
                'amount': paymentData.amount || 0,
                'receiver': paymentData.receiver || '',
                'payment-method': paymentData.paymentMethod || '',
                'responsible': paymentData.responsible || '',
                'university': paymentData.university || ''
            };

            console.log('📤 Form data prepared for Given sheet:', formData);

            // Prepare Telegram data for bulk payment notification
            const telegramData = {
                studentIds: Array.isArray(studentIds) ? studentIds.join(', ') : studentIds,
                studentNames: Array.isArray(studentNames) ? studentNames.join(', ') : studentNames,
                studentsCount: Array.isArray(studentIds) ? studentIds.length : 1,
                students: Array.isArray(studentIds) && Array.isArray(studentNames) ? 
                    studentIds.map((id, index) => ({
                        studentId: id,
                        fullname: studentNames[index] || 'Unknown Student'
                    })) : [],
                university: paymentData.university || '',
                amount: paymentData.amount || 0,
                currency: 'UZS',
                paymentMethod: paymentData.paymentMethod || '',
                receivedBy: paymentData.responsible || '',
                receiver: paymentData.receiver || '',
                paymentType: 'Bulk Application Fee',
                status: 'Completed'
            };

            // Add Telegram data to the form
            formData['telegram-data'] = JSON.stringify(telegramData);

            // Use URLSearchParams to send as form data
            const params = new URLSearchParams();
            Object.keys(formData).forEach(key => {
                params.append(key, formData[key]);
            });

            console.log('🌐 Sending bulk payment request to Google Apps Script...');
            console.log('🔗 URL:', APPS_SCRIPT_WEB_APP_URL);

            fetch(APPS_SCRIPT_WEB_APP_URL, {
                method: 'POST',
                body: params
            })
            .then(response => {
                console.log('📥 Response status:', response.status);
                console.log('📥 Response ok:', response.ok);
                
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('❌ Network response was not ok:', text);
                        throw new Error(`Network response was not ok (${response.status}): ${text}`);
                    });
                }
                return response.json();
            })
            .then(result => {
                console.log('📊 Google Apps Script response:', result);
                
                if (result && result.status === 'success') {
                    console.log('✅ Google Sheets Given Sheet API success:', result.message);
                    resolve(result);
                } else {
                    const errorMessage = result && result.message ? result.message : 'Unknown error from Google Apps Script';
                    console.error('❌ Google Sheets Given Sheet API error:', errorMessage);
                    reject(new Error(errorMessage));
                }
            })
            .catch(error => {
                console.error('❌ Error calling Google Apps Script for Given sheet:', error);
                reject(error);
            });
        });
    },

    sendTelegramNotification: function(action, data) {
        return new Promise((resolve, reject) => {
            if (APPS_SCRIPT_WEB_APP_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
                const message = "Apps Script Web App URL is not configured in apps-script-integration.js. Skipping Telegram.";
                console.warn(message);
                resolve({ status: 'skipped', message: message });
                return;
            }

            // Prepare the form data for Telegram-only notification
            const formData = {
                'action': 'sendTelegram',
                'telegram-action': action,
                'telegram-data': JSON.stringify(data)
            };

            // Use URLSearchParams to send as form data
            const params = new URLSearchParams();
            Object.keys(formData).forEach(key => {
                params.append(key, formData[key]);
            });

            fetch(APPS_SCRIPT_WEB_APP_URL, {
                method: 'POST',
                body: params
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Network response was not ok (${response.status}): ${text}`);
                    });
                }
                return response.json();
            })
            .then(result => {
                if (result && result.status === 'success') {
                    console.log('Telegram notification API success:', result.message);
                    resolve(result);
                } else {
                    const errorMessage = result && result.message ? result.message : 'Unknown error from Google Apps Script';
                    console.error('Telegram notification API error:', errorMessage);
                    reject(new Error(errorMessage));
                }
            })
            .catch(error => {
                console.error('Error calling Google Apps Script for Telegram:', error);
                reject(error);
            });
        });
    }
};

// This log indicates that the script file itself has been loaded and the object is created.
// The console log in register.html ('✅ Apps Script Google Sheets integration ready for registration')
// will confirm that register.html can see this object.
console.log('✅ apps-script-integration.js loaded and window.appsScriptGoogleSheets object created.'); 