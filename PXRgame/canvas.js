const { CHUNK_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } = require('../../shared/constants');
const { createEmptyChunk, getChunkCoordinates, isWithinBounds } = require('../../shared/utils/canvas');

class CanvasManager {
    constructor() {
        this.chunks = new Map();
        this.lastPlaced = new Map(); // User ID -> timestamp
    }

    // Get or create a chunk
    getChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        if (!this.chunks.has(chunkKey)) {
            this.chunks.set(chunkKey, createEmptyChunk());
        }
        return this.chunks.get(chunkKey);
    }

    // Place a tile
    placeTile(userId, x, y, color) {
        if (!isWithinBounds(x, y)) {
            return { success: false, error: 'Coordinates out of bounds' };
        }

        const now = Date.now();
        const lastPlace = this.lastPlaced.get(userId) || 0;
        const { COOLDOWN } = require('../../shared/constants');

        if (now - lastPlace < COOLDOWN) {
            return { success: false, error: 'Cooldown not expired' };
        }

        const { chunkX, chunkY, localX, localY } = getChunkCoordinates(x, y);
        const chunk = this.getChunk(chunkX, chunkY);
        
        chunk[localY][localX] = color;
        this.lastPlaced.set(userId, now);

        return { 
            success: true, 
            data: { x, y, color, chunkX, chunkY, localX, localY } 
        };
    }

    // Get a region of the canvas
    getRegion(startX, startY, width, height) {
        const region = [];
        for (let y = startY; y < startY + height; y++) {
            const row = [];
            for (let x = startX; x < startX + width; x++) {
                if (!isWithinBounds(x, y)) {
                    row.push(null);
                    continue;
                }
                const { chunkX, chunkY, localX, localY } = getChunkCoordinates(x, y);
                const chunk = this.getChunk(chunkX, chunkY);
                row.push(chunk[localY][localX]);
            }
            region.push(row);
        }
        return region;
    }
}

module.exports = new CanvasManager(); 