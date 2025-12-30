#!/usr/bin/env node

/**
 * Database Connection Verification Script
 * Run this after setting up the database to verify everything is connected
 */

console.log('\n🔍 Verifying Database Connection...\n');

// Check if .env file exists and has required variables
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'Frontend', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found in Frontend directory!');
  console.log('\n📝 Create a .env file with:');
  console.log('   VITE_SUPABASE_URL=your_supabase_url');
  console.log('   VITE_SUPABASE_ANON_KEY=your_anon_key\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const hasUrl = envContent.includes('VITE_SUPABASE_URL=');
const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=');

console.log('📁 Checking Frontend/.env file:');
console.log(hasUrl ? '  ✅ VITE_SUPABASE_URL found' : '  ❌ VITE_SUPABASE_URL missing');
console.log(hasKey ? '  ✅ VITE_SUPABASE_ANON_KEY found' : '  ❌ VITE_SUPABASE_ANON_KEY missing');

if (!hasUrl || !hasKey) {
  console.error('\n❌ Missing Supabase credentials in .env file!\n');
  process.exit(1);
}

// Check if required database files exist
console.log('\n📊 Checking Database Files:');

const dbFiles = [
  'database/setup_admin_modules.sql',
  'database/verify_setup.sql',
  'database/advanced_features.sql'
];

let allFilesExist = true;
dbFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (missing)`);
    allFilesExist = false;
  }
});

// Check if admin service files exist
console.log('\n🔧 Checking Service Files:');

const serviceFiles = [
  'Frontend/src/services/adminService.js',
  'Frontend/src/supabase.js'
];

serviceFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (missing)`);
    allFilesExist = false;
  }
});

// Check if admin components exist
console.log('\n🎨 Checking Admin Components:');

const componentFiles = [
  'Frontend/src/Pages/Admin/SuperAdmin/RegistrationManagement.jsx',
  'Frontend/src/Pages/Admin/SuperAdmin/FinanceModule.jsx',
  'Frontend/src/Pages/Admin/SuperAdmin/ParticipantCRM.jsx',
  'Frontend/src/Pages/Admin/SuperAdmin/WaitlistManagement.jsx'
];

componentFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file.split('/').pop()}`);
  } else {
    console.log(`  ❌ ${file.split('/').pop()} (missing)`);
    allFilesExist = false;
  }
});

// Final status
console.log('\n' + '='.repeat(60));
if (allFilesExist && hasUrl && hasKey) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Open Supabase Dashboard');
  console.log('   2. Go to SQL Editor');
  console.log('   3. Run: database/setup_admin_modules.sql');
  console.log('   4. Run: database/verify_setup.sql');
  console.log('   5. Make a user super_admin (see DATABASE_SETUP.md)');
  console.log('   6. Start frontend: cd Frontend && npm run dev');
  console.log('   7. Login and go to /admin');
  console.log('\n📖 See DATABASE_SETUP.md for detailed instructions');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('\n   Please fix the issues above before proceeding.');
  console.log('   Refer to SETUP_GUIDE.md for help.');
}
console.log('='.repeat(60) + '\n');
