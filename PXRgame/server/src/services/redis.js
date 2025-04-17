const Redis = require('ioredis');
const { CHUNK_SIZE } = require('../../shared/constants');

class RedisService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD
        });
    }

    // Generate a key for a chunk
    getChunkKey(chunkX, chunkY) {
        return `canvas:chunk:${chunkX}:${chunkY}`;
    }

    // Save a chunk to Redis
    async saveChunk(chunkX, chunkY, chunkData) {
        const key = this.getChunkKey(chunkX, chunkY);
        await this.redis.set(key, JSON.stringify(chunkData));
    }

    // Load a chunk from Redis
    async loadChunk(chunkX, chunkY) {
        const key = this.getChunkKey(chunkX, chunkY);
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    // Save last placed timestamp for a user
    async saveLastPlaced(userId, timestamp) {
        await this.redis.set(`canvas:lastplaced:${userId}`, timestamp);
    }

    // Get last placed timestamp for a user
    async getLastPlaced(userId) {
        const timestamp = await this.redis.get(`canvas:lastplaced:${userId}`);
        return timestamp ? parseInt(timestamp) : 0;
    }

    // Get all chunks in a region
    async getRegion(startX, startY, width, height) {
        const chunks = [];
        const chunkSize = CHUNK_SIZE;
        
        for (let y = startY; y < startY + height; y += chunkSize) {
            const row = [];
            for (let x = startX; x < startX + width; x += chunkSize) {
                const chunkX = Math.floor(x / chunkSize);
                const chunkY = Math.floor(y / chunkSize);
                const chunk = await this.loadChunk(chunkX, chunkY);
                row.push(chunk);
            }
            chunks.push(row);
        }
        return chunks;
    }
}

module.exports = new RedisService(); 