const express = require("express");
require('dotenv').config();
const http = require("http");
const { Server } = require("socket.io");
const path = require('path')
const setupSocket = require('./socket.js')

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;


// Sending frontend
app.use(express.static(path.join(__dirname, "../client")));
console.log(path.join(__dirname, "../client"))

//Setup Socket Connection
setupSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

