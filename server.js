const adminRoutes = require('./src/routes/adminRoutes');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

//Import database config
const connectDB = require("./src/config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//Connect to Database SEBELUM routes
connectDB();

// Auth: hanya untuk admin/owner
app.use('/api/auth', require('./src/routes/authRoutes'));

// Admin routes (opsional, bisa gabung dengan tenants)
app.use('/api/admin', require('./src/routes/adminRoutes'));
// Test route untuk auth
app.get('/api/test-auth', require('./src/middleware/auth'), (req, res) => {
    res.json({
        success: true,
        message: 'Auth test successful!',
        user: {
            userId: req.userId,
            role: req.userRole
        }
    });
});
// Basic route
app.get("/", (req, res) => {
    res.json({ 
        message: " StayTrack API is running!",
        version: "1.0.0", 
        timestamp: new Date().toISOString()
    });
});

// Test route untuk check server
app.get("/health", (req, res) => {
    res.json({ 
        status: "OK", 
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`StayTrack server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});