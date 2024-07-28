const express = require('express');
const {createServer} = require('http');
const {Server} = require('socket.io');
const Redis = require('ioredis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const httpServer = createServer(app);

const redisCache = new Redis();
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5500",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
   console.log("A user connected", socket.id)
   socket.on('setUserId', async (userId) => {
        console.log(userId)
        await redisCache.set(userId, socket.id);
   });
   socket.on('getConnectionId',async (userId) => {
        const connId =await redisCache.get(userId);
        console.log(connId);
        socket.emit('connectionId', connId)
   })
});

app.post('/sendPayload', async (req, res) => {
    const {userId, payload} = req.body;
    if(!userId || !payload) {
        return res.status(400).send('invalid request');
    };
    const socketId = await redisCache.get(userId);
    if(socketId) {
        io.to(socketId).emit('submissionPayloadResponse', payload);
        return res.send("Payload sent successfully");
    }else {
        return res.status(404).send("User not connected");
    }
})

httpServer.listen(3000, () => {
    console.log('Server is running on port 3000');
} );