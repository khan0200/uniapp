# UniApp - University Application Management System

A comprehensive web application for managing university applications, student registrations, payments, and application fees.

## 🚀 Features

- **Student Registration**: Complete student registration with personal, contact, and education information
- **Student Management**: View, search, and edit student information with inline editing
- **Payment Tracking**: Track tuition payments with detailed payment history
- **Application Fee Management**: Manage application fees for multiple universities
- **Real-time Notifications**: Telegram bot integration for payment notifications
- **Audit Logging**: Complete activity tracking and audit trails
- **Dark Mode**: Modern dark/light theme support
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Firestore (NoSQL database)
- **Styling**: Tailwind CSS, Custom CSS
- **Notifications**: Telegram Bot API
- **Deployment**: Vercel
- **Authentication**: Firebase Auth (configured)

## 📁 Project Structure

```
uniapp/
├── index.html              # Dashboard/Homepage
├── register.html           # Student registration form
├── studentlist.html        # Student list with search and filters
├── payments.html           # Payment tracking and management
├── appfee.html            # Application fee management
├── history.html           # Activity history and audit logs
├── firebase.js            # Firebase configuration and services
├── telegram-bot.js        # Telegram notification system
├── audit-logger.js        # Activity logging system
├── dark-mode.js          # Dark mode functionality
├── dist/                 # Tailwind CSS build output
├── vercel.json          # Vercel deployment configuration
└── README.md           # Project documentation
```

## 🚀 Live Demo

Visit the live application: [https://your-app-name.vercel.app](https://your-app-name.vercel.app)

## 🔧 Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/uniapp.git
   cd uniapp
   ```

2. **Start local server**
   ```bash
   # Using Python (recommended)
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## ⚙️ Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Update Firebase configuration in `firebase.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Get your bot token and chat ID
3. Update configuration in `telegram-config.js`:

```javascript
window.TELEGRAM_CONFIG = {
    BOT_TOKEN: 'your-bot-token',
    CHAT_ID: 'your-chat-id',
    NOTIFY_PAYMENTS: true,
    NOTIFY_REGISTRATIONS: true
};
```

## 📊 Database Collections

### Collections Structure

- **`register`**: Student registration data
- **`payments`**: Payment tracking and history
- **`appfee`**: Application fee records
- **`givenfee`**: Individual application fee payments
- **`activities`**: Audit logs and activity tracking

## 🎨 Features Overview

### Student Registration
- Complete registration form with validation
- Personal, contact, and education information
- University selection based on education level
- Automatic student ID generation

### Payment Management
- Payment tracking with history
- Multiple payment methods support
- Debt calculation and status tracking
- Payment progress visualization

### Application Fee Management
- Bulk application fee payments
- Individual fee tracking per university
- Payment modal with student selection
- Telegram notifications for payments

### Student List
- Searchable and filterable student database
- Inline editing capabilities
- Copy-to-clipboard functionality
- Pagination support (30 rows per page)

### Activity Logging
- Complete audit trail
- User action tracking
- Payment activity logs
- Student modification history

## 🚀 Deployment to Vercel

1. **Connect to Vercel**
   - Push your code to GitHub
   - Import project in [Vercel Dashboard](https://vercel.com/dashboard)

2. **Automatic Deployment**
   - Vercel will automatically detect the static site
   - Configuration is handled by `vercel.json`

3. **Environment Variables** (if needed)
   - Add any sensitive configurations in Vercel dashboard
   - Access via Environment Variables section

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Dark Mode**: Toggle between light and dark themes
- **Animations**: Smooth transitions and micro-interactions
- **Toast Notifications**: User-friendly feedback system
- **Loading States**: Clear loading indicators
- **Error Handling**: Graceful error management

## 🔒 Security Features

- **Input Validation**: Client-side and Firebase security rules
- **Data Sanitization**: XSS protection
- **Audit Logging**: Complete activity tracking
- **Role-based Access**: Admin functionality protection

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Firebase      │    │   Telegram      │
│   (HTML/JS)     │◄──►│   Firestore     │    │   Bot API       │
│                 │    │                 │    │                 │
│ • Registration  │    │ • Data Storage  │    │ • Notifications │
│ • Payments      │    │ • Real-time     │    │ • Alerts        │
│ • Student List  │    │ • Security      │    │ • Status Updates│
│ • App Fees      │    │ • Backup        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📈 Performance

- **Optimized Loading**: Lazy loading and code splitting
- **Caching**: Efficient caching strategies
- **Pagination**: 30 rows per page for optimal performance
- **Debounced Search**: Optimized search functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support and questions:
- 📧 Email: support@uniapp.com
- 💬 Telegram: [@UniAppSupport](https://t.me/UniAppSupport)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/uniapp/issues)

## 🔄 Changelog

### v1.0.0
- Initial release
- Student registration system
- Payment tracking
- Application fee management
- Telegram notifications
- Dark mode support
- Mobile responsiveness

---

Made with ❤️ by the UniApp Team 