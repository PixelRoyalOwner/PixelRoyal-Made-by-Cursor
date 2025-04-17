// Constants 

// Tile configuration
module.exports = {
    // Tile dimensions
    TILE_SIZE: 16, // Size of each tile in pixels
    CHUNK_SIZE: 16, // Number of tiles in a chunk
    CANVAS_WIDTH: 1000, // Width of the canvas in tiles
    CANVAS_HEIGHT: 1000, // Height of the canvas in tiles
    
    // Tile properties
    DEFAULT_COLOR: '#FFFFFF', // Default color for empty tiles
    MAX_COLORS: 16, // Maximum number of colors in the palette
    COOLDOWN: 1000, // Cooldown between placing tiles in milliseconds
    GRID_COLOR: '#CCCCCC', // Color of the grid lines
    GRID_WIDTH: 1, // Width of grid lines in pixels
    
    // Zoom configuration
    MIN_ZOOM: 0.1, // Minimum zoom level (10%)
    MAX_ZOOM: 4.0, // Maximum zoom level (400%)
    DEFAULT_ZOOM: 1.0, // Default zoom level (100%)
    ZOOM_STEP: 0.1, // Zoom step size
    ZOOM_SMOOTHING: 0.1, // Zoom animation smoothing factor
    
    // Anchor configuration
    ANCHOR_COLOR: '#FF0000', // Color of the anchor point
    ANCHOR_SIZE: 4, // Size of the anchor point in pixels
    ANCHOR_HISTORY_SIZE: 10, // Number of anchor points to remember
    
    // Performance settings
    RENDER_BUFFER: 1, // Number of extra tiles to render around the viewport
    MAX_RENDER_TILES: 10000, // Maximum number of tiles to render at once
    TILE_UPDATE_THROTTLE: 16, // Minimum time between tile updates in ms
}; 