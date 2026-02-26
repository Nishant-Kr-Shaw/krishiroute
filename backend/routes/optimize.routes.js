const express = require('express');
const router = express.Router();
const optimizeController = require('../controllers/optimize.controller');
const { optimizeValidationRules, validate, sanitizeInput } = require('../middleware/validate');

/**
 * API Routes for Krishi-Route
 */

// Health check
router.get('/health', optimizeController.healthCheck);

// Get available crops
router.get('/crops', optimizeController.getAvailableCrops);

// Get available vehicle types
router.get('/vehicles', optimizeController.getAvailableVehicles);

// Main optimization endpoint
router.post(
    '/optimize',
    optimizeValidationRules(),
    validate,
    sanitizeInput,
    optimizeController.optimizeTrip
);

module.exports = router;
