# How to Create Test Student for Visa Status Testing

## Purpose

This guide helps you create a test student to verify that the Visa Status Manual Move feature works correctly.

## Method 1: Create Test Student via UI

### Step 1: Add New Student

1. Go to **Students** page
2. Click **"Add New Student"** button
3. Fill in the following information:

#### Required Fields

- **Full Name (English)**: `TEST STUDENT VISA CHECK`
- **Passport Number**: `TEST123456`
- **Birthday**: `01.01.2000` (or any date in format DD.MM.YYYY)
- **Education Level**: Select `Bachelor` (NOT Masters)
- **Gender**: Any
- **Phone**: Any number (e.g., `998901234567`)

#### Optional Fields

- You can fill in other fields or leave them empty
- Make sure **Education Level is NOT Masters** (Masters students are excluded from visa checking)

### Step 2: Save Student

1. Click **"Add Student"** button
2. Student will be saved to Firestore

### Step 3: Navigate to Visa Status Tab

1. Go to **Visa Status Tracker** tab
2. You should see your test student in the **"Students"** list on the left

## Method 2: Use Existing Student

If you already have students in your system:

1. Go to **Visa Status Tracker** tab
2. Look at the **"Students"** list (left panel in Processing tab)
3. Choose any student that:
   - Is NOT Masters level
   - Does NOT already have a visa status
   - Has valid Passport, Name, and Birthday

## Testing Workflow

### Test 1: Check Initial Status

1. In **Visa Status Tracker** → **Processing** tab → **Students** panel
2. Find your test student: `TEST STUDENT VISA CHECK`
3. Click the **"Check"** button (blue button on the right)
4. **Expected Result**:
   - Button shows loading spinner
   - After ~5 seconds, status appears
   - If status is not UNKNOWN, student moves to appropriate tab
   - If status is UNKNOWN, student stays in Students list with "UNKNOWN - Recheck" badge

### Test 2: Simulate Status Change

Since we need to test the status change feature, we need a student that is already in App/Received tab:

#### Option A: Wait for Real Status

1. If your test student got **APP/RECEIVED** status, great!
2. Wait a few days or weeks
3. Click the recheck button (🔄) periodically
4. When status changes to APPROVED, you'll see the move button appear

#### Option B: Use Real Student

1. Find a student who actually has **APP/RECEIVED** status
2. This student's visa might eventually get approved
3. Recheck their status periodically

### Test 3: Verify Manual Move Feature

Once you have a student whose status changed:

1. **Before Recheck**:

   ```
   Student card shows: APP/RECEIVED
   Located in: App/Received tab
   ```

2. **Click Recheck Button** (🔄)

3. **If Status Changed** (e.g., to APPROVED):

   ```
   ✅ Status badge shows: "APPROVED → New!"
   ✅ Status badge pulses (animation)
   ✅ Green arrow button appears (➡️)
   ✅ Student stays in App/Received tab (NOT moved yet)
   ```

4. **Click Green Arrow Button** (➡️)

5. **Expected Result**:

   ```
   ✅ Card moves to Approved tab
   ✅ Tab automatically switches to Approved
   ✅ Notification: "Student moved to Approved tab!"
   ✅ Student disappears from App/Received
   ✅ Student appears in Approved tab
   ```

### Test 4: Verify Different Status Changes

| Current Status | New Status | Button Color | Target Tab |
|---------------|-----------|--------------|-----------|
| APP/RECEIVED | APPROVED | 🟢 Green | Approved |
| APP/RECEIVED | CANCELLED | 🔴 Red | Cancelled |
| APP/RECEIVED | UNDER REVIEW | 🟡 Yellow | App/Received |
| ANY STATUS | UNKNOWN | ⚪ Gray | Students |

## Expected Behavior Summary

### ✅ Correct Behavior

1. Status changes are detected
2. Move button appears with correct color
3. Status badge shows "→ New!" indicator
4. Badge and button pulse to draw attention
5. Student stays in current tab until you click move button
6. Clicking move button saves status and moves card
7. Tab automatically switches to show moved card

### ❌ Incorrect Behavior (OLD)

1. ~~Student automatically moves when status changes~~
2. ~~No visual indicator of status change~~
3. ~~No control over when to move~~
4. ~~Tab doesn't switch automatically~~

## Troubleshooting

### Student Not Appearing in Students List

**Possible Causes**:

- Student is Masters level (Masters students are excluded)
- Student already has a visa status
- Student is deleted (`isDeleted: true`)

**Solution**:

- Check student's education level
- Check Firestore `visaStatus` collection for this student
- Verify student is not deleted

### Recheck Button Shows "Missing required data"

**Problem**: Student is missing passport, name, or birthday

**Solution**:

1. Go to Students page
2. Edit the student
3. Fill in missing fields
4. Save changes

### API Returns UNKNOWN Status

**This is normal!**

- The visa status API might not have data for test/fake passport numbers
- This is actually useful for testing the UNKNOWN status flow
- You can test the gray move button that moves student back to Students tab

### Status Doesn't Change

**Problem**: Real visa statuses don't change frequently

**Solution**:

- Use students who are actively in the visa process
- Check every few days
- Or wait for real status changes in your production data

## Mock Data for Testing (Optional)

If you want to test without API calls, you can temporarily modify the code:

### Temporary Test Code (Add to `checkSingleStudentVisa` function)

```javascript
// FOR TESTING ONLY - Add after line 3968
// Simulate a status change
if (student.passport === 'TEST123456') {
    // Simulate changed status
    const fakeStatuses = ['APPROVED', 'CANCELLED', 'UNKNOWN', 'UNDER REVIEW'];
    const randomStatus = fakeStatuses[Math.floor(Math.random() * fakeStatuses.length)];
    
    const visaResult = {
        status: randomStatus,
        message: 'Test simulation',
        applicationDate: '26.01.2026'
    };
    
    // Continue with normal flow...
}
```

**⚠️ IMPORTANT**: Remember to remove this test code after testing!

## Clean Up After Testing

1. Delete test student from Students page (or mark as deleted)
2. Remove visa status from Firestore (use the ❌ delete button in visa tracker)
3. This keeps your data clean

## Questions?

If you encounter issues:

1. Check browser console for errors (F12)
2. Verify Firestore connection
3. Check that all modified files are saved
4. Clear browser cache and reload
