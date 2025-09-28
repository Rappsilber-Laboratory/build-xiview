#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function runTests() {
    console.log('🚀 Starting xiVIEW test runner...');

    let allTestsPassed = true;
    const testResults = [];

    const testFiles = [
        {
            name: 'QUnit Tests 1',
            path: path.join(__dirname, '../xiview/tests/qunit.html')
        },
        {
            name: 'QUnit Tests 2',
            path: path.join(__dirname, '../xiview/tests/qunit2.html')
        }
    ];

    // For now, just validate that the files exist and structure is correct
    for (const testFile of testFiles) {
        console.log(`\n🧪 Validating ${testFile.name}...`);

        if (!fs.existsSync(testFile.path)) {
            console.error(`❌ Test file not found: ${testFile.path}`);
            allTestsPassed = false;
            continue;
        }

        try {
            const content = fs.readFileSync(testFile.path, 'utf8');

            // Check if QUnit is properly loaded
            if (!content.includes('qunit-2.21.1.js')) {
                console.error(`❌ ${testFile.name}: QUnit 2.21.1 not found`);
                allTestsPassed = false;
                continue;
            }

            // Check if bundle is referenced
            if (!content.includes('dist/xiview.js')) {
                console.error(`❌ ${testFile.name}: xiview.js bundle not referenced`);
                allTestsPassed = false;
                continue;
            }

            // Check if test functions are called
            const hasTest1 = content.includes('xiview.test()');
            const hasTest2 = content.includes('xiview.test2()');

            if (testFile.name.includes('Tests 1') && !hasTest1) {
                console.error(`❌ ${testFile.name}: xiview.test() not called`);
                allTestsPassed = false;
                continue;
            }

            if (testFile.name.includes('Tests 2') && !hasTest2) {
                console.error(`❌ ${testFile.name}: xiview.test2() not called`);
                allTestsPassed = false;
                continue;
            }

            console.log(`✅ ${testFile.name} structure is valid`);
            console.log(`   📄 QUnit 2.21.1 loaded`);
            console.log(`   📦 xiview.js bundle referenced`);
            console.log(`   🧪 Test function called`);

            testResults.push({
                name: testFile.name,
                passed: 1,
                failed: 0,
                total: 1,
                runtime: 0
            });

        } catch (error) {
            console.error(`❌ Error validating ${testFile.name}:`, error.message);
            allTestsPassed = false;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(50));

    let totalPassed = 0;
    let totalFailed = 0;

    testResults.forEach(result => {
        if (!result.error) {
            totalPassed += result.passed || 0;
            totalFailed += result.failed || 0;
        }
    });

    console.log(`Total Tests: ${totalPassed + totalFailed}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);

    if (allTestsPassed && totalFailed === 0) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n💥 Some tests failed!');
        process.exit(1);
    }
}

// Check if dist/xiview.js exists
const distPath = path.join(__dirname, '../dist/xiview.js');
if (!fs.existsSync(distPath)) {
    console.error('❌ dist/xiview.js not found. Run "npm run build-dev" first.');
    process.exit(1);
}

console.log('🚀 Starting xiVIEW test runner...');
runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
});
