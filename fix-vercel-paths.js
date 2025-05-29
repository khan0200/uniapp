// Fix file paths for Vercel deployment
// Run this script if you're still having path issues

const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'index.html',
    'studentlist.html', 
    'payments.html',
    'register.html',
    'history.html',
    'appfee.html',
    'cache-demo.html'
];

function fixPaths(filename) {
    if (!fs.existsSync(filename)) {
        console.log(`⚠️ File ${filename} not found, skipping...`);
        return;
    }
    
    let content = fs.readFileSync(filename, 'utf8');
    
    // Fix CSS paths
    content = content.replace(/href="\.\/dist\/output\.css"/g, 'href="/dist/output.css"');
    content = content.replace(/href="\.\/dark-mode-styles\.css"/g, 'href="/dark-mode-styles.css"');
    content = content.replace(/href="\.\/sizing-fixes\.css"/g, 'href="/sizing-fixes.css"');
    
    // Fix JS paths
    content = content.replace(/src="\.\/dark-mode\.js"/g, 'src="/dark-mode.js"');
    content = content.replace(/src="\.\/audit-logger\.js"/g, 'src="/audit-logger.js"');
    content = content.replace(/src="\.\/config\.js"/g, 'src="/config.js"');
    content = content.replace(/src="\.\/apps-script-integration\.js"/g, 'src="/apps-script-integration.js"');
    
    // Fix module imports
    content = content.replace(/src="firebase\.js"/g, 'src="/firebase.js"');
    content = content.replace(/src="scripts\.js"/g, 'src="/scripts.js"');
    content = content.replace(/src="performance\.js"/g, 'src="/performance.js"');
    content = content.replace(/src="enhanced-cache\.js"/g, 'src="/enhanced-cache.js"');
    
    // Write the fixed content back
    fs.writeFileSync(filename, content);
    console.log(`✅ Fixed paths in ${filename}`);
}

console.log('🔧 Fixing file paths for Vercel deployment...');
console.log('📁 Current directory:', process.cwd());
console.log('');

htmlFiles.forEach(fixPaths);

console.log('');
console.log('✅ All paths fixed! Now you can:');
console.log('1. Commit and push your changes');
console.log('2. Redeploy to Vercel');
console.log('3. Your CSS and JS should load properly!');

module.exports = { fixPaths }; 