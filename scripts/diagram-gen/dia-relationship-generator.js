/**
 * Dia relationship XML generator
 * Generates UML relationships (inheritance, composition, association) in .dia XML format
 */

/**
 * Calculate routing path between two classes
 * Returns a simple 3-point orthogonal path (L-shaped or Z-shaped)
 * @param {object} fromPos - Starting class position {x, y, width, height}
 * @param {object} toPos - Ending class position {x, y, width, height}
 * @returns {object} { points: [{x,y}], orientations: [0|1] }
 */
function calculateRoutingPath(fromPos, toPos) {
    // Calculate center points of each class
    const fromCenter = {
        x: fromPos.x + fromPos.width / 2,
        y: fromPos.y + fromPos.height / 2,
    };
    const toCenter = {
        x: toPos.x + toPos.width / 2,
        y: toPos.y + toPos.height / 2,
    };

    // Calculate connection points (edges of boxes)
    const fromPoint = getConnectionPoint(fromPos, toCenter);
    const toPoint = getConnectionPoint(toPos, fromCenter);

    // Create 3-point path with midpoint
    // Choose routing based on relative positions
    const points = [];
    const orientations = [];

    // Start point
    points.push(fromPoint);

    // Determine if we should route horizontally first or vertically first
    const deltaX = Math.abs(toPoint.x - fromPoint.x);
    const deltaY = Math.abs(toPoint.y - fromPoint.y);

    if (deltaX > deltaY) {
        // Route horizontally first, then vertically
        const midX = (fromPoint.x + toPoint.x) / 2;
        points.push({ x: midX, y: fromPoint.y });
        points.push({ x: midX, y: toPoint.y });
        orientations.push(0); // horizontal
        orientations.push(1); // vertical
    } else {
        // Route vertically first, then horizontally
        const midY = (fromPoint.y + toPoint.y) / 2;
        points.push({ x: fromPoint.x, y: midY });
        points.push({ x: toPoint.x, y: midY });
        orientations.push(1); // vertical
        orientations.push(0); // horizontal
    }

    // End point
    points.push(toPoint);
    orientations.push(deltaX > deltaY ? 1 : 0); // final segment

    return { points, orientations };
}

/**
 * Get connection point on the edge of a class box
 * Returns the point on the box edge closest to the target
 * @param {object} boxPos - Box position {x, y, width, height}
 * @param {object} target - Target point {x, y}
 * @returns {object} Connection point {x, y}
 */
function getConnectionPoint(boxPos, target) {
    const center = {
        x: boxPos.x + boxPos.width / 2,
        y: boxPos.y + boxPos.height / 2,
    };

    // Determine which edge the target is closest to
    const toRight = target.x > center.x;
    const toBottom = target.y > center.y;

    // Calculate edge points
    const top = boxPos.y;
    const bottom = boxPos.y + boxPos.height;
    const left = boxPos.x;
    const right = boxPos.x + boxPos.width;

    // Return edge point based on target direction
    if (Math.abs(target.x - center.x) > Math.abs(target.y - center.y)) {
        // Connect to left or right edge
        return {
            x: toRight ? right : left,
            y: center.y,
        };
    } else {
        // Connect to top or bottom edge
        return {
            x: center.x,
            y: toBottom ? bottom : top,
        };
    }
}

/**
 * Calculate bounding box for a relationship path
 * @param {Array} points - Array of {x, y} points
 * @returns {object} Bounding box {minX, minY, maxX, maxY}
 */
function calculateBoundingBox(points) {
    const padding = 0.75; // Standard Dia padding
    const allX = points.map(p => p.x);
    const allY = points.map(p => p.y);

    return {
        minX: Math.min(...allX) - padding,
        minY: Math.min(...allY) - padding,
        maxX: Math.max(...allX) + padding,
        maxY: Math.max(...allY) + padding,
    };
}

/**
 * Generate XML for all relationships
 * @param {Array} relationships - Array of relationship objects
 * @param {Array} classes - Array of class metadata (for positions)
 * @param {object} config - Layout configuration
 * @param {number} startId - Starting object ID number
 * @returns {Array} Array of relationship XML objects for xmlbuilder2
 */
function generateRelationships(relationships, classes, config, startId) {
    const relationshipObjects = [];

    // Build class position lookup
    const classPositions = {};
    const classIds = {};
    classes.forEach((cls, index) => {
        const position = config.layout.positions[cls.name] || {
            x: 10 + (index % 3) * 15,
            y: 10 + Math.floor(index / 3) * 15,
            width: config.layout.defaultWidth,
            height: config.layout.defaultHeight,
        };
        classPositions[cls.name] = position;
        classIds[cls.name] = index; // Object ID for connections
    });

    relationships.forEach((rel, index) => {
        const objectId = startId + index;

        const fromPos = classPositions[rel.from];
        const toPos = classPositions[rel.to];

        if (!fromPos || !toPos) {
            console.warn(`Warning: Missing position for relationship ${rel.from} -> ${rel.to}`);
            return;
        }

        // Calculate routing path
        const path = calculateRoutingPath(fromPos, toPos);
        const bbox = calculateBoundingBox(path.points);

        // Determine association type
        // 0 = normal association
        // 1 = aggregation (hollow diamond)
        // 2 = composition (filled diamond)
        const assocType = rel.type === "composition" ? "2" :
                         rel.type === "inheritance" ? "0" : "0";

        // Build relationship object
        relationshipObjects.push({
            id: `O${objectId}`,
            type: rel.type,
            assocType: assocType,
            fromClass: rel.from,
            toClass: rel.to,
            fromId: classIds[rel.from],
            toId: classIds[rel.to],
            points: path.points,
            orientations: path.orientations,
            boundingBox: bbox,
        });
    });

    return relationshipObjects;
}

module.exports = {
    calculateRoutingPath,
    generateRelationships,
};
