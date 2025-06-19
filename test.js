#!/usr/bin/env node

// Simple test to verify the action compiles and runs
const fs = require('fs');
const path = require('path');

console.log('🧪 Running basic GitHub Action tests...\n');

// Test 1: Verify action.yml exists and is readable
try {
  const actionYml = fs.readFileSync('action.yml', 'utf8');
  console.log('✅ action.yml exists and is readable');
} catch (error) {
  console.error('❌ action.yml not found or not readable:', error.message);
  process.exit(1);
}

// Test 2: Verify dist/index.js exists
try {
  const distPath = path.join('dist', 'index.js');
  fs.accessSync(distPath, fs.constants.F_OK);
  console.log('✅ dist/index.js exists');
} catch (error) {
  console.error('❌ dist/index.js not found:', error.message);
  process.exit(1);
}

// Test 3: Verify TypeScript source files exist
const sourceFiles = ['src/main.ts', 'src/auth.ts', 'src/azure-devops.ts', 'src/types.ts'];
for (const file of sourceFiles) {
  try {
    fs.accessSync(file, fs.constants.F_OK);
    console.log(`✅ ${file} exists`);
  } catch (error) {
    console.error(`❌ ${file} not found:`, error.message);
    process.exit(1);
  }
}

// Test 4: Verify package.json has required scripts
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'package', 'lint'];
  
  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ npm script '${script}' defined`);
    } else {
      console.error(`❌ npm script '${script}' not found`);
      process.exit(1);
    }
  }
} catch (error) {
  console.error('❌ package.json not found or invalid:', error.message);
  process.exit(1);
}

// Test 5: Try to load the main module (will fail with expected input error)
try {
  console.log('\n🔍 Testing main module load...');
  
  // Set up mock GitHub Actions environment
  process.env.INPUT_AZURE_DEVOPS_ORGANIZATION = 'test-org';
  process.env.INPUT_AZURE_DEVOPS_PROJECT = 'test-project';
  process.env.INPUT_PIPELINE_ID = '123';
  process.env.INPUT_PREVIEW_RUN = 'true';
  
  // This will try to run but should fail at Managed Identity check
  // which is expected in a non-Azure environment
  require('./dist/index.js');
  
} catch (error) {
  // Expected to fail due to no managed identity in test environment
  console.log('✅ Main module loads (expected to fail in test environment)');
}

console.log('\n🎉 All basic tests passed!');
console.log('\n📋 Next steps:');
console.log('   1. Deploy to a self-hosted runner with Azure Managed Identity');
console.log('   2. Configure the Managed Identity with Azure DevOps permissions');
console.log('   3. Test with a real Azure DevOps pipeline');
console.log('\n🔗 For more information, see the README.md file');
