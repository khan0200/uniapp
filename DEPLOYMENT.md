# 🚀 Deployment Guide - UniApp to Vercel

This guide will walk you through deploying your UniApp to Vercel step by step.

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ All your project files in a local directory
2. ✅ A GitHub account
3. ✅ A Vercel account (free tier available)
4. ✅ Firebase project configured (if using Firebase)
5. ✅ Telegram bot configured (if using notifications)

## 🔧 Pre-Deployment Checklist

### 1. Verify File Structure
Make sure your project has these essential files:
```
uniapp/
├── index.html
├── register.html
├── studentlist.html
├── payments.html
├── appfee.html
├── history.html
├── firebase.js
├── telegram-bot.js
├── telegram-config.js
├── audit-logger.js
├── dark-mode.js
├── vercel.json          ✅ Created
├── package.json         ✅ Created
├── .vercelignore       ✅ Created
├── README.md           ✅ Updated
└── dist/
    └── output.css
```

### 2. Configure Environment Settings

#### Firebase Configuration
Update `firebase.js` with your production Firebase config:
```javascript
const firebaseConfig = {
    apiKey: "your-production-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

#### Telegram Configuration
Update `telegram-config.js` with your bot credentials:
```javascript
window.TELEGRAM_CONFIG = {
    BOT_TOKEN: 'your-production-bot-token',
    CHAT_ID: 'your-production-chat-id',
    NOTIFY_PAYMENTS: true,
    NOTIFY_REGISTRATIONS: true
};
```

### 3. Test Locally
Before deploying, test your application locally:
```bash
# Start local server
python -m http.server 8000

# Test in browser
open http://localhost:8000
```

## 🚀 Deployment Steps

### Step 1: Push to GitHub

1. **Initialize Git Repository** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit - UniApp ready for deployment"
```

2. **Create GitHub Repository**:
   - Go to [GitHub](https://github.com)
   - Click "New Repository"
   - Name it `uniapp` or your preferred name
   - Set it to Public or Private
   - Don't initialize with README (we already have one)

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/yourusername/uniapp.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account

2. **Import Project**:
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your `uniapp` repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (default)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: Leave empty (static site)
   - Click "Deploy"

#### Option B: Using Vercel CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
# Navigate to your project directory
cd path/to/your/uniapp

# Deploy
vercel

# Follow the prompts:
# ? Set up and deploy "~/path/to/uniapp"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Username]
# ? Link to existing project? [y/N] n
# ? What's your project's name? uniapp
# ? In which directory is your code located? ./
```

### Step 3: Configure Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project
   - Click "Settings" → "Domains"
   - Add your custom domain
   - Configure DNS as instructed

2. **DNS Configuration**:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or add A record pointing to Vercel's IP

## 🔧 Post-Deployment Configuration

### 1. Environment Variables (if needed)

If you have sensitive data to configure:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables:
   - `FIREBASE_API_KEY` (if not in code)
   - `TELEGRAM_BOT_TOKEN` (if not in code)
   - Any other sensitive configurations

### 2. Firebase Security Rules

Update your Firestore security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // For public read access (if needed)
    match /register/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Test Deployment

1. **Visit your deployed app**:
   - Vercel will provide a URL like `https://uniapp-xxx.vercel.app`
   - Test all functionality

2. **Check Console for Errors**:
   - Open browser developer tools
   - Look for any console errors
   - Test Firebase connection
   - Test Telegram notifications

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. 404 Errors
**Problem**: Pages return 404 errors
**Solution**: Check `vercel.json` configuration and ensure all HTML files are in the root directory

#### 2. Firebase Connection Issues
**Problem**: "Firebase not initialized" errors
**Solution**: 
- Verify Firebase config in `firebase.js`
- Check if Firebase project is active
- Ensure Firestore is enabled

#### 3. Static Assets Not Loading
**Problem**: CSS/JS files not found
**Solution**: 
- Verify paths in HTML files start with `/` or are relative
- Check if files are in correct directories
- Review `.vercelignore` to ensure assets aren't excluded

#### 4. CORS Issues
**Problem**: Cross-origin request errors
**Solution**: 
- Firebase should handle CORS automatically
- For external APIs, configure CORS headers

## 📊 Monitoring Your Deployment

### 1. Vercel Analytics
- Enable analytics in Vercel dashboard
- Monitor page views and performance
- Track Core Web Vitals

### 2. Firebase Usage
- Monitor Firestore reads/writes
- Check authentication usage
- Review security rule hits

### 3. Performance Monitoring
```javascript
// Add to your HTML for basic performance monitoring
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
});
```

## 🔄 Continuous Deployment

Once set up, any push to your main branch will automatically trigger a new deployment:

```bash
# Make changes to your code
git add .
git commit -m "Update student registration form"
git push origin main
# Vercel automatically deploys the changes
```

## 🎉 Success!

Your UniApp is now live on Vercel! 

**Next Steps:**
1. 📧 Share the URL with your team
2. 🔧 Configure any additional settings
3. 📊 Monitor usage and performance
4. 🚀 Enjoy your deployed application!

**Your app is available at:**
- Production URL: `https://your-app-name.vercel.app`
- Custom domain: `https://your-custom-domain.com` (if configured)

---

Need help? Check the [Vercel Documentation](https://vercel.com/docs) or create an issue in your repository. 