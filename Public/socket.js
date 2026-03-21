const getTurnCredentials = require('./twil.js')

let activeScreenSharer = {};

function setupSocket(io) {
  io.on("connection", (socket) => {

  socket.on("get-ice", async () => {
      
  try {
    const iceServers = await getTurnCredentials();
    socket.emit("ice-servers", iceServers);
  } catch (err) {
    console.error("TURN error:", err);
  }
});

  socket.on("join", (roomId) => {
  const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;

  if (roomSize >= 2) {
    socket.emit("room-full");
    return;
  }
    socket.join(roomId);
    console.log("User joined:", roomId);
  });

  socket.on("offer", ({ offer, roomId }) => {
    console.log("Server received offer for room:", roomId);
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  socket.on("hangup", (roomId) => {
    socket.to(roomId).emit("hangup");
  });

  socket.on("reject", (roomId) => {
    socket.to(roomId).emit("reject");
  });


  // Screen Sharing Events
  socket.on("start-screen", (roomId) => {
  if (activeScreenSharer[roomId]) {
    socket.emit("screen-denied");
    return;
  }

  activeScreenSharer[roomId] = socket.id;
  socket.to(roomId).emit("screen-started");
  });

  socket.on("stop-screen", (roomId) => {
  if (activeScreenSharer[roomId] === socket.id) {
    delete activeScreenSharer[roomId];
    socket.to(roomId).emit("screen-stopped");
  }
  });


  // Uneexpected leave-->refresh / tab /close/ internet lost
  socket.on("disconnecting", () => {
  const rooms = [...socket.rooms];

  rooms.forEach(roomId => {
    if (roomId !== socket.id) {
      socket.to(roomId).emit("user-left");
    }
  });
  });

  socket.on("disconnect", () => {
  console.log("User disconnected:", socket.id);
  });

});
}

module.exports = setupSocket;
