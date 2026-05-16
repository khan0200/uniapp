# Admission Menu Update - Round-Based System

## Overview

The Admission menu has been completely redesigned to use a round-based system with education level and university selection.

## New Features

### 1. Education Level Selection

- Dropdown populated dynamically from existing education levels in the system
- Required field

### 2. University Selection  

- Dropdown populates automatically based on selected education level
- Uses the existing university database grouped by education level
- Required field

### 3. Number of Rounds Selector

- Choose from 1, 2, or 3 rounds
- Required field
- Each selection dynamically generates the appropriate number of round sections

### 4. Dynamic Round Date Pickers

Each round contains 4 date fields:

- **Online Application** - Date for online application submission
- **Document Submission** - Date for document submission
- **Interview** - Interview date
- **Announcement** - Result announcement date

**Round Generation:**

- **1 Round** = 4 date pickers for Round 1
- **2 Rounds** = 4 date pickers for Round 1 + 4 date pickers for Round 2 (8 total)
- **3 Rounds** = 4 date pickers for each round (12 total)

## Data Structure

```javascript
{
  educationLevel: string,        // e.g., "BACHELOR"
  universityName: string,        // e.g., "Korea University"
  roundsCount: number,           // 1, 2, or 3
  rounds: [
    {
      roundNumber: 1,
      onlineApplication: "2025-01-15",
      documentSubmission: "2025-01-20",
      interview: "2025-02-01",
      announcement: "2025-02-10"
    },
    // ... more rounds if selected
  ],
  createdAt: timestamp,
  firestoreId: string
}
```

## UI Components

### Card Display

- Shows university name as title
- Badge shows number of rounds (e.g., "2 Rounds")
- Education level displayed with mortarboard icon
- Latest date from all rounds displayed

### Modal Forms

- **Add Modal**: Select education level → university populates → choose rounds → date pickers generate
- **View Modal**: Beautiful display of all round information in organized sections
- **Edit Modal**: Pre-populates all fields including dynamic round sections

## Technical Implementation

### New Functions Added

1. **populateAdmissionEducationLevels()**
   - Populates the education level dropdown from window.levelsData

2. **updateAdmissionUniversities()**
   - Dynamically populates universities based on selected education level
   - Uses getUniversitiesForLevel() function

3. **generateRoundDatePickers()**
   - Dynamically generates round sections with date pickers
   - Creates responsive grid layout for each round

4. **getLatestDate(rounds)**
   - Helper function to find the most recent date across all rounds
   - Used for card display

5. **saveAdmission()** - Updated
   - Collects education level, university, and round count
   - Loops through all rounds to collect date information
   - Saves to Firestore or localStorage

6. **viewAdmissionDetails()** - Updated
   - Displays education level and university
   - Shows all rounds in organized sections
   - Each round shows all 4 dates

7. **editAdmission()** - Updated
   - Populates education level dropdown
   - Triggers university population
   - Generates correct number of round sections
   - Pre-fills all date fields

8. **renderAdmissions()** - Updated
   - Shows rounds count badge instead of admission type
   - Displays education level
   - Shows latest date from all rounds

### Event Listeners

- Modal `show.bs.modal` event populates education levels when opening
- `onchange` events trigger university and round generation

## Firestore Integration

All functions are compatible with:

- `saveAdmissionToFirestore(admissionData)`
- `updateAdmissionInFirestore(firestoreId, admissionData)`
- `deleteAdmissionFromFirestore(firestoreId)`
- LocalStorage fallback for offline functionality

## Modal Updates

- Changed modal size from `modal-lg` to `modal-xl` for better space
- Rounded section containers for each round
- Responsive grid layout (2 columns on tablet+, 1 column on mobile)

## User Experience

1. User clicks "Add Admission"
2. Selects education level from dropdown
3. Universities automatically populate for that level
4. Selects university
5. Chooses number of rounds (1-3)
6. Date picker sections appear dynamically
7. Fills in dates for each round
8. Saves - all data stored in Firestore

## Example Use Cases

### Scenario 1: Single Round

- Education Level: BACHELOR
- University: Korea University
- Rounds: 1
- Dates: Online App (Jan 15), Doc Submit (Jan 20), Interview (Feb 1), Announcement (Feb 10)

### Scenario 2: Two Rounds

- Education Level: MASTERS
- University: Seoul National University
- Rounds: 2
- Round 1: Jan dates
- Round 2: March dates

### Scenario 3: Three Rounds

- Education Level: LANGUAGE COURSE
- University: Yonsei University
- Rounds: 3
- Each round with its own set of 4 dates

## Files Modified

1. **index.html**
   - Updated Add Admission Modal structure
   - Changed modal size to modal-xl
   - Added dynamic rounds container

2. **js/app.js**
   - Added 4 new helper functions
   - Updated all existing admission functions
   - Added modal event listeners
   - Exposed new functions to window

3. **js/firebase-config.js**
   - No changes needed (existing functions handle new data structure)

## Benefits

✅ More organized admission tracking
✅ Supports multiple application rounds
✅ Better data structure for analytics
✅ Dynamic UI that adapts to user selection
✅ Uses existing university database
✅ Consistent with app's design language
✅ Full Firestore integration
✅ Mobile responsive

## Notes

- All dates are optional within rounds (flexibility for partial information)
- Education level and university are required
- Number of rounds is required
- System maintains backwards compatibility (old data won't break)
- Date format displayed: DD.MM.YYYY (e.g., 16.01.2025)
