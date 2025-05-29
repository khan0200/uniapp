// Configuration file for UniApp
// Store API keys and other configuration settings

const CONFIG = {
    // Google Sheets Apps Script Configuration
    GOOGLE_SHEETS: {
        // You need to deploy the Google Apps Script as a web app
        // 1. Open Google Apps Script (script.google.com)
        // 2. Create a new project and paste the google-apps-script.gs code
        // 3. Deploy as web app with execute permissions for "Anyone"
        // 4. Copy the web app URL and paste it below
        APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxrQGsWCFTWqgqfRYsRlE0JuXuzcMdMep1hlW7GWyEjeEipGeT_0tl1XCoyTrVwqvdRdw/exec', // Your actual Apps Script URL
        
        // Spreadsheet Configuration
        SPREADSHEET_ID: '1Z8moArnsYIg9dyzhx8Vmx9w6aJcrZr770DnioA53ZHI',
        SHEETS: {
            ALL_DATA: 'Students',
            PAYMENT: 'Payments'
        }
    },
    
    // Firebase Configuration (already in use)
    FIREBASE: {
        apiKey: "AIzaSyDtc3StzPcG7oivivYlXnKrR6S0c0xelJg",
        authDomain: "uniuni-dd4af.firebaseapp.com",
        projectId: "uniuni-dd4af",
        storageBucket: "uniuni-dd4af.firebasestorage.app",
        messagingSenderId: "583982319464",
        appId: "1:583982319464:web:ed3021724ef42f196df8dd"
    },
    
    // Application Settings
    APP: {
        NAME: 'UniApp',
        VERSION: '1.0.0',
        ENVIRONMENT: 'production' // or 'development'
    }
};

// Make config available globally
window.CONFIG = CONFIG;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 