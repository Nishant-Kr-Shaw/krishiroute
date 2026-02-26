const fuelService = require('../services/fuel.service');

/**
 * Get current fuel price
 */
exports.getFuelPrice = async (req, res) => {
    try {
        const price = await fuelService.getLatestFuelPrice();
        res.json({
            success: true,
            price,
            currency: 'INR',
            unit: 'Litre',
            type: 'Diesel',
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch fuel price',
            error: error.message
        });
    }
};
