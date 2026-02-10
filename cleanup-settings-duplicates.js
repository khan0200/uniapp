/**
 * CLEANUP SCRIPT FOR DUPLICATE SETTINGS
 * Run this script in the browser console to remove duplicate tariffs and levels
 */

async function cleanupDuplicateSettings() {
    console.log('🧹 Starting cleanup of duplicate settings...');
    
    if (!firebase || !firebase.firestore) {
        console.error('❌ Firebase is not initialized');
        return;
    }

    const db = firebase.firestore();
    
    // ===== CLEANUP TARIFFS =====
    console.log('\n📦 Cleaning up Tariffs...');
    const tariffsSnapshot = await db.collection('tariffs').get();
    const tariffsMap = new Map();
    const tariffsDuplicates = [];
    
    tariffsSnapshot.forEach((doc) => {
        const data = doc.data();
        const key = `${data.name}-${data.price}`;
        
        if (tariffsMap.has(key)) {
            // This is a duplicate
            tariffsDuplicates.push(doc.id);
            console.log(`🗑️  Found duplicate tariff: ${data.name} (${formatAmount(data.price)} UZS) - ID: ${doc.id}`);
        } else {
            // First occurrence, keep it
            tariffsMap.set(key, doc.id);
            console.log(`✅ Keeping tariff: ${data.name} (${formatAmount(data.price)} UZS) - ID: ${doc.id}`);
        }
    });
    
    // Delete duplicate tariffs
    if (tariffsDuplicates.length > 0) {
        console.log(`\n🗑️  Deleting ${tariffsDuplicates.length} duplicate tariff(s)...`);
        const batch = db.batch();
        tariffsDuplicates.forEach(id => {
            batch.delete(db.collection('tariffs').doc(id));
        });
        await batch.commit();
        console.log('✅ Duplicate tariffs deleted successfully!');
    } else {
        console.log('✅ No duplicate tariffs found!');
    }
    
    // ===== CLEANUP LEVELS =====
    console.log('\n📦 Cleaning up Education Levels...');
    const levelsSnapshot = await db.collection('levels').get();
    const levelsMap = new Map();
    const levelsDuplicates = [];
    
    levelsSnapshot.forEach((doc) => {
        const data = doc.data();
        const key = data.name;
        
        if (levelsMap.has(key)) {
            // This is a duplicate
            levelsDuplicates.push(doc.id);
            console.log(`🗑️  Found duplicate level: ${data.name} - ID: ${doc.id}`);
        } else {
            // First occurrence, keep it
            levelsMap.set(key, doc.id);
            console.log(`✅ Keeping level: ${data.name} - ID: ${doc.id}`);
        }
    });
    
    // Delete duplicate levels
    if (levelsDuplicates.length > 0) {
        console.log(`\n🗑️  Deleting ${levelsDuplicates.length} duplicate level(s)...`);
        const batch = db.batch();
        levelsDuplicates.forEach(id => {
            batch.delete(db.collection('levels').doc(id));
        });
        await batch.commit();
        console.log('✅ Duplicate levels deleted successfully!');
    } else {
        console.log('✅ No duplicate levels found!');
    }
    
    // ===== CLEANUP GROUPS =====
    console.log('\n📦 Cleaning up Groups...');
    const groupsSnapshot = await db.collection('groups').get();
    const groupsMap = new Map();
    const groupsDuplicates = [];
    
    groupsSnapshot.forEach((doc) => {
        const data = doc.data();
        const key = data.name;
        
        if (groupsMap.has(key)) {
            // This is a duplicate
            groupsDuplicates.push(doc.id);
            console.log(`🗑️  Found duplicate group: ${data.name} - ID: ${doc.id}`);
        } else {
            // First occurrence, keep it
            groupsMap.set(key, doc.id);
            console.log(`✅ Keeping group: ${data.name} - ID: ${doc.id}`);
        }
    });
    
    // Delete duplicate groups
    if (groupsDuplicates.length > 0) {
        console.log(`\n🗑️  Deleting ${groupsDuplicates.length} duplicate group(s)...`);
        const batch = db.batch();
        groupsDuplicates.forEach(id => {
            batch.delete(db.collection('groups').doc(id));
        });
        await batch.commit();
        console.log('✅ Duplicate groups deleted successfully!');
    } else {
        console.log('✅ No duplicate groups found!');
    }
    
    console.log('\n🎉 Cleanup complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Tariffs: ${tariffsMap.size} unique (deleted ${tariffsDuplicates.length} duplicates)`);
    console.log(`   - Levels: ${levelsMap.size} unique (deleted ${levelsDuplicates.length} duplicates)`);
    console.log(`   - Groups: ${groupsMap.size} unique (deleted ${groupsDuplicates.length} duplicates)`);
}

// Helper function to format amounts
function formatAmount(amount) {
    if (!amount && amount !== 0) return '0';
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Export to window for console access
window.cleanupDuplicateSettings = cleanupDuplicateSettings;

console.log(`
╔════════════════════════════════════════════════════════════╗
║   CLEANUP SCRIPT LOADED                                    ║
║                                                            ║
║   Run the following command in console to clean up:       ║
║                                                            ║
║   cleanupDuplicateSettings()                               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
