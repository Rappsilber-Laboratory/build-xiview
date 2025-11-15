# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

xiVIEW is a web-based visualization tool for cross-linking mass spectrometry data developed by the Rappsilber Laboratory. The project uses a git submodule architecture to organize multiple JavaScript subprojects into a unified build system.

## Architecture

This is a container repository that uses git submodules to organize four main components:

- **xiview/**: Main application code with UI components, views, and application logic (branch: v2)
- **CLMS-model/**: Core data model for cross-linking mass spectrometry data (branch: v2)
- **crosslink-viewer/**: xiNET crosslink network visualization component (branch: master)
- **spectrum/**: xiSPEC spectrum viewer component (branch: dev)

The entry point is `xiview/js/promises-load.js` which loads CSS, initializes the spinner, imports core modules, and handles data fetching.

Each submodule has its own CLAUDE.md file with component-specific information and development guidance.

Key directories:
- `xiview/js/views/`: UI view components
- `xiview/js/model/`: Application models
- `xiview/js/filter/`: Data filtering logic
- `CLMS-model/src/`: Core data models (CrossLink, Peptide, SearchResultsModel, etc.)

## Development Commands

### Building
```bash
# Development build
npm run build-dev

# Production build
npm run build-prod

# Build and copy to specific deployment targets
npm run build-dev-and-copy-to-pride
npm run build-prod-and-copy-to-xiview_org
npm run build-dev-and-copy-to-xi2
```

### Linting
```bash
npm run lint
```

### Testing
Comprehensive automated testing infrastructure with QUnit and Puppeteer:
```bash
# From build-xiview root
npm test               # Full test suite with build
npm run test-headless  # Headless browser testing (assumes built)
npm run lint           # Code quality checks
```

**Test Infrastructure (Modernized)**:
- **Framework**: QUnit 2.21.1 with Puppeteer headless execution
- **Test Files**: `xiview/tests/qunit.html`, `qunit2.html`, `tests.js`, `tests2.js`
- **Coverage**: 67 comprehensive tests covering core functionality
- **Data Loading**: Local HTTP server resolves JSON loading issues in headless environment
- **CI Integration**: Added to pre-commit hooks for automated validation
- **Result Reporting**: Detailed pass/fail counts with execution timing


## Build System

- **Webpack**: Uses webpack with separate dev/prod configs
- **Entry point**: `xiview/js/promises-load.js`
- **Output**: Builds to `dist/xiview.js` as UMD library
- **Babel**: Configured for ES2018 with preset-env
- **ESLint**: Configured with Unix line endings, semicolons required, 4-space indentation, double quotes

## Dependencies

Key frontend libraries:
- **d3** (~3.5.17): Data visualization
- **backbone** (~1.6.0): MVC framework
- **jquery** (~3.7.1): DOM manipulation
- **ngl** (~2.3.1): 3D molecular visualization
- **datatables.net**: Data table component
- **split.js**: UI panel splitting

## Git Submodules

When cloning, use:
```bash
git clone --recurse-submodules https://github.com/Rappsilber-Laboratory/build_xiVIEW.git
```

The submodules point to separate repositories for each component, allowing independent development while maintaining a unified build process.
#- crosslink and crosslinking are not hyphenated
- we're not updating from d3 v3
- don't try to change anything in node_modules
- no changes, no linting and no checking the formatting of code inside directories named "vendor"
- BEFORE RUNNING ANY BASH COMMAND ALWAYS CHECK THE PRESENT WORKING DIRECTORY AND ADJUST COMMANDS ACCORDINGLY
- DO NOT ADD QUNIT IMPORT TO HTML FILES (its include in the development bundle)
- i'll run the tests
