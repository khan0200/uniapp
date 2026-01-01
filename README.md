# UniBridge CRM - Apple iOS Style Dark Mode

A stunning, modern CRM application for student management with Apple iOS design aesthetics, built with HTML, CSS, JavaScript, Bootstrap 5, and Firebase.

## ✨ Features

### 🎨 **Premium Design**
- **Apple iOS Dark Mode**: Deep charcoal backgrounds (#1c1c1e) with glassmorphism effects
- **Smooth Animations**: Ease-in-out transitions with iOS drawer-style expandable cards
- **High Border Radius**: 12-16px rounded corners on all cards and buttons
- **Glassmorphism**: `backdrop-filter: blur(20px)` on modals and navigation
- **Typography**: San Francisco font family (system-ui) with tight tracking

### 📋 **Student Management**
- Add new students with comprehensive information
- Expandable student cards with smooth animations
- Search functionality for quick student lookup
- Auto-generated Student IDs
- Excel export for individual student data

### 🎓 **Smart Form Features**
- **Conditional Logic**: Language certificate fields (TOPIK, SKA, IELTS, TOEFL) appear based on selection
- **Dynamic University Dropdown**: Universities populate based on selected level (College, Bachelor, Masters)
- **Input Masking**:
  - Phone: `00-000-00-00` format
  - Passport: `AA0000000` (2 letters + 7 digits)
- **Auto-Uppercase**: Full Name and Address automatically convert to uppercase
- **Date Range**: Birthday field restricted to 1980-2010
- **Required Field Validation**: All mandatory fields marked with asterisks

### 💾 **Data Management**
- Firebase Realtime Database integration
- localStorage fallback for offline functionality
- Real-time data synchronization
- CRUD operations (Create, Read, Update, Delete)

### 📊 **Data Fields**
- Student ID (auto-generated or manual)
- Full Name (uppercase)
- Contact: Phone 1, Phone 2, Email
- Birthday (1980-2010)
- Passport Number (formatted)
- Tariff: STANDARD (26.5M UZS), PREMIUM (32.5M UZS), VIP (40M UZS), SCHOLARSHIP (0 UZS)
- Education Level: College, Bachelor, Masters, Master No Certificate
- Language Certificate: TOPIK, SKA, IELTS, TOEFL (with level/score fields)
- University Choices: 1st and 2nd preference
- Address (uppercase)
- Notes

## 🚀 Quick Start

### 1. **Open the Application**
Simply open `index.html` in your browser:
```bash
# Windows
start index.html

# Or double-click the file
```

### 2. **Local Development Server (Recommended)**
For better development experience, use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open: `http://localhost:8000`

### 3. **Firebase Setup (Optional)**
To enable cloud database functionality:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Realtime Database**
4. Get your configuration from Project Settings
5. Update `js/firebase-config.js` with your credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

6. Add Firebase SDK to your HTML (before closing `</body>`):

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
```

**Note**: Without Firebase, the app will use localStorage automatically.

## 📁 Project Structure

```
uniapp/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Custom CSS with Apple iOS design
├── js/
│   ├── app.js              # Core application logic
│   ├── form-validation.js  # Input masking & validation
│   └── firebase-config.js  # Firebase configuration
└── README.md               # This file
```

## 🎯 How to Use

### Adding a Student
1. Click **"+ Add Student"** button
2. Fill in the required fields (marked with *)
3. Select **Language Certificate** to reveal specific fields (TOPIK levels, IELTS scores, etc.)
4. Select **Level** to populate university options
5. Click **"Save Student"**

### Viewing Student Details
1. Click on any student card to expand
2. View all student information
3. Click **"Download Excel"** to export student data

### Searching Students
- Use the search bar to filter by name, ID, or phone number
- Results update in real-time

## 🎨 Design System

### Color Palette
- **Background**: `#1c1c1e` (Apple Dark)
- **Cards**: `#2c2c2e` (Apple Card)
- **Elevated**: `#3a3a3c`
- **Border**: `#48484a`
- **Primary Blue**: `#0a84ff` (Apple Blue)
- **Success**: `#30d158`
- **Warning**: `#ffd60a`
- **Danger**: `#ff453a`

### Typography
- **Font Family**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
- **Letter Spacing**: -0.003em (tight tracking)
- **Font Smoothing**: Antialiased

### Border Radius
- **Base**: 12px
- **Large**: 16px
- **Extra Large**: 20px

### Animations
- **Transition**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- **Card Hover**: translateY(-2px) with shadow
- **Expandable Cards**: iOS drawer-style slide down

## 📚 Technologies Used

- **HTML5**: Semantic structure
- **CSS3**: Custom properties, animations, glassmorphism
- **JavaScript (ES6+)**: Modern vanilla JS
- **Bootstrap 5.3**: Grid system and utilities
- **Bootstrap Icons**: Icon library
- **Cleave.js**: Input masking
- **SheetJS (xlsx)**: Excel export
- **Firebase**: Realtime Database (optional)

## 🔧 Customization

### Adding New Tariffs
Edit `js/app.js`:
```javascript
const tariffValues = {
    'STANDARD': '26,500,000 UZS',
    'PREMIUM': '32,500,000 UZS',
    'VIP': '40,000,000 UZS',
    'YOUR_TARIFF': 'PRICE UZS'
};
```

### Adding Universities
Edit `js/app.js`:
```javascript
const uniData = {
    'BACHELOR': ['University 1', 'University 2', ...],
    // Add more levels
};
```

### Changing Colors
Edit `css/styles.css`:
```css
:root {
    --apple-bg: #1c1c1e;
    --apple-blue: #0a84ff;
    /* Customize colors */
}
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1366px+)
- Tablet (768px+)
- Mobile (320px+)

## 🐛 Troubleshooting

### Students not saving?
- Check browser console for errors
- Verify Firebase configuration if using cloud database
- Check localStorage quota (5-10MB limit)

### Excel export not working?
- Ensure SheetJS library is loaded
- Check browser console for errors
- Try a different browser

### Form validation issues?
- All required fields must be filled
- Email must be valid format
- Phone must match pattern: 00-000-00-00
- Passport must be 2 letters + 7 digits

## 📄 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Built with ❤️ using Apple Human Interface Guidelines

---

**Enjoy your beautiful CRM application! 🎉**
