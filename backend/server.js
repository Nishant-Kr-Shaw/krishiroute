require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const optimizeRoutes = require('./routes/optimize.routes');
const fuelRoutes = require('./routes/fuel.routes');

/**
 * Krishi Route Backend Server
 * Main application entry point
 */

const app = express();

// Connect to MongoDB (will continue even if connection fails)
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api', optimizeRoutes);
app.use('/api/fuel', fuelRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Krishi Route API',
        description: 'Profit & Logistics Optimizer for Farmers',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            optimize: 'POST /api/optimize',
            crops: '/api/crops',
            vehicles: '/api/vehicles',
            fuel: '/api/fuel/price'
        },
        documentation: 'https://github.com/yourusername/krishi-route',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('KRISHI-ROUTE API SERVER');
    console.log('='.repeat(60));
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MongoDB: ${process.env.MONGODB_URI}`);
    console.log(`Mock Data: ${process.env.USE_MOCK_DATA === 'true' ? 'ENABLED' : 'DISABLED'}`);
    console.log('='.repeat(60) + '\n');
    console.log('Available endpoints:');
    console.log(`   GET  http://localhost:${PORT}/api/health`);
    console.log(`   POST http://localhost:${PORT}/api/optimize`);
    console.log(`   GET  http://localhost:${PORT}/api/crops`);
    console.log(`   GET  http://localhost:${PORT}/api/vehicles`);
    console.log(`   GET  http://localhost:${PORT}/api/fuel/price`);
    console.log('\n' + '='.repeat(60) + '\n');
});

module.exports = app;
