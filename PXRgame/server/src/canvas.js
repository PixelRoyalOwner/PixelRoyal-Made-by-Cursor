const { CHUNK_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } = require('../../shared/constants');
const { createEmptyChunk, getChunkCoordinates, isWithinBounds } = require('../../shared/utils/canvas');
const redisService = require('./services/redis');

class CanvasManager {
    constructor() {
        this.chunks = new Map();
        this.lastPlaced = new Map();
        this.initializeCanvas();
    }

    async initializeCanvas() {
        // Load initial chunks from Redis
        const initialChunks = await redisService.getRegion(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        for (let y = 0; y < initialChunks.length; y++) {
            for (let x = 0; x < initialChunks[y].length; x++) {
                const chunk = initialChunks[y][x];
                if (chunk) {
                    this.chunks.set(`${x},${y}`, chunk);
                }
            }
        }
    }

    // Get or create a chunk
    async getChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        
        if (!this.chunks.has(chunkKey)) {
            // Try to load from Redis first
            const redisChunk = await redisService.loadChunk(chunkX, chunkY);
            if (redisChunk) {
                this.chunks.set(chunkKey, redisChunk);
            } else {
                // Create new chunk if not in Redis
                const newChunk = createEmptyChunk();
                this.chunks.set(chunkKey, newChunk);
                await redisService.saveChunk(chunkX, chunkY, newChunk);
            }
        }
        
        return this.chunks.get(chunkKey);
    }

    // Place a tile
    async placeTile(userId, x, y, color) {
        if (!isWithinBounds(x, y)) {
            return { success: false, error: 'Coordinates out of bounds' };
        }

        const now = Date.now();
        const lastPlace = await redisService.getLastPlaced(userId);
        const { COOLDOWN } = require('../../shared/constants');

        if (now - lastPlace < COOLDOWN) {
            return { success: false, error: 'Cooldown not expired' };
        }

        const { chunkX, chunkY, localX, localY } = getChunkCoordinates(x, y);
        const chunk = await this.getChunk(chunkX, chunkY);
        
        chunk[localY][localX] = color;
        await redisService.saveChunk(chunkX, chunkY, chunk);
        await redisService.saveLastPlaced(userId, now);

        return { 
            success: true, 
            data: { x, y, color, chunkX, chunkY, localX, localY } 
        };
    }

    // Get a region of the canvas
    async getRegion(startX, startY, width, height) {
        const region = [];
        for (let y = startY; y < startY + height; y++) {
            const row = [];
            for (let x = startX; x < startX + width; x++) {
                if (!isWithinBounds(x, y)) {
                    row.push(null);
                    continue;
                }
                const { chunkX, chunkY, localX, localY } = getChunkCoordinates(x, y);
                const chunk = await this.getChunk(chunkX, chunkY);
                row.push(chunk[localY][localX]);
            }
            region.push(row);
        }
        return region;
    }
}

module.exports = new CanvasManager(); 