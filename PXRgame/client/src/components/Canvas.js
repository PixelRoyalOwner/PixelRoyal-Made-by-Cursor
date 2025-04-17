const React = require('react');
const { 
    TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, 
    MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM, ZOOM_STEP, ZOOM_SMOOTHING,
    GRID_COLOR, GRID_WIDTH, ANCHOR_COLOR, ANCHOR_SIZE,
    RENDER_BUFFER, MAX_RENDER_TILES, TILE_UPDATE_THROTTLE
} = require('../../shared/constants');
const { screenToTile, tileToScreen, getVisibleTiles } = require('../../shared/utils/canvas');
const ColorPalette = require('./ColorPalette');

class Canvas extends React.Component {
    constructor(props) {
        super(props);
        this.canvasRef = React.createRef();
        this.zoomAnimation = null;
        this.lastTileUpdate = 0;
        this.lastTileX = -1;
        this.lastTileY = -1;
        this.state = {
            tiles: Array(CANVAS_HEIGHT).fill().map(() => 
                Array(CANVAS_WIDTH).fill('#FFFFFF')
            ),
            selectedColor: '#000000',
            isDrawing: false,
            isErasing: false,
            zoom: DEFAULT_ZOOM,
            targetZoom: DEFAULT_ZOOM,
            offsetX: 0,
            offsetY: 0,
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0,
            anchorX: CANVAS_WIDTH / 2,
            anchorY: CANVAS_HEIGHT / 2,
            anchorHistory: [],
            showGrid: true,
            showAnchor: true,
            lastPlacedPixel: null,
            isShiftPressed: false,
            drawMode: 'pixel' // 'pixel' or 'line'
        };
    }

    componentDidMount() {
        this.ctx = this.canvasRef.current.getContext('2d');
        this.centerCanvas();
        this.drawCanvas();
        this.setupEventListeners();
        this.startAnimationLoop();
    }

    componentWillUnmount() {
        if (this.zoomAnimation) {
            cancelAnimationFrame(this.zoomAnimation);
        }
    }

    startAnimationLoop() {
        const animate = () => {
            this.updateZoom();
            this.drawCanvas();
            this.zoomAnimation = requestAnimationFrame(animate);
        };
        animate();
    }

    updateZoom() {
        const { zoom, targetZoom } = this.state;
        if (Math.abs(zoom - targetZoom) > 0.001) {
            const newZoom = zoom + (targetZoom - zoom) * ZOOM_SMOOTHING;
            this.setState({ zoom: newZoom });
        }
    }

    centerCanvas() {
        const canvas = this.canvasRef.current;
        const { anchorX, anchorY, zoom } = this.state;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const anchorScreenPos = tileToScreen(anchorX, anchorY, zoom, 0, 0);
        const newOffsetX = centerX - anchorScreenPos.x;
        const newOffsetY = centerY - anchorScreenPos.y;
        
        this.setState({
            offsetX: newOffsetX,
            offsetY: newOffsetY
        });
    }

    drawCanvas() {
        const { tiles, zoom, offsetX, offsetY, showGrid, showAnchor, lastPlacedPixel } = this.state;
        const { ctx } = this;
        const canvas = this.canvasRef.current;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const { startX, startY, endX, endY } = getVisibleTiles(
            canvas.width,
            canvas.height,
            zoom,
            offsetX,
            offsetY
        );

        // Draw tiles
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const screenPos = tileToScreen(x, y, zoom, offsetX, offsetY);
                ctx.fillStyle = tiles[y][x];
                ctx.fillRect(
                    screenPos.x,
                    screenPos.y,
                    TILE_SIZE * zoom,
                    TILE_SIZE * zoom
                );

                // Highlight last placed pixel
                if (lastPlacedPixel && lastPlacedPixel.x === x && lastPlacedPixel.y === y) {
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        screenPos.x,
                        screenPos.y,
                        TILE_SIZE * zoom,
                        TILE_SIZE * zoom
                    );
                }
            }
        }

        // Draw grid
        if (showGrid && zoom >= 0.5) {
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = GRID_WIDTH;
            
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const screenPos = tileToScreen(x, y, zoom, offsetX, offsetY);
                    ctx.strokeRect(
                        screenPos.x,
                        screenPos.y,
                        TILE_SIZE * zoom,
                        TILE_SIZE * zoom
                    );
                }
            }
        }

        // Draw anchor
        if (showAnchor) {
            const anchorScreenPos = tileToScreen(
                this.state.anchorX,
                this.state.anchorY,
                zoom,
                offsetX,
                offsetY
            );
            ctx.fillStyle = ANCHOR_COLOR;
            ctx.fillRect(
                anchorScreenPos.x - ANCHOR_SIZE / 2,
                anchorScreenPos.y - ANCHOR_SIZE / 2,
                ANCHOR_SIZE,
                ANCHOR_SIZE
            );
        }
    }

    setupEventListeners() {
        const canvas = this.canvasRef.current;

        // Drawing events
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // Zoom events
        canvas.addEventListener('wheel', this.handleWheel.bind(this));

        // Pan events
        canvas.addEventListener('mousedown', this.handlePanStart.bind(this));
        canvas.addEventListener('mousemove', this.handlePanMove.bind(this));
        canvas.addEventListener('mouseup', this.handlePanEnd.bind(this));

        // Anchor events
        canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));

        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleWheel(event) {
        event.preventDefault();
        const { zoom } = this.state;
        
        const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
        
        this.setState({ targetZoom: newZoom });
    }

    handleDoubleClick(event) {
        const { x, y } = this.getMousePosition(event);
        const { anchorHistory } = this.state;
        
        const newHistory = [
            { x, y },
            ...anchorHistory.slice(0, ANCHOR_HISTORY_SIZE - 1)
        ];
        
        this.setState({
            anchorX: x,
            anchorY: y,
            anchorHistory: newHistory
        }, () => this.centerCanvas());
    }

    handleKeyDown(event) {
        switch (event.key) {
            case 'g':
                this.setState(prev => ({ showGrid: !prev.showGrid }));
                break;
            case 'a':
                this.setState(prev => ({ showAnchor: !prev.showAnchor }));
                break;
            case 'z':
                if (event.ctrlKey) {
                    this.undoLastAnchor();
                }
                break;
            case 'r':
                this.resetView();
                break;
            case 'c':
                this.clearCanvas();
                break;
            case 'Shift':
                this.setState({ isShiftPressed: true });
                break;
            case 'e':
                this.setState(prev => ({ isErasing: !prev.isErasing }));
                break;
            case 'l':
                this.setState(prev => ({ drawMode: prev.drawMode === 'pixel' ? 'line' : 'pixel' }));
                break;
        }
    }

    handleKeyUp(event) {
        if (event.key === 'Shift') {
            this.setState({ isShiftPressed: false });
        }
    }

    handleMouseDown(event) {
        if (event.button === 0) { // Left click
            const { x, y } = this.getMousePosition(event);
            this.setState({ isDrawing: true });
            this.lastTileX = x;
            this.lastTileY = y;
            this.placeTile(x, y);
        }
    }

    handleMouseMove(event) {
        if (this.state.isDrawing && this.state.isShiftPressed) {
            const now = Date.now();
            if (now - this.lastTileUpdate >= TILE_UPDATE_THROTTLE) {
                const { x, y } = this.getMousePosition(event);
                
                if (this.state.drawMode === 'line') {
                    this.drawLine(this.lastTileX, this.lastTileY, x, y);
                } else {
                    this.placeTile(x, y);
                }
                
                this.lastTileX = x;
                this.lastTileY = y;
                this.lastTileUpdate = now;
            }
        }
    }

    handleMouseUp() {
        this.setState({ isDrawing: false });
        this.lastTileX = -1;
        this.lastTileY = -1;
    }

    drawLine(x0, y0, x1, y1) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            this.placeTile(x0, y0);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    placeTile(x, y) {
        if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) return;

        const { tiles, selectedColor, isErasing } = this.state;
        const newTiles = [...tiles];
        const color = isErasing ? '#FFFFFF' : selectedColor;
        
        // Only update if the color is different
        if (newTiles[y][x] !== color) {
            newTiles[y][x] = color;
            
            this.setState({ 
                tiles: newTiles,
                lastPlacedPixel: { x, y }
            }, () => {
                this.props.onTilePlace(x, y, color);
            });
        }
    }

    clearCanvas() {
        const newTiles = Array(CANVAS_HEIGHT).fill().map(() => 
            Array(CANVAS_WIDTH).fill('#FFFFFF')
        );
        this.setState({ 
            tiles: newTiles,
            lastPlacedPixel: null
        });
    }

    undoLastAnchor() {
        const { anchorHistory } = this.state;
        if (anchorHistory.length > 0) {
            const [lastAnchor, ...rest] = anchorHistory;
            this.setState({
                anchorX: lastAnchor.x,
                anchorY: lastAnchor.y,
                anchorHistory: rest
            }, () => this.centerCanvas());
        }
    }

    resetView() {
        this.setState({
            zoom: DEFAULT_ZOOM,
            targetZoom: DEFAULT_ZOOM,
            anchorX: CANVAS_WIDTH / 2,
            anchorY: CANVAS_HEIGHT / 2
        }, () => this.centerCanvas());
    }

    handlePanStart(event) {
        if (event.button === 1 || event.button === 2) {
            event.preventDefault();
            this.setState({
                isDragging: true,
                lastMouseX: event.clientX,
                lastMouseY: event.clientY
            });
        }
    }

    handlePanMove(event) {
        if (this.state.isDragging) {
            const dx = event.clientX - this.state.lastMouseX;
            const dy = event.clientY - this.state.lastMouseY;
            
            this.setState({
                offsetX: this.state.offsetX + dx,
                offsetY: this.state.offsetY + dy,
                lastMouseX: event.clientX,
                lastMouseY: event.clientY
            });
        }
    }

    handlePanEnd() {
        this.setState({ isDragging: false });
    }

    getMousePosition(event) {
        const rect = this.canvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return screenToTile(x, y, this.state.zoom, this.state.offsetX, this.state.offsetY);
    }

    handleColorSelect(color) {
        this.setState({ selectedColor: color });
    }

    render() {
        return (
            <>
                <canvas
                    ref={this.canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    style={{ 
                        border: '1px solid black',
                        cursor: this.state.isDragging ? 'grabbing' : 'default'
                    }}
                />
                <ColorPalette onColorSelect={this.handleColorSelect.bind(this)} />
            </>
        );
    }
}

module.exports = Canvas; 