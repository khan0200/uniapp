# 🎯 UniBridge CRM - Setup & Implementation Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Features Implemented](#features-implemented)
3. [File Structure](#file-structure)
4. [Quick Start](#quick-start)
5. [Firebase Integration](#firebase-integration)
6. [Customization Guide](#customization-guide)
7. [Testing Checklist](#testing-checklist)

---

## 🎨 Project Overview

**UniBridge CRM** is a premium student management system featuring:
- ✨ **Apple iOS Dark Mode Design** with glassmorphism
- 📱 Fully responsive layout
- 🔥 Firebase Realtime Database integration
- 💾 localStorage fallback
- 📊 Excel export functionality
- 🎭 Smooth animations and transitions

---

## ✅ Features Implemented

### 1. **UI/UX - Apple "Human Interface" Style**

#### ✓ Color Scheme
- Deep charcoal background: `#1c1c1e`
- Card background: `#2c2c2e`
- Apple blue: `#0a84ff`
- Perfect contrast ratios for accessibility

#### ✓ Glassmorphism Effects
```css
backdrop-filter: blur(20px);
background: rgba(44, 44, 46, 0.95);
```
- Applied to navigation bar
- Applied to all modals
- Subtle transparency with blur

#### ✓ Typography
- Font Family: San Francisco (system-ui)
- Tight letter-spacing: `-0.003em`
- Antialiased rendering for crisp text

#### ✓ Border Radius
- Cards: `15-16px`
- Buttons: `12px` (pill shape with `rounded-pill`)
- Inputs: `12px`

#### ✓ Animations
- Ease-in-out transitions: `cubic-bezier(0.4, 0, 0.2, 1)`
- Expandable cards with iOS drawer behavior
- Smooth hover effects with `translateY(-2px)`
- Chevron rotation on card expansion

### 2. **Form Implementation**

#### ✓ Layout Structure
```
Row 1: Student ID (4 cols) | Full Name (8 cols)
Row 2: Phone 1 (4) | Phone 2 (4) | Email (4)
Row 3: Birthday (4) | Passport (4) | Tariff (4)
Row 4: Level (6) | Language Certificate (6)
Row 5: University 1 (6) | University 2 (6)
Row 6: Address (12 - full width)
Row 7: Notes (12 - full width)
```

#### ✓ Input Masking
| Field | Format | Implementation |
|-------|--------|----------------|
| Phone | `00-000-00-00` | Cleave.js with delimiter |
| Passport | `AA0000000` | Custom regex (2 letters + 7 digits) |
| Full Name | UPPERCASE | Auto-transform on input |
| Address | UPPERCASE | Auto-transform on input |

#### ✓ Conditional Logic

**Language Certificate Selection:**
- **TOPIK** → Shows: Level dropdown (1-6) + Score input
- **SKA** → Shows: Level dropdown (Basic/Intermediate/Advanced)
- **IELTS** → Shows: Overall score + Type (Academic/General)
- **TOEFL** → Shows: Score + Type (iBT/PBT)

**Level Selection:**
- **COLLEGE** → Populates 13 universities
- **BACHELOR** → Populates 60+ universities
- **MASTERS** → Populates 9 E-VISA universities
- **MASTER NO CERTIFICATE** → Populates 5 special universities

#### ✓ Validation Rules
- Required fields marked with `*` (asterisk)
- Student ID, Full Name, Phone 1, Tariff, Level, Language Certificate are mandatory
- Email validated with regex pattern
- Birthday restricted to 1980-01-01 through 2010-12-31
- Real-time validation feedback with `.is-invalid` class

### 3. **Data Management**

#### ✓ Tariff Mapping
```javascript
STANDARD: 26,500,000 UZS
PREMIUM: 32,500,000 UZS
VIP: 40,000,000 UZS
SCHOLARSHIP: 0 UZS
```

#### ✓ Data Storage
- **Primary**: Firebase Realtime Database
- **Fallback**: localStorage (automatic if Firebase unavailable)
- **Export**: Excel via SheetJS (XLSX format)

### 4. **Student Cards**

#### ✓ Card Features
- Click to expand/collapse (iOS drawer animation)
- Shows badges for: Level, Tariff, Language Certificate
- Gradient badges with vibrant colors
- Expandable details section with:
  - Contact information
  - Passport & birthday
  - University choices
  - Language certificate details
  - Address and notes
- "Download Excel" button per student

#### ✓ Search Functionality
- Real-time search as you type
- Searches: Full Name, Student ID, Phone, Email
- Case-insensitive matching
- Instant UI updates

---

## 📁 File Structure

```
uniapp/
│
├── index.html                 # Main HTML (Bootstrap 5.3, iOS design)
│
├── css/
│   └── styles.css            # Custom Apple iOS styling
│                             # - CSS variables for colors
│                             # - Glassmorphism effects
│                             # - Card animations
│                             # - Responsive breakpoints
│
├── js/
│   ├── app.js                # Core application logic
│   │                         # - Tab navigation
│   │                         # - Student rendering
│   │                         # - Search functionality
│   │                         # - Excel export
│   │
│   ├── form-validation.js    # Input handling
│   │                         # - Cleave.js masking
│   │                         # - Uppercase enforcement
│   │                         # - Conditional field logic
│   │                         # - Form validation
│   │
│   └── firebase-config.js    # Database integration
│                             # - Firebase setup
│                             # - CRUD operations
│                             # - localStorage fallback
│
└── README.md                 # Documentation
```

---

## 🚀 Quick Start

### Option 1: Direct File Open (Easiest)
```bash
# Windows
start index.html

# Mac
open index.html

# Linux
xdg-open index.html
```

### Option 2: Local Server (Recommended)
```bash
# Python 3 (built-in)
cd uniapp
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Open browser: `http://localhost:8000`

---

## 🔥 Firebase Integration

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it (e.g., "unibridge-crm")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Realtime Database
1. In left sidebar, click **Build** → **Realtime Database**
2. Click "Create Database"
3. Choose location (e.g., us-central1)
4. Start in **Test Mode** (for development)
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
5. Click "Enable"

### Step 3: Get Configuration
1. Click gear icon (⚙️) → **Project settings**
2. Scroll to "Your apps" section
3. Click **Web** app icon (`</>`)
4. Register app (nickname: "UniBridge CRM Web")
5. Copy the `firebaseConfig` object

### Step 4: Update Application
Open `js/firebase-config.js` and replace:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "unibridge-crm.firebaseapp.com",
    databaseURL: "https://unibridge-crm-default-rtdb.firebaseio.com",
    projectId: "unibridge-crm",
    storageBucket: "unibridge-crm.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

### Step 5: Add Firebase SDK
In `index.html`, add BEFORE `<script type="module" src="js/firebase-config.js"></script>`:

```html
<!-- Firebase SDK v9 Compat -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
```

### Step 6: Test Connection
1. Open browser console (F12)
2. Look for: `Firebase initialized successfully`
3. Add a student and check Firebase Console
4. Data should appear under `students` node

### Production Security Rules
Once ready for production, update database rules:

```json
{
  "rules": {
    "students": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$studentId": {
        ".validate": "newData.hasChildren(['id', 'fullName', 'phone1'])"
      }
    }
  }
}
```

---

## 🎨 Customization Guide

### Change Colors
Edit `css/styles.css`:

```css
:root {
    --apple-bg: #1c1c1e;          /* Main background */
    --apple-card: #2c2c2e;        /* Card background */
    --apple-blue: #0a84ff;        /* Primary color */
    --apple-success: #30d158;     /* Success color */
    /* Modify as needed */
}
```

### Add New Tariffs
Edit `js/app.js`:

```javascript
const tariffValues = {
    'STANDARD': '26,500,000 UZS',
    'PREMIUM': '32,500,000 UZS',
    'BUSINESS': '50,000,000 UZS',  // New tariff
};
```

Then update `index.html` tariff dropdown:

```html
<select id="tariff">
    <option value="BUSINESS">BUSINESS - 50,000,000 UZS</option>
</select>
```

### Add Universities
Edit `js/app.js`:

```javascript
const uniData = {
    'BACHELOR': [
        'Seoul National (SNU)',
        'Your New University',  // Add here
        // ...
    ]
};
```

### Modify Input Formats
Edit `js/form-validation.js`:

```javascript
// Example: Change phone format to (000) 000-0000
new Cleave('#phone1', {
    delimiters: ['(', ') ', '-'],
    blocks: [0, 3, 3, 4],
    numericOnly: true
});
```

---

## ✅ Testing Checklist

### Visual Design
- [ ] Dark mode colors display correctly
- [ ] Glassmorphism blur on navbar and modals
- [ ] Border radius is 12-16px on cards/buttons
- [ ] Smooth animations on card expansion
- [ ] Hover effects work on all buttons
- [ ] Bootstrap icons load properly

### Form Functionality
- [ ] "Add Student" button opens modal
- [ ] All required fields marked with `*`
- [ ] Student ID auto-generate works
- [ ] Full Name converts to uppercase
- [ ] Phone masking: `00-000-00-00`
- [ ] Passport format: `AA0000000`
- [ ] Birthday limited to 1980-2010
- [ ] Email validation works

### Conditional Logic
- [ ] TOPIK shows level + score fields
- [ ] SKA shows level field
- [ ] IELTS shows overall + type fields
- [ ] TOEFL shows score + type fields
- [ ] Selecting College populates correct universities
- [ ] Selecting Bachelor populates correct universities
- [ ] Selecting Masters populates E-VISA universities

### Data Management
- [ ] Student saves successfully
- [ ] Student appears in list immediately
- [ ] Student card expands/collapses smoothly
- [ ] All saved data displays correctly
- [ ] Search filters students in real-time
- [ ] Excel download generates correct file
- [ ] Data persists after page reload

### Firebase (if configured)
- [ ] Firebase initializes (check console)
- [ ] Data saves to Firebase Realtime Database
- [ ] Data syncs across multiple tabs
- [ ] Real-time updates work

### Responsive Design
- [ ] Works on desktop (1920px)
- [ ] Works on laptop (1366px)
- [ ] Works on tablet (768px)
- [ ] Works on mobile (375px)
- [ ] Navigation collapses on mobile
- [ ] Form columns stack properly

---

## 🐛 Common Issues & Solutions

### Issue: Students not saving
**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify Firebase config if using cloud
4. Check localStorage quota (clear if needed)

### Issue: Excel export not working
**Solution:**
1. Verify SheetJS CDN is loaded
2. Check browser console for errors
3. Try different browser (Chrome recommended)
4. Ensure popup blocker isn't blocking download

### Issue: Input masking not working
**Solution:**
1. Verify Cleave.js CDN is loaded
2. Check console for errors
3. Ensure IDs match: `phone1`, `phone2`, `passport`

### Issue: Firebase not connecting
**Solution:**
1. Verify Firebase SDK scripts load BEFORE firebase-config.js
2. Check firebaseConfig values are correct
3. Ensure Realtime Database is enabled
4. Check database rules allow read/write

---

## 📊 Next Steps (Recommended Enhancements)

### Phase 2 Features
- [ ] Authentication system (login/logout)
- [ ] Edit student functionality
- [ ] Delete student with confirmation
- [ ] Bulk import from Excel
- [ ] Advanced filtering (by level, tariff, language)
- [ ] Payments tracking module
- [ ] Dashboard with statistics

### Phase 3 Features
- [ ] Student status workflow (Applied → Accepted → Enrolled)
- [ ] Document upload (passport, certificates)
- [ ] Email notifications
- [ ] PDF report generation
- [ ] Multi-language support
- [ ] Dark/light mode toggle

---

## 📞 Support

### Resources
- **Bootstrap 5 Docs**: https://getbootstrap.com/docs/5.3/
- **Firebase Docs**: https://firebase.google.com/docs/database
- **Cleave.js Docs**: https://nosir.github.io/cleave.js/
- **SheetJS Docs**: https://docs.sheetjs.com/

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

**Built with ❤️ following Apple Human Interface Guidelines**

Last Updated: December 27, 2025
