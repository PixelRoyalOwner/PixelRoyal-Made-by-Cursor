const socketIO = require('socket.io');
const canvasManager = require('./canvas');

module.exports = function(server) {
    const io = socketIO(server);

    io.on('connection', (socket) => {
        console.log('New client connected');

        // Handle tile placement
        socket.on('placeTile', async (data) => {
            try {
                const { x, y, color } = data;
                const userId = socket.id; // In a real app, use proper user authentication

                const result = await canvasManager.placeTile(userId, x, y, color);
                
                if (result.success) {
                    // Broadcast the update to all clients
                    io.emit('tileUpdate', result.data);
                } else {
                    // Send error back to the client
                    socket.emit('error', result.error);
                }
            } catch (error) {
                console.error('Error placing tile:', error);
                socket.emit('error', 'Internal server error');
            }
        });

        // Handle region requests
        socket.on('requestRegion', async (data) => {
            try {
                const { startX, startY, width, height } = data;
                const region = await canvasManager.getRegion(startX, startY, width, height);
                socket.emit('regionUpdate', { startX, startY, data: region });
            } catch (error) {
                console.error('Error getting region:', error);
                socket.emit('error', 'Internal server error');
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    return io;
}; 