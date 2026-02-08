#!/usr/bin/env node

/**
 * Pre-deployment check script
 * Kiểm tra project trước khi deploy
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking project for deployment...\n');

let hasErrors = false;
let warnings = 0;

// 1. Check required files
console.log('📁 Checking required files...');
const requiredFiles = [
    'server.js',
    'package.json',
    'package-lock.json',
    '.env.example',
    '.gitignore',
    'README.md'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - MISSING!`);
        hasErrors = true;
    }
});

// 2. Check public directory
console.log('\n📂 Checking public directory...');
const publicFiles = [
    'public/index.html',
    'public/room.html',
    'public/remote.html',
    'public/js/app.js',
    'public/js/room.js',
    'public/js/remote.js',
    'public/css/style.css',
    'public/css/fullscreen.css'
];

publicFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - MISSING!`);
        hasErrors = true;
    }
});

// 3. Check package.json
console.log('\n📦 Checking package.json...');
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    if (pkg.scripts && pkg.scripts.start) {
        console.log('  ✅ Start script exists');
    } else {
        console.log('  ❌ Start script missing!');
        hasErrors = true;
    }

    if (pkg.dependencies) {
        const requiredDeps = ['express', 'socket.io', 'cors', 'dotenv', 'nanoid'];
        requiredDeps.forEach(dep => {
            if (pkg.dependencies[dep]) {
                console.log(`  ✅ ${dep}`);
            } else {
                console.log(`  ❌ ${dep} - MISSING!`);
                hasErrors = true;
            }
        });
    }

    if (pkg.engines && pkg.engines.node) {
        console.log(`  ✅ Node version specified: ${pkg.engines.node}`);
    } else {
        console.log('  ⚠️  Node version not specified (recommended)');
        warnings++;
    }
} catch (error) {
    console.log('  ❌ Error reading package.json:', error.message);
    hasErrors = true;
}

// 4. Check .env
console.log('\n🔐 Checking environment...');
if (fs.existsSync('.env')) {
    console.log('  ⚠️  .env file exists (should NOT be committed!)');
    warnings++;
} else {
    console.log('  ✅ No .env file (good for deployment)');
}

if (fs.existsSync('.env.example')) {
    console.log('  ✅ .env.example exists');
} else {
    console.log('  ⚠️  .env.example missing (recommended)');
    warnings++;
}

// 5. Check .gitignore
console.log('\n🚫 Checking .gitignore...');
if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    const requiredIgnores = ['node_modules', '.env', '*.log'];

    requiredIgnores.forEach(pattern => {
        if (gitignore.includes(pattern)) {
            console.log(`  ✅ ${pattern} ignored`);
        } else {
            console.log(`  ⚠️  ${pattern} not ignored`);
            warnings++;
        }
    });
} else {
    console.log('  ❌ .gitignore missing!');
    hasErrors = true;
}

// 6. Check for common issues
console.log('\n🔧 Checking for common issues...');

// Check for hardcoded localhost
const filesToCheck = ['public/js/app.js', 'public/js/room.js', 'public/js/remote.js'];
filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('localhost:3000') || content.includes('127.0.0.1')) {
            console.log(`  ⚠️  ${file} may contain hardcoded localhost`);
            warnings++;
        }
    }
});

// Check server.js for PORT
if (fs.existsSync('server.js')) {
    const serverContent = fs.readFileSync('server.js', 'utf8');
    if (serverContent.includes('process.env.PORT')) {
        console.log('  ✅ Server uses process.env.PORT');
    } else {
        console.log('  ❌ Server does not use process.env.PORT!');
        hasErrors = true;
    }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.log('❌ DEPLOYMENT CHECK FAILED!');
    console.log(`   Found ${hasErrors ? 'errors' : 'no errors'} and ${warnings} warnings`);
    console.log('\n   Please fix the errors before deploying.');
    process.exit(1);
} else if (warnings > 0) {
    console.log('⚠️  DEPLOYMENT CHECK PASSED WITH WARNINGS');
    console.log(`   Found ${warnings} warnings`);
    console.log('\n   You can deploy, but consider fixing the warnings.');
    process.exit(0);
} else {
    console.log('✅ DEPLOYMENT CHECK PASSED!');
    console.log('\n   Your project is ready to deploy! 🚀');
    process.exit(0);
}
