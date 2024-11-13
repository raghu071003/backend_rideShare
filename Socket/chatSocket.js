import { Server } from 'socket.io';

// Store connected users and drivers
const connectedUsers = {};

const chatSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.ORIGIN || 'http://localhost:5173', // React frontend URL
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Handle user or driver login to assign them a socket ID
        socket.on('register', ({ userId, role }) => {
            connectedUsers[userId] = { socketId: socket.id, role };
            console.log(`User/Driver ${role} with ID ${userId} connected`);
        });

        // Handle private messages
        socket.on('send_message', ({ fromId, toId, message }) => {
            const receiver = connectedUsers[toId];
            if (receiver) {
                // Emit the message to the recipient
                io.to(receiver.socketId).emit('receive_message', { fromId, message });
                console.log(`Message from ${fromId} to ${toId}: ${message}`);
            } else {
                console.log('Receiver not connected');
            }
        });

        // Handle user or driver disconnect
        socket.on('disconnect', () => {
            for (const userId in connectedUsers) {
                if (connectedUsers[userId].socketId === socket.id) {
                    delete connectedUsers[userId];
                    console.log(`${userId} disconnected`);
                    break;
                }
            }
        });
    });
};

export default chatSocket;
