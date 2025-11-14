require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'src', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads folder at:', uploadDir);
}

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const enrollmentRoutes = require('./src/routes/enrollmentRoutes');
const lessonRoutes = require('./src/routes/lessonRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const collectionRoutes = require('./src/routes/collectionRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const progressRoutes = require('./src/routes/progressRoutes');
const driveRoutes = require('./src/routes/driveRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const statisticsRoutes  = require('./src/routes/teacherStatsRoutes');
const adminStatsRoutes = require('./src/routes/adminStatsRoutes');
const aiChatRoutes = require('./src/routes/aiChatRoutes');
const certificateRoutes = require('./src/routes/certificateRoutes');
const connectDB = require('./src/config/db');

const app = express();
const server = http.createServer(app); // tạo HTTP server từ Express
const io = new Server(server, {
  cors: {
    origin: '*', // hoặc thay bằng domain cụ thể nếu cần bảo mật
    methods: ['GET', 'POST']
  }
});

console.log('MONGO_URI:', process.env.MONGO_URI);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/certificates', certificateRoutes);

// Kết nối Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId); // Cho phép user nhận thông báo riêng theo userId
    console.log(`👤 User ${userId} joined their notification room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Kết nối DB và khởi động server
connectDB().then(() => {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
  });
});
