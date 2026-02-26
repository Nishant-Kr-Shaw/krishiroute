const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for API requests
 */

/**
 * Validation rules for optimization request
 */
const optimizeValidationRules = () => {
    return [
        body('crop')
            .notEmpty()
            .withMessage('Crop is required')
            .isString()
            .withMessage('Crop must be a string')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Crop name must be between 2 and 50 characters'),

        body('quantity')
            .notEmpty()
            .withMessage('Quantity is required')
            .isFloat({ min: 0.1, max: 1000 })
            .withMessage('Quantity must be between 0.1 and 1000 quintals'),

        body('vehicleType')
            .notEmpty()
            .withMessage('Vehicle type is required')
            .isString()
            .withMessage('Vehicle type must be a string')
            .isIn(['tractor', 'tata-ace', 'truck', 'mini-truck', 'tempo'])
            .withMessage('Invalid vehicle type. Must be one of: tractor, tata-ace, truck, mini-truck, tempo'),

        body('source')
            .notEmpty()
            .withMessage('Source location is required')
            .isObject()
            .withMessage('Source must be an object'),

        body('source.lat')
            .notEmpty()
            .withMessage('Source latitude is required')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude must be between -90 and 90'),

        body('source.lng')
            .notEmpty()
            .withMessage('Source longitude is required')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude must be between -180 and 180'),
    ];
};

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                value: err.value,
            })),
        });
    }

    next();
};

/**
 * Sanitize and normalize input data
 */
const sanitizeInput = (req, res, next) => {
    if (req.body.crop) {
        req.body.crop = req.body.crop.toLowerCase().trim();
    }

    if (req.body.vehicleType) {
        req.body.vehicleType = req.body.vehicleType.toLowerCase().trim();
    }

    // Ensure quantity is a number
    if (req.body.quantity) {
        req.body.quantity = parseFloat(req.body.quantity);
    }

    // Ensure coordinates are numbers
    if (req.body.source) {
        req.body.source.lat = parseFloat(req.body.source.lat);
        req.body.source.lng = parseFloat(req.body.source.lng);
    }

    next();
};

module.exports = {
    optimizeValidationRules,
    validate,
    sanitizeInput,
};
