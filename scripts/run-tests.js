#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const http = require('http');
const { URL } = require('url');

// Simple HTTP server to serve test files
function createTestServer(port = 8080) {
    const projectRoot = path.resolve(__dirname, '..');

    const server = http.createServer((req, res) => {
        const parsedUrl = new URL(req.url, `http://localhost:${port}`);
        let filePath = path.join(projectRoot, parsedUrl.pathname);

        // Security: prevent directory traversal
        if (!filePath.startsWith(projectRoot)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        // Handle special requests
        if (parsedUrl.pathname === '/favicon.ico') {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        // Check if file exists before trying to stat it
        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        // Default to index.html for directory requests
        if (fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('Not Found');
                } else {
                    res.writeHead(500);
                    res.end('Server Error');
                }
                return;
            }

            // Set appropriate content type
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json'
            };

            res.writeHead(200, {
                'Content-Type': contentTypes[ext] || 'text/plain',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
        });
    });

    return new Promise((resolve, reject) => {
        server.listen(port, (err) => {
            if (err) reject(err);
            else resolve({ server, port });
        });
    });
}

async function runTestInBrowser(testName, testHtmlFile) {
    console.log(`\n🧪 Running ${testName}...`);

    let browser;
    let serverInfo;
    try {
        // Start local HTTP server to serve test files
        console.log(`🌐 Starting local test server...`);
        serverInfo = await createTestServer(8080);
        console.log(`🌐 Test server running on http://localhost:${serverInfo.port}`);

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set up test result collection
        const testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            runtime: 0,
            details: [],
            error: null
        };

        // Listen to console logs from the page
        page.on('console', (msg) => {
            const text = msg.text();
            if (text.includes('✅') || text.includes('❌') || text.includes('📊')) {
                console.log(`  ${text}`);
            }
        });

        // Listen to page errors - but don't fail on expected issues
        page.on('pageerror', (error) => {
            console.warn(`⚠️ Page warning: ${error.message}`);
        });

        // Inject QUnit result collection
        await page.evaluateOnNewDocument(() => {
            window.testResults = {
                passed: 0,
                failed: 0,
                total: 0,
                runtime: 0,
                details: []
            };

            // Override QUnit hooks when available
            const setupQUnit = () => {
                if (window.QUnit && !window.qunitSetup) {
                    window.qunitSetup = true;
                    console.log('🔧 Setting up QUnit hooks...');

                    window.QUnit.testDone((details) => {
                        window.testResults.total++;
                        if (details.failed === 0) {
                            window.testResults.passed++;
                            console.log(`✅ ${details.name} (${details.runtime}ms)`);
                        } else {
                            window.testResults.failed++;
                            console.log(`❌ ${details.name} (${details.runtime}ms)`);
                            details.assertions.forEach(assertion => {
                                if (!assertion.result) {
                                    console.log(`💥 ${assertion.message || 'Assertion failed'}`);
                                }
                            });
                        }
                        window.testResults.details.push(details);
                    });

                    window.QUnit.done((details) => {
                        window.testResults.runtime = details.runtime;
                        console.log(`📊 Tests completed: ${details.total} total, ${details.passed} passed, ${details.failed} failed (${details.runtime}ms)`);
                        window.testsCompleted = true;
                    });
                }
            };

            // Keep trying to set up QUnit
            const checkInterval = setInterval(() => {
                if (window.QUnit && !window.qunitSetup) {
                    setupQUnit();
                }
                if (window.qunitSetup) {
                    clearInterval(checkInterval);
                }
            }, 50);

            // Stop checking after 10 seconds
            setTimeout(() => clearInterval(checkInterval), 10000);
        });

        // Navigate to the test HTML file via HTTP server
        const testUrl = `http://localhost:${serverInfo.port}/${testHtmlFile}`;

        console.log(`🌐 Loading ${testUrl}...`);
        await page.goto(testUrl, { waitUntil: 'networkidle0' });

        // Wait for page to load and check what's available
        await new Promise(resolve => setTimeout(resolve, 3000));

        const debugInfo = await page.evaluate(() => {
            return {
                hasXiview: typeof window.xiview !== 'undefined',
                xiviewKeys: window.xiview ? Object.keys(window.xiview) : [],
                hasXIVIEW_TEST: typeof window.XIVIEW_TEST !== 'undefined',
                xiviewTestKeys: window.XIVIEW_TEST ? Object.keys(window.XIVIEW_TEST) : [],
                hasQUnit: typeof window.QUnit !== 'undefined',
                qunitSetup: window.qunitSetup || false,
                windowKeys: Object.keys(window).filter(k => !k.startsWith('_')).slice(0, 20)
            };
        });

        console.log(`🔍 Debug info:`, JSON.stringify(debugInfo, null, 2));

        if (!debugInfo.hasXIVIEW_TEST) {
            throw new Error('XIVIEW_TEST is not available on window');
        }

        if (!debugInfo.hasQUnit) {
            throw new Error('QUnit is not available on window');
        }

        // Determine which test function to run based on the test file
        const testFunction = testName.includes('Tests 1') ? 'test' : 'test2';

        // Manually trigger the test function
        console.log(`🚀 Triggering XIVIEW_TEST.${testFunction}()...`);
        await page.evaluate((fn) => {
            if (window.XIVIEW_TEST && window.XIVIEW_TEST[fn]) {
                window.XIVIEW_TEST[fn]();
                // Also start QUnit if it's not already started
                if (window.QUnit && !window.QUnit.config.started) {
                    console.log('Starting QUnit...');
                    window.QUnit.start();
                }
            } else {
                throw new Error(`Test function ${fn} not found`);
            }
        }, testFunction);

        // Wait for tests to complete
        console.log(`⏳ Waiting for tests to complete...`);
        await page.waitForFunction(
            () => window.testsCompleted === true,
            { timeout: 30000 }
        );

        // Get the test results
        const results = await page.evaluate(() => window.testResults);

        testResults.passed = results.passed;
        testResults.failed = results.failed;
        testResults.total = results.total;
        testResults.runtime = results.runtime;
        testResults.details = results.details;

        return testResults;

    } catch (error) {
        console.error(`❌ Error running ${testName}:`, error.message);
        return {
            passed: 0,
            failed: 1,
            total: 1,
            runtime: 0,
            error: error.message
        };
    } finally {
        if (browser) {
            await browser.close();
        }
        if (serverInfo && serverInfo.server) {
            console.log(`🔌 Shutting down test server...`);
            serverInfo.server.close();
        }
    }
}

async function runTests() {
    console.log('🚀 Starting xiVIEW headless test runner...');

    const testSuites = [
        { name: 'QUnit Tests 1', htmlFile: 'xiview/tests/qunit.html' },
        { name: 'QUnit Tests 2', htmlFile: 'xiview/tests/qunit2.html' }
    ];

    let allResults = [];
    let allTestsPassed = true;

    for (const suite of testSuites) {
        const result = await runTestInBrowser(suite.name, suite.htmlFile);
        allResults.push({ name: suite.name, ...result });

        if (result.failed > 0 || result.error) {
            allTestsPassed = false;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 FINAL TEST SUMMARY');
    console.log('='.repeat(50));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalRuntime = 0;

    allResults.forEach(result => {
        console.log(`\n${result.name}:`);
        if (result.error) {
            console.log(`  ❌ Error: ${result.error}`);
            totalFailed += 1;
        } else {
            console.log(`  ✅ Passed: ${result.passed}`);
            console.log(`  ❌ Failed: ${result.failed}`);
            console.log(`  ⏱️  Runtime: ${result.runtime}ms`);
            totalPassed += result.passed;
            totalFailed += result.failed;
            totalRuntime += result.runtime;
        }
    });

    console.log('\n' + '='.repeat(30));
    console.log(`📈 TOTALS:`);
    console.log(`   Tests: ${totalPassed + totalFailed}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Runtime: ${totalRuntime}ms`);

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
