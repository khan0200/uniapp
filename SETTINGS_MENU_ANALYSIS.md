# Settings Menu Analysis - UNIAPP
## Comprehensive Documentation

**Analysis Date:** February 10, 2026  
**Application:** UNIAPP - University Student Management System  
**URL Analyzed:** http://127.0.0.1:5500/index.html

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Access & Navigation](#access--navigation)
3. [Settings Sections](#settings-sections)
4. [Functionality Breakdown](#functionality-breakdown)
5. [Technical Implementation](#technical-implementation)
6. [UI/UX Design](#uiux-design)
7. [Data Management](#data-management)

---

## 🎯 Overview

The Settings menu in UNIAPP is a comprehensive configuration panel that allows administrators to manage core system settings including:
- **Appearance customization** (Dark/Light theme)
- **Tariff management** (Pricing plans)
- **Education level configuration**
- **Student group organization**
- **University database management**
- **Video tutorial links** for student portal

### Purpose
The settings menu serves as the central hub for system configuration, enabling administrators to customize and maintain the application's core data structures without modifying code.

---

## 🚪 Access & Navigation

### Location
- **Navigation Bar:** Top-right corner of the application
- **Icon:** Gear icon (⚙️) with label "SETTINGS"
- **Route:** Accessed via navigation link `nav-settings`

### Access Method
```html
<li class="nav-item">
    <a class="nav-link nav-link-apple" href="#" 
       onclick="showTab('settings'); return false;" 
       id="nav-settings">
        <i class="bi bi-gear-fill me-1"></i> SETTINGS
    </a>
</li>
```

### Visual Indicators
- Active state: Highlighted when the settings tab is open
- Apple iOS-inspired design with smooth transitions
- Sticky navigation bar remains accessible while scrolling

---

## ⚙️ Settings Sections

The settings page is organized into **6 main sections**:

### 1. **Appearance (Theme Toggle)** 🌓
**Location:** Top section, full-width card  
**Purpose:** Dark/Light mode switcher

**Features:**
- Toggle switch with sun ☀️ and moon 🌙 icons
- Persists preference in `localStorage`
- Real-time theme switching
- Apple-style animated toggle slider

**HTML Structure:**
```html
<div class="card-apple p-4 mb-4">
    <div class="d-flex justify-content-between align-items-center">
        <div>
            <h5 class="mb-1">
                <i class="bi bi-moon-stars-fill me-2"></i>Appearance
            </h5>
            <p class="text-secondary mb-0 small">
                Switch between dark and light mode
            </p>
        </div>
        <div class="theme-toggle-wrapper">
            <label class="theme-toggle" for="themeToggle">
                <input type="checkbox" id="themeToggle" 
                       onchange="toggleTheme()">
                <span class="theme-toggle-slider">
                    <i class="bi bi-sun-fill sun-icon"></i>
                    <i class="bi bi-moon-fill moon-icon"></i>
                </span>
            </label>
        </div>
    </div>
</div>
```

---

### 2. **Tariff Options** 💰
**Location:** Left column (col-lg-4)  
**Purpose:** Manage student pricing plans

**Features:**
- Add, edit, and delete tariff options
- Display tariff name and price
- Used for student enrollment pricing
- Integrated with student management and payment systems

**Default Tariffs:**
- STANDART: 13,000,000 UZS
- PREMIUM: 32,500,000 UZS
- VISA PLUS: 65,000,000 UZS
- E-VISA: 2,000,000 UZS
- REGIONAL VISA: 2,000,000 UZS

**Actions:**
- ➕ **Add Tariff:** Opens modal to create new tariff
- ✏️ **Edit:** Modify existing tariff details
- 🗑️ **Delete:** Remove tariff (with confirmation)

---

### 3. **Education Levels** 🎓
**Location:** Middle column (col-lg-4)  
**Purpose:** Manage education level categories

**Features:**
- Categorize students by education level
- Filter students across the system
- University assignment based on levels

**Default Education Levels:**
- COLLEGE
- BACHELOR
- MASTERS
- MASTER NO CERTIFICATE
- LANGUAGE COURSE
- DELETED (special status for soft-deleted students)

**Actions:**
- ➕ **Add Level:** Create new education level
- ✏️ **Edit:** Modify level name
- 🗑️ **Delete:** Remove level (with validation)

---

### 4. **Student Groups** 👥
**Location:** Right column (col-lg-4)  
**Purpose:** Organize students into groups

**Features:**
- Create custom student groupings
- Filter and manage students by group
- Useful for cohorts, programs, or batch management

**Actions:**
- ➕ **Add Group:** Create new student group
- ✏️ **Edit:** Rename group
- 🗑️ **Delete:** Remove group

**Use Cases:**
- Academic year cohorts (e.g., "2024 Intake")
- Program-specific groups (e.g., "Engineering Program")
- Regional groupings
- Custom categorization

---

### 5. **Universities** 🏛️
**Location:** Full-width card section  
**Purpose:** Manage university database by education level

**Features:**
- Add universities linked to specific education levels
- Display universities grouped by education level
- Used in student enrollment forms
- Dynamic dropdown population

**Hierarchy:**
```
Education Level
  └─ Universities (multiple)
      └─ Students (assigned to university)
```

**Actions:**
- ➕ **Add University:** Opens modal to create university entry
  - Requires: University name (uppercase)
  - Requires: Education level selection
- ✏️ **Edit:** Modify university details
- 🗑️ **Delete:** Remove university

**Display Format:**
Universities are displayed in an accordion-style grouped by education level with collapsible sections.

---

### 6. **Video Tutorials** 🎥
**Location:** Bottom full-width card  
**Purpose:** Manage video links shown on Student Portal

**Features:**
- Add YouTube or video links
- Display on student-facing portal
- Help students with application process
- Onboarding and training resources

**Actions:**
- ➕ **Add Video:** Create video entry with link
- ✏️ **Edit:** Update video link or title
- 🗑️ **Delete:** Remove video from portal

**Styling:**
- Red play icon (▶️) for visual emphasis
- Danger-styled button (`btn-danger`)

---

## 🔧 Functionality Breakdown

### Theme Toggle Function
**File:** `js/app.js`  
**Function:** `toggleTheme()`

```javascript
function toggleTheme() {
    const html = document.documentElement;
    const toggle = document.getElementById('themeToggle');
    const isLight = toggle.checked;

    html.setAttribute('data-bs-theme', isLight ? 'light' : 'dark');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
```

**Behavior:**
1. Checks toggle state (checked = light mode)
2. Updates `data-bs-theme` attribute on HTML element
3. Saves preference to localStorage for persistence
4. Bootstrap 5.3 automatically applies theme styles

---

### Tariff Management
**Functions:**
- `openTariffModal(tariffId = null)` - Opens add/edit modal
- `saveTariff()` - Saves tariff to Firestore
- `deleteTariff(tariffId)` - Removes tariff from database
- `loadTariffs()` - Fetches tariffs from Firestore

**Modal Structure:**
```javascript
function openTariffModal(tariffId = null) {
    const modal = new bootstrap.Modal(document.getElementById('tariffModal'));
    const form = document.getElementById('tariffForm');
    const title = document.getElementById('tariffModalTitle');

    form.reset();
    document.getElementById('tariffEditId').value = '';

    if (tariffId) {
        // Edit mode: populate form with existing data
        const tariff = window.tariffsData.find(t => t.firestoreId === tariffId);
        if (tariff) {
            title.innerHTML = '<i class="bi bi-tag-fill me-2"></i>Edit Tariff';
            document.getElementById('tariffEditId').value = tariffId;
            document.getElementById('tariffName').value = tariff.name;
            document.getElementById('tariffPrice').value = tariff.price;
        }
    } else {
        // Add mode: blank form
        title.innerHTML = '<i class="bi bi-tag-fill me-2"></i>Add Tariff';
    }

    modal.show();
}
```

---

### Education Level Management
**Functions:**
- `openLevelModal(levelId = null)` - Opens add/edit modal
- `saveLevel()` - Saves level to Firestore
- `deleteLevel(levelId)` - Removes level from database
- `loadLevels()` - Fetches levels from Firestore

**Key Logic:**
```javascript
function openLevelModal(levelId = null) {
    const modal = new bootstrap.Modal(document.getElementById('levelModal'));
    const form = document.getElementById('levelForm');
    const title = document.getElementById('levelModalTitle');

    form.reset();
    document.getElementById('levelEditId').value = '';

    if (levelId) {
        const level = window.levelsData.find(l => l.firestoreId === levelId);
        if (level) {
            title.innerHTML = '<i class="bi bi-mortarboard-fill me-2"></i>Edit Education Level';
            document.getElementById('levelEditId').value = levelId;
            document.getElementById('levelName').value = level.name;
        }
    } else {
        title.innerHTML = '<i class="bi bi-mortarboard-fill me-2"></i>Add Education Level';
    }

    modal.show();
}
```

---

### Group Management
**Functions:**
- `openGroupModal(groupId = null)` - Opens add/edit modal
- `saveGroup()` - Saves group to Firestore
- `deleteGroup(groupId)` - Removes group from database
- `loadGroups()` - Fetches groups from Firestore

**Implementation:**
```javascript
function openGroupModal(groupId = null) {
    const modal = new bootstrap.Modal(document.getElementById('groupModal'));
    const form = document.getElementById('groupForm');
    const title = document.getElementById('groupModalTitle');

    form.reset();
    document.getElementById('groupEditId').value = '';

    if (groupId) {
        const group = window.groupsData.find(g => g.firestoreId === groupId);
        if (group) {
            title.innerHTML = '<i class="bi bi-people-fill me-2"></i>Edit Group';
            document.getElementById('groupEditId').value = groupId;
            document.getElementById('groupName').value = group.name;
        }
    } else {
        title.innerHTML = '<i class="bi bi-people-fill me-2"></i>Add Group';
    }

    modal.show();
}
```

---

### University Management
**Functions:**
- `openUniversityModal(universityId = null)` - Opens add/edit modal
- `saveUniversity()` - Saves university to Firestore
- `deleteUniversity(universityId)` - Removes university
- `loadUniversities()` - Fetches universities from Firestore

**Advanced Features:**
- Universities are linked to education levels
- Modal dynamically populates level dropdown
- Validation: University names must be uppercase
- Accordion-style display grouped by level

**Implementation:**
```javascript
function openUniversityModal(universityId = null) {
    const modal = new bootstrap.Modal(document.getElementById('universityModal'));
    const form = document.getElementById('universityForm');
    const title = document.getElementById('universityModalTitle');
    const levelSelect = document.getElementById('universityLevel');

    form.reset();
    document.getElementById('universityEditId').value = '';

    // Populate level dropdown dynamically
    levelSelect.innerHTML = '<option value="">Choose Level...</option>';
    window.levelsData.forEach(l => {
        levelSelect.innerHTML += `<option value="${l.firestoreId}">${l.name}</option>`;
    });

    if (universityId) {
        const uni = window.universitiesData.find(u => u.firestoreId === universityId);
        if (uni) {
            title.innerHTML = '<i class="bi bi-building me-2"></i>Edit University';
            document.getElementById('universityEditId').value = universityId;
            document.getElementById('universityName').value = uni.name;
            document.getElementById('universityLevel').value = uni.levelId;
        }
    } else {
        title.innerHTML = '<i class="bi bi-building me-2"></i>Add University';
    }

    modal.show();
}
```

---

### Video Tutorial Management
**Functions:**
- `openVideoModal(videoId = null)` - Opens add/edit modal
- `saveVideo()` - Saves video to Firestore
- `deleteVideo(videoId)` - Removes video
- `loadVideos()` - Fetches videos from Firestore

**Purpose:**
Videos are displayed on the student portal to provide:
- Application guidance
- Tutorial content
- Important announcements via video
- Onboarding materials

---

## 🎨 UI/UX Design

### Design Philosophy
The settings menu follows **Apple iOS design principles**:
- Clean, minimalist interface
- Ample whitespace
- Subtle glassmorphism effects
- Smooth animations and transitions
- Clear visual hierarchy

### Visual Components

#### Cards (`card-apple`)
```css
/* Apple-style card design */
.card-apple {
    background: var(--bg-card);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

#### Theme Toggle Switch
- Custom-styled checkbox
- Animated slider
- Sun and moon icons
- Smooth transitions
- iOS-inspired design

#### Buttons
- **Primary Apple Button** (`btn-primary-apple`): Blue gradient
- **Rounded Pills**: Consistent rounded-pill styling
- **Icon Integration**: Bootstrap Icons throughout
- **Hover Effects**: Subtle scale and color changes

#### Layout
- **Responsive Grid**: Uses Bootstrap 5 grid system
- **Mobile-First**: Adapts to different screen sizes
- **3-Column Layout**: Tariff, Levels, Groups side-by-side on desktop
- **Full-Width Sections**: Universities and Videos span full width

### Color Scheme

**Dark Mode (Default):**
- Background: Dark gray/black tones
- Cards: Semi-transparent dark with blur effect
- Text: White/light gray
- Accents: Blue (primary), Red (danger), Green (success)

**Light Mode:**
- Background: White/light gray
- Cards: White with subtle shadows
- Text: Dark gray/black
- Accents: Vibrant colors maintained

### Icons
**Bootstrap Icons Used:**
- 🌙 `bi-moon-stars-fill` - Appearance section
- ☀️ `bi-sun-fill` - Light mode
- 🌙 `bi-moon-fill` - Dark mode
- 🏷️ `bi-tag-fill` - Tariff options
- 🎓 `bi-mortarboard-fill` - Education levels
- 👥 `bi-people-fill` - Student groups
- 🏛️ `bi-building` - Universities
- ▶️ `bi-play-circle-fill` - Video tutorials
- ➕ `bi-plus-circle` - Add actions

---

## 💾 Data Management

### Storage Backend
**Firebase Firestore** is used for all settings data.

**File:** `js/firebase-config.js`

### Collections Structure

#### `tariffs` Collection
```javascript
{
    firestoreId: "auto-generated-id",
    name: "PREMIUM",
    price: "32,500,000 UZS",
    createdAt: Timestamp,
    updatedAt: Timestamp
}
```

#### `levels` Collection
```javascript
{
    firestoreId: "auto-generated-id",
    name: "BACHELOR",
    createdAt: Timestamp,
    updatedAt: Timestamp
}
```

#### `groups` Collection
```javascript
{
    firestoreId: "auto-generated-id",
    name: "2024 Intake",
    createdAt: Timestamp,
    updatedAt: Timestamp
}
```

#### `universities` Collection
```javascript
{
    firestoreId: "auto-generated-id",
    name: "KOREA UNIVERSITY",
    levelId: "reference-to-level-id",
    createdAt: Timestamp,
    updatedAt: Timestamp
}
```

#### `videos` Collection
```javascript
{
    firestoreId: "auto-generated-id",
    title: "Application Guide",
    url: "https://youtube.com/watch?v=...",
    createdAt: Timestamp,
    updatedAt: Timestamp
}
```

### Data Flow

**Loading Data:**
1. User navigates to Settings tab
2. `showTab('settings')` is called
3. Individual load functions fire:
   - `loadTariffs()`
   - `loadLevels()`
   - `loadGroups()`
   - `loadUniversities()`
   - `loadVideos()`
4. Data fetched from Firestore
5. Rendered in respective containers

**Saving Data:**
1. User clicks "Add" button
2. Modal opens with empty form (or populated for edit)
3. User fills form and clicks "Save"
4. Validation occurs
5. Data sent to Firestore
6. Success notification shown
7. List refreshed automatically
8. Modal closed

**Deleting Data:**
1. User clicks delete icon on item
2. Confirmation modal appears
3. User confirms deletion
4. Item removed from Firestore
5. Success notification shown
6. List refreshed

### Local Caching
```javascript
window.tariffsData = [];
window.levelsData = [];
window.groupsData = [];
window.universitiesData = [];
window.videosData = [];
```

Data is stored in memory for quick access and to reduce Firestore reads.

### Theme Persistence
```javascript
localStorage.setItem('theme', 'dark' | 'light');
```

Theme preference is saved to localStorage and automatically applied on page load.

---

## 📊 Integration with Other Modules

### Student Management
- **Tariffs:** Used in student enrollment to set pricing
- **Levels:** Filter students by education level
- **Groups:** Organize and filter students
- **Universities:** Assign students to universities

### Payment System
- **Tariffs:** Calculate payment balance (tariff amount - payments received)
- Balance tracking uses tariff amounts

### Admissions Module
- **Universities:** Populate university dropdown in admission forms
- **Levels:** Filter admissions by education level

### Student Portal
- **Videos:** Display tutorial videos for students

---

## 🔐 Security & Validation

### Input Validation
- **Required fields:** Marked with red asterisk (*)
- **Uppercase enforcement:** University names must be uppercase
- **Firestore ID validation:** Prevents duplicate entries
- **Form reset:** Clears data between add/edit operations

### Delete Confirmation
All delete operations require confirmation via modal to prevent accidental deletion.

**Confirmation Modal:**
```html
<div class="modal fade confirm-modal" id="confirmSettingsDeleteModal">
    <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
            <div class="modal-body">
                <i class="bi bi-exclamation-triangle"></i>
                <h5 class="mb-2" id="confirmSettingsDeleteTitle">Delete Item</h5>
                <p id="confirmSettingsDeleteMessage">
                    Are you sure you want to delete this item?
                </p>
            </div>
            <div class="modal-footer justify-content-center">
                <button type="button" class="btn btn-outline-secondary rounded-pill px-4"
                    data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger rounded-pill px-4"
                    id="confirmSettingsDeleteBtn">
                    <i class="bi bi-trash me-1"></i>Delete
                </button>
            </div>
        </div>
    </div>
</div>
```

### Authentication
The entire application requires login before accessing any features, including settings.

---

## 🚀 Performance Considerations

### Optimizations
1. **Lazy Loading:** Settings data loaded only when tab is accessed
2. **Local Caching:** Data stored in window object to minimize Firestore reads
3. **Debouncing:** Search and filter operations throttled
4. **Pagination:** (If implemented for large datasets)

### Loading States
```html
<div class="text-center py-4 text-secondary">
    <i class="bi bi-hourglass-split"></i> Loading tariffs...
</div>
```

Loading indicators shown while fetching data from Firestore.

---

## 📱 Responsive Design

### Breakpoints
- **Desktop (lg):** 3-column layout for Tariff/Levels/Groups
- **Tablet (md):** Stacked 2-column or single column
- **Mobile (sm/xs):** Full-width single column

### Mobile Optimizations
- Touch-friendly buttons (adequate tap targets)
- Collapsible navigation
- Scrollable modals
- Responsive spacing and typography

---

## 🐛 Error Handling

### Common Error Scenarios
1. **Network errors:** Firestore connection issues
2. **Validation errors:** Empty required fields
3. **Duplicate entries:** Handled at application level
4. **Delete conflicts:** Check if item is in use before deleting

### User Feedback
- **Success Notifications:** Green toast messages
- **Error Notifications:** Red toast messages
- **Loading States:** Spinner or skeleton screens
- **Empty States:** Friendly messages when no data exists

---

## 🎯 User Workflow Examples

### Example 1: Adding a New Tariff
1. Navigate to Settings tab
2. Locate "Tariff Options" card (left column)
3. Click "Add" button
4. Modal opens with empty form
5. Enter tariff name (e.g., "VIP")
6. Enter price (e.g., "50,000,000 UZS")
7. Click "Save"
8. Notification confirms success
9. New tariff appears in list
10. Modal closes automatically

### Example 2: Managing Universities
1. Navigate to Settings tab
2. Scroll to "Universities" section
3. Click "Add University"
4. Modal opens
5. Select education level from dropdown (e.g., "BACHELOR")
6. Enter university name in UPPERCASE (e.g., "SEOUL NATIONAL UNIVERSITY")
7. Click "Save"
8. University added to database
9. Displayed under selected education level in accordion
10. Available in student enrollment forms

### Example 3: Switching Theme
1. Navigate to Settings tab
2. See "Appearance" card at top
3. Click toggle switch
4. Theme changes immediately
5. Preference saved to localStorage
6. Persists across sessions

---

## 📝 Summary

The Settings menu in UNIAPP is a **well-designed, comprehensive configuration panel** that provides:

✅ **Centralized Management:** All system settings in one place  
✅ **User-Friendly Interface:** Apple iOS-inspired design  
✅ **Real-Time Updates:** Changes reflect immediately  
✅ **Persistent Storage:** Firestore database integration  
✅ **Responsive Design:** Works on all devices  
✅ **Security:** Authentication required, delete confirmations  
✅ **Validation:** Input validation prevents errors  
✅ **Modular Architecture:** Clean separation of concerns  

### Key Strengths
- Intuitive user interface
- Comprehensive feature set
- Clean code organization
- Proper error handling
- Real-time data synchronization
- Beautiful visual design

### Potential Improvements
1. **Search/Filter:** Add search functionality for large lists
2. **Bulk Operations:** Import/export tariffs, levels, etc.
3. **Audit Logs:** Track who changed what and when
4. **Permissions:** Role-based access to settings
5. **Sorting:** Allow reordering of items
6. **Validation:** More robust validation rules
7. **Help Text:** Tooltips and inline help
8. **Keyboard Shortcuts:** Power user features

---

## 📚 Related Documentation
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Overall project documentation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Installation and setup
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick reference guide
- [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) - Database configuration

---

**Document Version:** 1.0  
**Last Updated:** February 10, 2026  
**Author:** UNIAPP Development Team
