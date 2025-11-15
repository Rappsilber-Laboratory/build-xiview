/**
 * JavaScript class analyzer
 * Parses JavaScript files and extracts class metadata for diagram generation
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("@babel/parser");

/**
 * Determine if a member name is private based on naming convention
 * Convention: Names starting with underscore (_) are considered private
 * @param {string} name - Member name (property or method)
 * @returns {boolean} True if private, false if public
 */
function isPrivateMember(name) {
    return name.startsWith("_");
}

/**
 * Recursively find all JavaScript files in a directory
 * @param {string} dir - Directory to search
 * @param {Array} fileList - Accumulator for file paths
 * @returns {Array} Array of absolute file paths
 */
function findJsFilesRecursive(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Recursively search subdirectories
            findJsFilesRecursive(filePath, fileList);
        } else if (file.endsWith(".js")) {
            // Add JavaScript files
            fileList.push(filePath);
        }
    });

    return fileList;
}

/**
 * Analyze all JavaScript files in a directory (recursively)
 * @param {string} sourceDir - Directory containing JavaScript files
 * @param {object} config - Configuration options
 * @returns {Array} Array of class metadata objects
 */
function analyzeDirectory(sourceDir, config) {
    const classes = [];

    // Recursively find all .js files
    const files = findJsFilesRecursive(sourceDir);

    for (const filePath of files) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const fileName = path.basename(filePath);
        const classInfo = analyzeFile(fileContent, fileName, config);

        if (classInfo) {
            classes.push(...classInfo);
        }
    }

    // Filter based on include/exclude patterns
    return filterClasses(classes, config.classes);
}

/**
 * Parse a single JavaScript file and extract class information
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @param {object} config - Configuration options
 * @returns {Array} Array of class metadata (a file may have multiple classes)
 */
function analyzeFile(content, filename, config) {
    try {
        const ast = parse(content, {
            sourceType: "module",
            plugins: ["classProperties"],
        });

        const classes = [];

        // Traverse AST to find class declarations
        for (const node of ast.program.body) {
            if (node.type === "ExportNamedDeclaration" && node.declaration?.type === "ClassDeclaration") {
                classes.push(extractClassInfo(node.declaration, filename, config));
            } else if (node.type === "ClassDeclaration") {
                classes.push(extractClassInfo(node, filename, config));
            }
        }

        return classes;
    } catch (error) {
        console.error(`Error parsing ${filename}:`, error.message);
        return null;
    }
}

/**
 * Extract class information from a class declaration AST node
 * @param {object} classNode - Babel AST class declaration node
 * @param {string} filename - Source filename
 * @param {object} config - Configuration options
 * @returns {object} Class metadata
 */
function extractClassInfo(classNode, filename, config) {
    const className = classNode.id.name;
    const properties = [];
    const methods = [];

    // Extract constructor properties and methods from class body
    for (const member of classNode.body.body) {
        if (member.type === "ClassMethod") {
            if (member.key.name === "constructor") {
                // Extract properties assigned in constructor
                extractConstructorProperties(member, properties, config.properties);
            } else if (member.kind === "get" && config.properties.includeGetters) {
                // Getter - treat as a property when includeGetters is true in properties config
                const propInfo = extractGetter(member, config.properties);
                if (propInfo) {
                    properties.push(propInfo);
                }
            } else if (member.kind === "get" || member.kind === "set") {
                // Getter/setter being treated as methods (only if not already handled above)
                const methodInfo = extractMethod(member, config.methods);
                if (methodInfo) {
                    methods.push(methodInfo);
                }
            } else {
                // Regular method
                const methodInfo = extractMethod(member, config.methods);
                if (methodInfo) {
                    methods.push(methodInfo);
                }
            }
        } else if (member.type === "ClassProperty") {
            // Class field
            const propInfo = extractProperty(member, config.properties);
            if (propInfo) {
                properties.push(propInfo);
            }
        }
    }

    // Apply filtering and limits
    const filteredProps = filterProperties(properties, config.properties);
    const filteredMethods = filterMethods(methods, config.methods);

    return {
        name: className,
        filename,
        properties: filteredProps,
        methods: filteredMethods,
        superClass: classNode.superClass ? classNode.superClass.name : null,
    };
}

/**
 * Detect if a property represents a composition relationship to another class
 * @param {string} propName - Property name
 * @param {object} valueNode - AST node of the assigned value
 * @returns {string|null} Name of the composed class, or null if not a composition
 */
function detectCompositionType(propName, valueNode) {
    // Pattern 1: Property name suggests a class type (e.g., containingModel, fromProtein, toProtein)
    // Look for patterns like: fromXxx, toXxx, containingXxx, xxxModel
    const patterns = [
        { regex: /^from([A-Z][a-zA-Z]*)$/, capture: 1 },        // fromProtein → Protein
        { regex: /^to([A-Z][a-zA-Z]*)$/, capture: 1 },          // toProtein → Protein
        { regex: /^containing([A-Z][a-zA-Z]*)$/, capture: 1 },  // containingModel → Model
        { regex: /([A-Z][a-zA-Z]*)Model$/, capture: 1 },        // searchResultsModel → SearchResultsModel
    ];

    for (const pattern of patterns) {
        const match = propName.match(pattern.regex);
        if (match) {
            return match[pattern.capture];
        }
    }

    // Pattern 2: Assignment from parameter (e.g., this.containingModel = containingModel)
    if (valueNode.type === "Identifier") {
        const paramName = valueNode.name;
        // If parameter name suggests a type, extract it
        for (const pattern of patterns) {
            const match = paramName.match(pattern.regex);
            if (match) {
                return match[pattern.capture];
            }
        }
    }

    // Pattern 3: New expression (e.g., this.x = new Crosslink(...))
    if (valueNode.type === "NewExpression" && valueNode.callee && valueNode.callee.name) {
        return valueNode.callee.name;
    }

    return null;
}

/**
 * Extract properties from constructor assignments (this.prop = ...)
 * @param {object} constructorNode - Constructor method AST node
 * @param {Array} properties - Array to push property info into
 * @param {object} propConfig - Property configuration
 */
function extractConstructorProperties(constructorNode, properties, propConfig) {
    if (!constructorNode.body || !constructorNode.body.body) return;

    for (const statement of constructorNode.body.body) {
        if (statement.type === "ExpressionStatement" &&
            statement.expression.type === "AssignmentExpression" &&
            statement.expression.left.type === "MemberExpression" &&
            statement.expression.left.object.type === "ThisExpression") {

            const propName = statement.expression.left.property.name;
            const isPrivate = isPrivateMember(propName);

            // Apply filtering based on config
            if (isPrivate && !propConfig.includePrivate) continue;

            const rightSide = statement.expression.right;
            const propType = inferType(rightSide);

            // Detect potential composition relationships
            const compositionTarget = detectCompositionType(propName, rightSide);

            properties.push({
                name: propName,
                type: propType,
                visibility: isPrivate ? "private" : "public",
                source: "constructor",
                compositionTarget: compositionTarget, // Class name if this is a composition, null otherwise
            });
        }
    }
}

/**
 * Extract method information
 * Note: Getters are typically handled as properties (see extractGetter).
 * This function only processes getters when config.properties.includeGetters is false
 * and config.methods.includeGetters is true.
 *
 * @param {object} methodNode - Method AST node
 * @param {object} methodConfig - Method configuration
 * @returns {object|null} Method metadata or null if filtered
 */
function extractMethod(methodNode, methodConfig) {
    const methodName = methodNode.key.name;
    const isPrivate = isPrivateMember(methodName);
    const isGetter = methodNode.kind === "get";
    const isSetter = methodNode.kind === "set";

    // Early filtering
    if (isPrivate && !methodConfig.includePrivate) return null;
    if (isGetter && !methodConfig.includeGetters) return null;
    if (isSetter && !methodConfig.includeSetters) return null;

    return {
        name: methodName,
        kind: methodNode.kind, // "method", "get", or "set"
        visibility: isPrivate ? "private" : "public",
        params: methodNode.params.length,
    };
}

/**
 * Extract property information
 * @param {object} propNode - Property AST node
 * @param {object} propConfig - Property configuration
 * @returns {object|null} Property metadata or null if filtered
 */
function extractProperty(propNode, propConfig) {
    const propName = propNode.key.name;
    const isPrivate = isPrivateMember(propName);

    if (isPrivate && !propConfig.includePrivate) return null;

    return {
        name: propName,
        type: propNode.value ? inferType(propNode.value) : "unknown",
        visibility: isPrivate ? "private" : "public",
        source: "field",
    };
}

/**
 * Extract getter as a property
 * @param {object} getterNode - Getter method AST node
 * @param {object} propConfig - Property configuration
 * @returns {object|null} Property metadata or null if filtered
 */
function extractGetter(getterNode, propConfig) {
    const propName = getterNode.key.name;
    const isPrivate = isPrivateMember(propName);

    if (isPrivate && !propConfig.includePrivate) return null;

    return {
        name: propName,
        type: "unknown", // Could try to infer from return statement in future
        visibility: isPrivate ? "private" : "public",
        source: "getter",
    };
}

/**
 * Infer type from AST node
 * @param {object} node - AST node
 * @returns {string} Inferred type
 */
function inferType(node) {
    if (!node) return "unknown";

    switch (node.type) {
        case "StringLiteral":
            return "string";
        case "NumericLiteral":
            return "number";
        case "BooleanLiteral":
            return "boolean";
        case "ArrayExpression":
            return "Array";
        case "ObjectExpression":
            return "Object";
        case "NewExpression":
            return node.callee.name || "Object";
        case "Identifier":
            return "unknown";
        default:
            return "unknown";
    }
}

/**
 * Filter classes based on include/exclude patterns
 * @param {Array} classes - Array of class metadata
 * @param {object} classConfig - Class configuration
 * @returns {Array} Filtered classes
 */
function filterClasses(classes, classConfig) {
    return classes.filter(cls => {
        // Check exclude patterns
        if (classConfig.exclude.includes(cls.name)) {
            return false;
        }

        // Check include patterns
        if (classConfig.include.includes("*")) {
            return true;
        }

        return classConfig.include.includes(cls.name);
    });
}

/**
 * Filter properties based on configuration
 * @param {Array} properties - Array of property metadata
 * @param {object} propConfig - Property configuration
 * @returns {Array} Filtered properties
 */
function filterProperties(properties, propConfig) {
    let filtered = properties;

    // Apply exclude patterns
    if (propConfig.excludePatterns.length > 0) {
        filtered = filtered.filter(prop => {
            return !propConfig.excludePatterns.some(pattern => pattern.test(prop.name));
        });
    }

    // Apply max limit
    if (propConfig.maxProperties && filtered.length > propConfig.maxProperties) {
        filtered = filtered.slice(0, propConfig.maxProperties);
    }

    return filtered;
}

/**
 * Filter methods based on configuration
 * @param {Array} methods - Array of method metadata
 * @param {object} methodConfig - Method configuration
 * @returns {Array} Filtered methods
 */
function filterMethods(methods, methodConfig) {
    let filtered = methods;

    // Apply exclude patterns
    if (methodConfig.excludePatterns.length > 0) {
        filtered = filtered.filter(method => {
            return !methodConfig.excludePatterns.some(pattern => pattern.test(method.name));
        });
    }

    // Apply max limit
    if (methodConfig.maxMethods && filtered.length > methodConfig.maxMethods) {
        filtered = filtered.slice(0, methodConfig.maxMethods);
    }

    return filtered;
}

/**
 * Detect relationships (inheritance and composition) between classes
 * @param {Array} classes - Array of class metadata
 * @param {object} config - Configuration with relationships settings
 * @returns {Array} Array of relationship objects
 */
function detectRelationships(classes, config) {
    if (!config.relationships || !config.relationships.enabled) {
        return [];
    }

    const relationships = [];
    const classNames = new Set(classes.map(cls => cls.name));

    for (const cls of classes) {
        // Detect inheritance relationships
        if (config.relationships.detectInheritance && cls.superClass) {
            // Only add if the superclass is in our class list
            if (classNames.has(cls.superClass)) {
                relationships.push({
                    type: "inheritance",
                    from: cls.name,
                    to: cls.superClass,
                });
            }
        }

        // Detect composition relationships from properties
        if (config.relationships.detectComposition) {
            for (const prop of cls.properties) {
                if (prop.compositionTarget && classNames.has(prop.compositionTarget)) {
                    relationships.push({
                        type: "composition",
                        from: cls.name,
                        to: prop.compositionTarget,
                        fromProperty: prop.name,
                    });
                }
            }
        }
    }

    return relationships;
}

module.exports = {
    analyzeDirectory,
    detectRelationships,
};
