const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


connectDB();
app.use(cors());
// app.use(cors({
//     origin: 'http://localhost:3000',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(express.json({ extended: false }));

app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

let users = [];

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (username) => {
        
        users = users.filter(user => user.socketId !== socket.id);

        
        const user = { username, socketId: socket.id };
        users.push(user);

        io.emit('userList', users.map(user => user.username));  
    });

    socket.on('chatMessage', async (msg) => {
        const token = msg.token;
        if (!token) return;

        try {
            const decoded = jwt.verify(token, 'Secret-Thiru');
            const user = decoded.user;

            const newMessage = new Message({
                username: user.username,
                text: msg.text,
            });

            await newMessage.save();

            io.emit('message', { username: user.username, text: msg.text });
        } catch (err) {
            console.error('Token is not valid');
        }
    });

    socket.on('logout', () => {
        users = users.filter((user) => user.socketId !== socket.id);
        io.emit('userList', users.map(user => user.username));  
        socket.disconnect();  
        console.log('Client logged out');
    });

    socket.on('disconnect', () => {
        users = users.filter((user) => user.socketId !== socket.id);
        io.emit('userList', users.map(user => user.username));  
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

