# 🔧 Google Sheets Integration Troubleshooting Guide

## ❌ Error: "Sheet validation failed: Failed to initialize"

This error indicates that the Google Sheets integration cannot connect to your Google Apps Script. Here's how to fix it:

## 🔍 Step-by-Step Diagnosis

### 1. **Check Your Apps Script Deployment**

The most common cause is incorrect Apps Script deployment. Follow these steps:

1. **Open Google Apps Script**: Go to [script.google.com](https://script.google.com)
2. **Find your project**: Look for the UniApp project you created
3. **Check the code**: Make sure you have the complete `google-apps-script.gs` code
4. **Verify SPREADSHEET_ID**: Ensure the `SPREADSHEET_ID` constant matches your actual spreadsheet ID

### 2. **Redeploy as Web App**

This is the most critical step:

1. **Click "Deploy"** → **"New deployment"**
2. **Choose type**: Select "Web app"
3. **Execute as**: Select "Me" (your Google account)
4. **Who has access**: **IMPORTANT**: Select "Anyone" (not "Anyone with Google account")
5. **Click "Deploy"**
6. **Copy the web app URL**: It should look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### 3. **Update Your Configuration**

1. **Open `config.js`** in your UniApp project
2. **Replace the APPS_SCRIPT_URL** with your new web app URL:
   ```javascript
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_NEW_URL/exec'
   ```

### 4. **Test the Connection**

Use the debugging tools I've created:

1. **Open `test-apps-script-direct.html`** in your browser
2. **Paste your Apps Script URL**
3. **Click "Test Connection"**
4. **Check the results**

## 🧪 Quick Test Methods

### Method 1: Direct URL Test
Open this URL in your browser (replace with your actual URL):
```
https://script.google.com/macros/s/AKfycbxrQGsWCFTWqgqfRYsRlE0JuXuzcMdMep1hlW7GWyEjeEipGeT_0tl1XCoyTrVwqvdRdw/exec?action=test
```

**Expected result**: JSON response like:
```json
{
  "success": true,
  "message": "Connection successful",
  "data": {
    "spreadsheetName": "UniBridge Students",
    "sheets": ["All Data", "Payment"]
  }
}
```

### Method 2: Use Debug Pages
1. **`debug-sheets.html`** - Comprehensive debugging
2. **`test-apps-script-direct.html`** - Direct Apps Script testing
3. **`test-google-sheets.html`** - Full integration testing

## ❌ Common Issues and Solutions

### Issue 1: "Failed to fetch" or CORS errors
**Solution**: 
- Redeploy your Apps Script with "Anyone" access
- Make sure you're using the `/exec` URL, not `/dev`

### Issue 2: "Invalid action specified"
**Solution**: 
- Check that your Apps Script code is complete
- Verify the `doPost` function exists

### Issue 3: "Spreadsheet not found"
**Solution**: 
- Check the `SPREADSHEET_ID` in your Apps Script
- Make sure the spreadsheet exists and is accessible

### Issue 4: HTTP 403/401 errors
**Solution**: 
- Set Apps Script permissions to "Anyone"
- Redeploy after changing permissions

### Issue 5: "Connection successful" but data not writing
**Solution**: 
- Check spreadsheet permissions
- Verify sheet names ("All Data" and "Payment")
- Check for duplicate student IDs

## 🔧 Manual Verification Steps

### 1. Check Apps Script Logs
1. Open your Apps Script project
2. Click "Executions" in the left sidebar
3. Look for recent executions and any errors

### 2. Test Apps Script Functions Manually
1. In Apps Script editor, select `testScript` function
2. Click "Run"
3. Check the logs for any errors

### 3. Verify Spreadsheet Access
1. Open your Google Spreadsheet
2. Check that you have edit permissions
3. Verify the spreadsheet ID in the URL matches your Apps Script

## 📋 Deployment Checklist

Before testing, ensure:

- [ ] Apps Script code is complete and saved
- [ ] `SPREADSHEET_ID` is correct in Apps Script
- [ ] Script is deployed as "Web app"
- [ ] Execution permissions set to "Anyone"
- [ ] Web app URL copied to `config.js`
- [ ] Browser cache cleared
- [ ] No browser extensions blocking requests

## 🆘 If Nothing Works

### Last Resort Steps:

1. **Create a new Apps Script project**:
   - Copy the `google-apps-script.gs` code fresh
   - Update the `SPREADSHEET_ID`
   - Deploy as new web app

2. **Create a new spreadsheet**:
   - Make a copy of your existing spreadsheet
   - Update the `SPREADSHEET_ID` in Apps Script
   - Redeploy

3. **Check browser console**:
   - Open Developer Tools (F12)
   - Look for detailed error messages
   - Check Network tab for failed requests

## 📞 Getting Help

If you're still having issues:

1. **Use the debug pages** to get detailed error information
2. **Check the browser console** for additional error details
3. **Verify each step** in the deployment checklist
4. **Try the manual verification steps**

## 🔗 Useful Links

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Apps Script Web Apps Guide](https://developers.google.com/apps-script/guides/web)

---

**Remember**: The most common issue is incorrect Apps Script deployment permissions. Make sure to set access to "Anyone" and redeploy after any changes! 