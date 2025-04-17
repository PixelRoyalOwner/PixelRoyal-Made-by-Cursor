const { TILE_SIZE, CHUNK_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_COLOR } = require('../constants');

// Convert tile coordinates to chunk coordinates
function getChunkCoordinates(x, y) {
    return {
        chunkX: Math.floor(x / CHUNK_SIZE),
        chunkY: Math.floor(y / CHUNK_SIZE),
        localX: x % CHUNK_SIZE,
        localY: y % CHUNK_SIZE
    };
}

// Convert chunk coordinates to tile coordinates
function getTileCoordinates(chunkX, chunkY, localX, localY) {
    return {
        x: chunkX * CHUNK_SIZE + localX,
        y: chunkY * CHUNK_SIZE + localY
    };
}

// Initialize an empty chunk
function createEmptyChunk() {
    const chunk = [];
    for (let y = 0; y < CHUNK_SIZE; y++) {
        const row = [];
        for (let x = 0; x < CHUNK_SIZE; x++) {
            row.push(DEFAULT_COLOR);
        }
        chunk.push(row);
    }
    return chunk;
}

// Check if coordinates are within canvas bounds
function isWithinBounds(x, y) {
    return x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT;
}

// Convert screen coordinates to tile coordinates with zoom
function screenToTile(x, y, zoom, offsetX, offsetY) {
    return {
        x: Math.floor((x - offsetX) / (TILE_SIZE * zoom)),
        y: Math.floor((y - offsetY) / (TILE_SIZE * zoom))
    };
}

// Convert tile coordinates to screen coordinates with zoom
function tileToScreen(x, y, zoom, offsetX, offsetY) {
    return {
        x: x * TILE_SIZE * zoom + offsetX,
        y: y * TILE_SIZE * zoom + offsetY
    };
}

// Calculate visible tile range based on viewport and zoom
function getVisibleTiles(width, height, zoom, offsetX, offsetY) {
    const startX = Math.max(0, Math.floor(-offsetX / (TILE_SIZE * zoom)));
    const startY = Math.max(0, Math.floor(-offsetY / (TILE_SIZE * zoom)));
    const endX = Math.min(CANVAS_WIDTH, Math.ceil((width - offsetX) / (TILE_SIZE * zoom)));
    const endY = Math.min(CANVAS_HEIGHT, Math.ceil((height - offsetY) / (TILE_SIZE * zoom)));
    
    return { startX, startY, endX, endY };
}

module.exports = {
    getChunkCoordinates,
    getTileCoordinates,
    createEmptyChunk,
    isWithinBounds,
    screenToTile,
    tileToScreen,
    getVisibleTiles
}; 