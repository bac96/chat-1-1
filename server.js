const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Store connected users
const connectedUsers = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('user connected', (userId) => {
    socket.userId = userId;
    socket.join(userId);
    connectedUsers[userId] = socket;
    console.log(`User ${userId} connected`);
  });

  socket.on('chat message', (data) => {
    console.log(`message from ${socket.userId} to ${data.receiverId}: ${data.message}`);

    // If receiverId is provided, send the message to that user only
    if (data.receiverId && connectedUsers[data.receiverId]) {
      connectedUsers[data.receiverId].emit('chat message', {
        message: data.message,
        senderId: socket.userId,
      });
    } else {
      // If receiverId is not provided, broadcast the message to all connected users
      socket.broadcast.emit('chat message', {
        message: data.message,
        senderId: socket.userId,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    delete connectedUsers[socket.userId];
    socket.leave(socket.userId);
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
