#!/usr/bin/env node

/**
 * Update existing UML diagram with current class members while preserving layout
 *
 * This script updates class properties and methods in an existing .dia file
 * without overwriting manually adjusted positions and routing.
 *
 * Usage:
 *   node update-diagram.js --config <path>
 *   node update-diagram.js --config configs/xiview-config.js
 */

const fs = require("fs");
const path = require("path");
const { parseStringPromise } = require("xml2js");
const { analyzeDirectory, detectRelationships } = require("./js-analyzer");
const { generateDiagram } = require("./dia-generator");
const { create } = require("xmlbuilder2");

/**
 * Parse command-line arguments
 * @returns {object} Parsed arguments
 */
function parseArguments() {
    const args = { config: null };

    for (let i = 2; i < process.argv.length; i++) {
        const arg = process.argv[i];
        const nextArg = process.argv[i + 1];

        if (arg === "--config" && nextArg) {
            args.config = nextArg;
            i++;
        }
    }

    return args;
}

/**
 * Parse existing .dia file and extract class data, positions and routing
 * @param {string} diaFilePath - Path to existing .dia file
 * @returns {object} { classes: {className: classMetadata}, positions: {className: {x, y, width, height}}, relationships: [...] }
 */
async function parseExistingDiagram(diaFilePath) {
    if (!fs.existsSync(diaFilePath)) {
        console.log(`   No existing diagram found at ${diaFilePath}`);
        return null;
    }

    const xmlContent = fs.readFileSync(diaFilePath, "utf-8");
    const parsed = await parseStringPromise(xmlContent);

    const positions = {};
    const existingClasses = {};
    const existingRelationships = [];

    // Extract class objects
    const layer = parsed["dia:diagram"]["dia:layer"][0];
    const objects = layer["dia:object"] || [];

    objects.forEach(obj => {
        const objType = obj.$.type;

        if (objType === "UML - Class") {
            // Extract class name
            const nameAttr = obj["dia:attribute"].find(attr => attr.$.name === "name");
            if (!nameAttr) return;

            const className = nameAttr["dia:string"][0].replace(/^#|#$/g, "");

            // Extract position
            const posAttr = obj["dia:attribute"].find(attr => attr.$.name === "elem_corner");
            const widthAttr = obj["dia:attribute"].find(attr => attr.$.name === "elem_width");
            const heightAttr = obj["dia:attribute"].find(attr => attr.$.name === "elem_height");

            if (posAttr && widthAttr && heightAttr) {
                const posVal = posAttr["dia:point"][0].$.val.split(",");
                positions[className] = {
                    x: parseFloat(posVal[0]),
                    y: parseFloat(posVal[1]),
                    width: parseFloat(widthAttr["dia:real"][0].$.val),
                    height: parseFloat(heightAttr["dia:real"][0].$.val),
                };
            }

            // Extract properties and methods (for preserving deleted classes)
            const properties = [];
            const methods = [];

            const attributesAttr = obj["dia:attribute"].find(attr => attr.$.name === "attributes");
            if (attributesAttr && attributesAttr["dia:composite"]) {
                attributesAttr["dia:composite"].forEach(comp => {
                    const nameAttr = comp["dia:attribute"]?.find(a => a.$.name === "name");
                    if (nameAttr) {
                        const propName = nameAttr["dia:string"][0].replace(/^#|#$/g, "");
                        properties.push({ name: propName, type: "unknown", visibility: "public" });
                    }
                });
            }

            const operationsAttr = obj["dia:attribute"].find(attr => attr.$.name === "operations");
            if (operationsAttr && operationsAttr["dia:composite"]) {
                operationsAttr["dia:composite"].forEach(comp => {
                    const nameAttr = comp["dia:attribute"]?.find(a => a.$.name === "name");
                    if (nameAttr) {
                        const methodName = nameAttr["dia:string"][0].replace(/^#|#$/g, "");
                        methods.push({ name: methodName, visibility: "public", params: 0 });
                    }
                });
            }

            // Store class metadata
            existingClasses[className] = {
                name: className,
                filename: className,
                properties,
                methods,
                superClass: null,
            };
        } else if (objType === "UML - Association" || objType === "UML - Generalization") {
            // Extract relationship routing
            const orthPointsAttr = obj["dia:attribute"].find(attr => attr.$.name === "orth_points");
            const orthOrientAttr = obj["dia:attribute"].find(attr => attr.$.name === "orth_orient");
            const connections = obj["dia:connections"];

            if (orthPointsAttr && orthOrientAttr && connections) {
                const points = orthPointsAttr["dia:point"].map(p => {
                    const vals = p.$.val.split(",");
                    return { x: parseFloat(vals[0]), y: parseFloat(vals[1]) };
                });

                const orientations = orthOrientAttr["dia:enum"].map(e => parseInt(e.$.val));

                const conns = connections[0]["dia:connection"] || [];
                const fromConn = conns.find(c => c.$.handle === "0");
                const toConn = conns.find(c => c.$.handle === "1");

                existingRelationships.push({
                    type: objType,
                    id: obj.$.id,
                    points,
                    orientations,
                    fromConnection: fromConn ? { to: fromConn.$.to, connection: fromConn.$.connection } : null,
                    toConnection: toConn ? { to: toConn.$.to, connection: toConn.$.connection } : null,
                });
            }
        }
    });

    return { classes: existingClasses, positions, relationships: existingRelationships };
}

/**
 * Main execution function
 */
async function main() {
    console.log("\n" + "=".repeat(60));
    console.log("  Diagram Update Tool (Preserve Layout)");
    console.log("=".repeat(60) + "\n");

    try {
        // Parse arguments
        const cliArgs = parseArguments();

        if (!cliArgs.config) {
            console.error("Error: --config argument is required");
            console.log("Usage: node update-diagram.js --config <path>");
            process.exit(1);
        }

        // Load configuration
        const configPath = path.resolve(cliArgs.config);
        if (!fs.existsSync(configPath)) {
            throw new Error(`Config file not found: ${configPath}`);
        }

        const config = require(configPath);
        console.log(`✓ Loaded configuration from: ${configPath}\n`);

        // Step 1: Parse existing diagram
        console.log("[1/4] Parsing existing diagram...");
        const existing = await parseExistingDiagram(config.outputFile);

        if (existing) {
            console.log(`      Found ${Object.keys(existing.positions).length} existing classes`);
            console.log(`      Found ${existing.relationships.length} existing relationships\n`);
        } else {
            console.log("      No existing diagram - will create new one\n");
        }

        // Step 2: Analyze current source code
        console.log(`[2/4] Analyzing source directory: ${config.sourceDir}`);

        if (!fs.existsSync(config.sourceDir)) {
            throw new Error(`Source directory not found: ${config.sourceDir}`);
        }

        const classes = analyzeDirectory(config.sourceDir, config);
        console.log(`      Found ${classes.length} classes in source code\n`);

        if (classes.length === 0) {
            console.warn("⚠ Warning: No classes found in source directory");
            process.exit(0);
        }

        // Step 3: Merge classes and positions from existing diagram
        console.log("[3/4] Merging layout and preserving deleted classes...");

        if (existing) {
            // Build class name sets for comparison
            const currentClassNames = new Set(classes.map(c => c.name));
            const existingClassNames = Object.keys(existing.classes);

            // Preserve classes that exist in diagram but not in source (deleted from source)
            const deletedClasses = [];
            existingClassNames.forEach(className => {
                if (!currentClassNames.has(className)) {
                    // Preserve deleted class with its old data
                    classes.push(existing.classes[className]);
                    config.layout.positions[className] = existing.positions[className];
                    deletedClasses.push(className);
                }
            });

            if (deletedClasses.length > 0) {
                console.log(`      Preserved ${deletedClasses.length} deleted classes (no longer in source)`);
            }

            // Copy existing positions to config for current classes
            classes.forEach(cls => {
                if (existing.positions[cls.name]) {
                    config.layout.positions[cls.name] = existing.positions[cls.name];
                }
            });

            // Identify new classes
            const newClasses = classes.filter(c => !existing.positions[c.name]);
            if (newClasses.length > 0) {
                console.log(`      Found ${newClasses.length} new classes (will auto-layout)`);
            }

            console.log(`      Preserved ${Object.keys(config.layout.positions).length} class positions\n`);
        } else {
            console.log("      No existing positions to merge\n");
        }

        // Step 4: Detect relationships
        console.log("[4/4] Detecting relationships...");
        const relationships = detectRelationships(classes, config);
        console.log(`      Found ${relationships.length} relationships`);

        if (relationships.length > 0) {
            const inheritanceCount = relationships.filter(r => r.type === "inheritance").length;
            const compositionCount = relationships.filter(r => r.type === "composition").length;
            console.log(`      - Inheritance: ${inheritanceCount}`);
            console.log(`      - Composition: ${compositionCount}`);
        }
        console.log();

        // Generate updated diagram
        console.log("Generating updated diagram...");
        const diagramXml = generateDiagram(classes, relationships, config);

        // Write to file
        fs.writeFileSync(config.outputFile, diagramXml);
        console.log(`      ✓ Updated diagram saved to: ${config.outputFile}\n`);

        console.log("=".repeat(60));
        console.log("✓ Diagram update completed successfully!");
        console.log(`  Output: ${config.outputFile}`);
        console.log(`  Classes: ${classes.length}`);
        console.log(`  Relationships: ${relationships.length}`);
        console.log(`  Positions preserved: ${Object.keys(config.layout.positions).length}`);
        console.log("=".repeat(60) + "\n");

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        if (error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { parseExistingDiagram };
