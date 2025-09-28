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
Tests are located in `xiview/tests/` directory. No specific test runner is configured in package.json - examine the test files to understand the testing approach.

## Test Infrastructure Update Plan

**Current State Issues:**
- QUnit JavaScript is commented out in HTML files, making tests non-functional
- Outdated QUnit version (2.20.0)
- No automated test runner - manual browser testing only
- Missing test infrastructure in submodules (CLMS-model, crosslink-viewer, spectrum)
- Tests depend on built bundle, complicating debugging
- No CI/CD integration

### Phase 1: Fix Immediate Broken Tests (Priority: High)

1. **Restore QUnit Functionality**
   - Uncomment QUnit script in `xiview/tests/qunit.html` and `qunit2.html`
   - Update QUnit to latest stable version (2.21+)
   - Fix test execution to make tests runnable again

2. **Add npm Test Scripts**
   - Add test runner script to main package.json
   - Implement headless browser testing (Puppeteer/Playwright)
   - Create `npm test` command for automated execution

### Phase 2: Modernize Test Framework (Priority: High)

3. **Upgrade Testing Stack**
   - Migrate from browser-based to Node.js test runner
   - Implement Jest or Vitest for better development experience
   - Add test coverage reporting
   - Setup test debugging capabilities

4. **Restructure Test Organization**
   - Separate unit tests from integration tests
   - Create test utilities and helpers
   - Implement proper test data management
   - Add test mocks for external dependencies

### Phase 3: Expand Test Coverage (Priority: Medium)

5. **Component-Level Testing**
   - Add tests for individual modules (views, models, filters)
   - Test webpack build process
   - Add visual regression testing for UI components
   - Test cross-module integration

6. **Submodule Test Implementation**
   - **CLMS-model**: Add unit tests for core data models
   - **crosslink-viewer**: Add tests for network visualization
   - **spectrum**: Add tests for spectrum rendering
   - Coordinate testing across submodule boundaries

### Phase 4: Advanced Testing Features (Priority: Medium)

7. **End-to-End Testing**
   - Implement Cypress or Playwright for E2E tests
   - Test complete user workflows
   - Add performance testing
   - Test data loading and visualization pipelines

8. **Development Workflow Integration**
   - Pre-commit hooks for test execution
   - Watch mode for development
   - Parallel test execution
   - Test result reporting and notifications

### Phase 5: CI/CD and Quality Assurance (Priority: Low)

9. **Continuous Integration**
   - GitHub Actions workflow for automated testing
   - Test matrix across different environments
   - Automated test reporting and badges
   - Integration with code coverage services

10. **Quality Gates**
    - Minimum test coverage requirements
    - Performance regression detection
    - Cross-browser compatibility testing
    - Automated dependency vulnerability scanning

**Implementation Timeline:**
- Quick Wins (1-2 days): Fix QUnit, add npm test command
- Foundation Work (1 week): Modern test runner, restructure organization
- Comprehensive Coverage (2-3 weeks): Component testing, submodule tests, E2E
- Advanced Features (1-2 weeks): CI/CD integration, performance testing
- **Total Estimated Effort**: 4-6 weeks for complete modernization

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
- BEFORE RUNNING ANY BASH COMMAND ALWAYS CHECK THE PRESENT WORKING DIRECTORY AND ENSURE YOU ARE IN THE DIRECTORY YOU BELIEVE YOU ARE IN
