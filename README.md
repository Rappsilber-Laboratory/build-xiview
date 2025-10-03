# xiVIEW Build Container

xiVIEW is a web-based visualization tool for cross-linking mass spectrometry data developed by the Rappsilber Laboratory. This container repository uses git submodules to organize multiple JavaScript subprojects into a unified build system.

## Project Architecture

This repository brings together four main components:

- **[xiview/](xiview/)** - Main application with UI components, views, and application logic
- **[CLMS-model/](CLMS-model/)** - Core data model for cross-linking mass spectrometry data
- **[crosslink-viewer/](crosslink-viewer/)** - xiNET crosslink network visualization component
- **[spectrum/](spectrum/)** - xiSPEC spectrum viewer component

The entry point is `xiview/js/promises-load.js` which orchestrates loading CSS, initializing the spinner, importing core modules, and handling data fetching.

## Quick Start

### Initial Setup

Clone with submodules:
```bash
git clone --recurse-submodules https://github.com/Rappsilber-Laboratory/build_xiVIEW.git
cd build_xiVIEW
```

Install dependencies:
```bash
npm install
```

### Development Build

```bash
npm run build-dev
```

### Production Build

```bash
npm run build-prod
```

## Available Commands

### Build Commands
```bash
# Development build
npm run build-dev

# Production build
npm run build-prod

```

### Code Quality & Testing
```bash
# Run ESLint
npm run lint

# Run automated tests (builds first, then tests)
npm test

# Run tests without building (requires prior build)
npm run test-headless
```

### Testing Infrastructure

xiVIEW includes comprehensive automated testing using QUnit and Puppeteer:

- **Test Location**: `xiview/tests/` directory
- **Test Files**: `qunit.html`, `qunit2.html` (browser), `tests.js`, `tests2.js` (logic)
- **Test Data**: JSON test datasets (`10003.json`, `15884.json`, `blosums.json`)
- **Execution**: Headless browser testing via Puppeteer with local HTTP server
- **Coverage**: 67 tests covering data parsing, filtering, selection, scoring, alignment, distance calculations, and CSV export

The test runner automatically:
1. Starts a local HTTP server to serve test files
2. Launches headless Chrome to execute QUnit tests
3. Reports detailed results with pass/fail counts and timing

**Commands**:
- `npm test`: Builds project then runs headless tests (safe for clean runs)
- `npm run test-headless`: Runs tests directly (assumes project already built)

## Submodule Management

### Updating Submodules

Update all submodules to latest:
```bash
git submodule update --remote
```

Update specific submodule:
```bash
git submodule update --remote xiview
```

## Build System

- **Webpack**: Separate development and production configurations
- **Entry Point**: `xiview/js/promises-load.js`
- **Output**: Builds to `dist/xiview.js` as UMD library
- **Babel**: ES2018 with preset-env for browser compatibility
- **ESLint**: Unix line endings, semicolons required, 4-space indentation

## Development Workflow

1. Clone with submodules
2. Install dependencies (`npm install`)
3. Make changes in relevant submodule
4. Build (`npm run build-dev`)
5. Test in browser
6. Commit changes in submodule first, then container

### Development Setup

Current branches for development:
- **build-xiview**: `v2`
- **xiview**: `v2`
- **CLMS-model**: `v2`
- **spectrum**: `dev`
- **crosslink-viewer**: `master`

Make sure you're working on the correct branch in each submodule:
```bash
cd xiview && git checkout v2
cd ../CLMS-model && git checkout v2
cd ../spectrum && git checkout dev
cd ../crosslink-viewer && git checkout master
```

## Key Dependencies

- **d3** (~3.5.17) - Data visualization (note: intentionally staying on v3)
- **backbone** (~1.6.0) - MVC framework
- **jquery** (~3.7.1) - DOM manipulation
- **ngl** (~2.3.1) - 3D molecular visualization
- **datatables.net** - Data table components
- **split.js** - UI panel splitting

## Troubleshooting

### Submodule Issues

If submodules appear empty:
```bash
git submodule init
git submodule update
```

### Build Failures

1. Check node version compatibility
2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Ensure all submodules are properly initialized
