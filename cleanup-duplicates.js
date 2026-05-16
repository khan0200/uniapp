// ==========================================
// FIRESTORE DUPLICATE CLEANUP SCRIPT
// Run this ONCE in the browser console to remove duplicate tariffs, levels, and universities
// ==========================================

async function cleanupDuplicates() {
    if (!window.firebaseInitialized) {
        console.error('❌ Firebase not initialized');
        return;
    }

    const db = firebase.firestore();
    console.log('🔄 Starting duplicate cleanup...');

    try {
        // 1. Clean up duplicate Tariffs
        console.log('🧹 Cleaning tariffs...');
        const tariffsSnapshot = await db.collection('tariffs').get();
        const tariffsMap = new Map();
        const tariffsToDelete = [];

        tariffsSnapshot.forEach(doc => {
            const data = doc.data();
            const key = `${data.name}-${data.price}`;

            if (tariffsMap.has(key)) {
                // Duplicate found - mark for deletion
                tariffsToDelete.push(doc.id);
                console.log(`  ⚠️  Duplicate tariff found: ${data.name} (${doc.id})`);
            } else {
                tariffsMap.set(key, doc.id);
            }
        });

        // Delete duplicate tariffs
        for (const id of tariffsToDelete) {
            await db.collection('tariffs').doc(id).delete();
            console.log(`  ✅ Deleted duplicate tariff: ${id}`);
        }

        // 2. Clean up duplicate Levels
        console.log('🧹 Cleaning education levels...');
        const levelsSnapshot = await db.collection('levels').get();
        const levelsMap = new Map();
        const levelsToDelete = [];

        levelsSnapshot.forEach(doc => {
            const data = doc.data();
            const key = data.name;

            if (levelsMap.has(key)) {
                // Duplicate found - mark for deletion
                levelsToDelete.push(doc.id);
                console.log(`  ⚠️  Duplicate level found: ${data.name} (${doc.id})`);
            } else {
                levelsMap.set(key, doc.id);
            }
        });

        // Delete duplicate levels
        for (const id of levelsToDelete) {
            await db.collection('levels').doc(id).delete();
            console.log(`  ✅ Deleted duplicate level: ${id}`);
        }

        // 3. Clean up duplicate Universities
        console.log('🧹 Cleaning universities...');
        const universitiesSnapshot = await db.collection('universities').get();
        const universitiesMap = new Map();
        const universitiesToDelete = [];

        universitiesSnapshot.forEach(doc => {
            const data = doc.data();
            const key = `${data.name}-${data.levelId}`;

            if (universitiesMap.has(key)) {
                // Duplicate found - mark for deletion
                universitiesToDelete.push(doc.id);
                console.log(`  ⚠️  Duplicate university found: ${data.name} (${doc.id})`);
            } else {
                universitiesMap.set(key, doc.id);
            }
        });

        // Delete duplicate universities
        for (const id of universitiesToDelete) {
            await db.collection('universities').doc(id).delete();
            console.log(`  ✅ Deleted duplicate university: ${id}`);
        }

        console.log('✅ Cleanup complete!');
        console.log(`   - Deleted ${tariffsToDelete.length} duplicate tariffs`);
        console.log(`   - Deleted ${levelsToDelete.length} duplicate levels`);
        console.log(`   - Deleted ${universitiesToDelete.length} duplicate universities`);
        console.log('🔄 Reload the page to see the changes');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

// Run the cleanup
cleanupDuplicates();