const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    console.log(`${socket.id} joined room ${roomId}`);

    socket.to(roomId).emit("user-joined", socket.id);
  });

  // Send offer to a specific user
  socket.on("offer", ({ offer, to }) => {
    io.to(to).emit("offer", {
      offer,
      from: socket.id,
    });
  });

  // Send answer to a specific user
  socket.on("answer", ({ answer, to }) => {
    io.to(to).emit("answer", {
      answer,
      from: socket.id,
    });
  });

  // Send ICE candidate to a specific user
  socket.on("ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  socket.on("end-call", ({ to }) => {
    io.to(to).emit("call-ended");
    console.log(`${socket.id} ended the call`);
  });

  // ================= CHAT =================

  socket.on("send-message", ({ roomId, message }) => {
    socket.to(roomId).emit("receive-message", {
      message,
      from: socket.id,
    });
  });

  // Typing indicator
  socket.on("typing", ({ roomId }) => {
    console.log("⌨️ Typing in room:", roomId);
  
    socket.to(roomId).emit("friend-typing");
  });
  
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Frenzo signaling server is running 💗");
});

server.listen(3001, () => {
  console.log("Frenzo server running on http://localhost:3001");
});