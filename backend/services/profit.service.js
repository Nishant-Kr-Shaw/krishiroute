/**
 * Profit Service
 * Core profit calculation engine
 * Calculates net profit considering revenue, transport, and handling costs
 */

const fuelService = require('./fuel.service');

// Base vehicle rates per kilometer (in ₹) - based on fuel price of ₹90/L
const BASE_VEHICLE_RATES = {
    tractor: 12,
    'tata-ace': 18,
    truck: 25,
    'mini-truck': 20,
    tempo: 15,
};

// Fuel sensitivity factor (roughly how much fuel the vehicle consumes per km)
const FUEL_SENSITIVITY = {
    tractor: 0.1,    // 10 km/L
    'tata-ace': 0.15, // 6.6 km/L
    truck: 0.25,      // 4 km/L
    'mini-truck': 0.2, // 5 km/L
    tempo: 0.12,     // 8 km/L
};

// Handling charges (in ₹ per quintal)
const HANDLING_CHARGES = {
    loading: 20,
    unloading: 20,
    commission: 50, // Market commission
};

/**
 * Calculate dynamic vehicle rate based on fuel prices
 */
function getDynamicVehicleRate(vehicleType, fuelPrice = 90.5) {
    const type = vehicleType.toLowerCase();
    const baseRate = BASE_VEHICLE_RATES[type] || BASE_VEHICLE_RATES.truck;
    const sensitivity = FUEL_SENSITIVITY[type] || FUEL_SENSITIVITY.truck;

    // Adjustment based on deviation from reference fuel price (₹90)
    const deviation = fuelPrice - 90;
    const rateAdjustment = deviation * sensitivity;

    return Math.round((baseRate + rateAdjustment) * 100) / 100;
}

/**
 * Calculate profit for a single mandi option
 * @param {object} mandi - Mandi details with price and location
 * @param {number} distance - Distance in kilometers
 * @param {number} quantity - Crop quantity in quintals
 * @param {string} vehicleType - Type of vehicle
 * @param {object} options - Optional calculation parameters
 * @returns {object} Profit breakdown
 */
function calculateProfit(mandi, distance, quantity, vehicleType, options = {}) {
    const { customVehicleRate = null, isRideShare = false, fuelPrice = 90.5 } = options;

    // 1. Calculate Revenue
    const pricePerQuintal = mandi.price || mandi.pricePerQuintal;
    const revenue = pricePerQuintal * quantity;

    // 2. Calculate Transport Cost
    const vehicleRate = customVehicleRate !== null
        ? customVehicleRate
        : getDynamicVehicleRate(vehicleType, fuelPrice);

    let transportCost = distance * vehicleRate;

    // Apply advanced ride-share logic
    let costShareInfo = null;
    if (isRideShare) {
        if (options.poolPartner) {
            const { quantity: partnerQty, farmerName } = options.poolPartner;
            const totalQty = quantity + partnerQty;

            // Proportional split: User pays (UserQty / TotalQty) of the cost
            // We apply an additional 15% "pooling efficiency" bonus
            const baseRatio = quantity / totalQty;
            const sharedRatio = Math.max(0.3, Math.min(0.7, baseRatio * 0.85));

            const originalCost = transportCost;
            transportCost = transportCost * sharedRatio;

            costShareInfo = {
                partnerName: farmerName,
                partnerQuantity: partnerQty,
                userRatio: Math.round(sharedRatio * 100),
                savings: Math.round(originalCost - transportCost)
            };
        } else {
            // Fallback to legacy 40% discount if no specific partner data
            transportCost = transportCost * 0.6;
        }
    }

    // 3. Calculate Handling Costs
    const loadingCost = HANDLING_CHARGES.loading * quantity;
    const unloadingCost = HANDLING_CHARGES.unloading * quantity;
    const commissionCost = HANDLING_CHARGES.commission * quantity;

    const totalHandlingCost = loadingCost + unloadingCost + commissionCost;

    // 4. Calculate Total Cost
    const totalCost = transportCost + totalHandlingCost;

    // 5. Calculate Net Profit
    const netProfit = revenue - totalCost;

    // 6. Calculate profit per quintal
    const profitPerQuintal = netProfit / quantity;

    // 7. Calculate profit percentage
    const profitPercentage = (netProfit / revenue) * 100;

    return {
        mandiName: mandi.name,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        price: pricePerQuintal,
        revenue: Math.round(revenue),
        transportCost: Math.round(transportCost),
        handlingCost: Math.round(totalHandlingCost),
        totalCost: Math.round(totalCost),
        netProfit: Math.round(netProfit),
        profitPerQuintal: Math.round(profitPerQuintal),
        profitPercentage: Math.round(profitPercentage * 10) / 10,
        breakdown: {
            loading: loadingCost,
            unloading: unloadingCost,
            commission: commissionCost,
            transport: Math.round(transportCost),
            isRideShare,
            costShareInfo,
            vehicleRate,
            fuelPrice
        },
        priceHistory: mandi.priceHistory || [],
        historicalTrend: mandi.historicalTrend || null,
    };
}

/**
 * Calculate profits for multiple mandis
 * @param {Array} mandiDistances - Array of {destination, distance} objects
 * @param {number} quantity - Crop quantity in quintals
 * @param {string} vehicleType - Type of vehicle
 * @param {object} options - Optional calculation parameters
 * @returns {Array} Array of profit calculations
 */
function calculateMultipleProfits(mandiDistances, quantity, vehicleType, options = {}) {
    return mandiDistances.map(item => {
        return calculateProfit(
            item.destination,
            item.distance,
            quantity,
            vehicleType,
            options
        );
    });
}

/**
 * Get vehicle rate per kilometer
 */
function getVehicleRate(vehicleType, fuelPrice = 90.5) {
    return getDynamicVehicleRate(vehicleType, fuelPrice);
}

/**
 * Get all available vehicle types with rates
 */
function getAvailableVehicles(fuelPrice = 90.5) {
    return Object.entries(BASE_VEHICLE_RATES).map(([type, rate]) => ({
        type,
        ratePerKm: getDynamicVehicleRate(type, fuelPrice),
        displayName: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }));
}

/**
 * Calculate break-even distance
 */
function calculateBreakEvenDistance(localPrice, distantPrice, vehicleType, quantity, fuelPrice = 90.5) {
    const priceDifference = distantPrice - localPrice;
    const revenueGain = priceDifference * quantity;
    const vehicleRate = getVehicleRate(vehicleType, fuelPrice);

    // Break-even when: revenueGain = distanceCost
    const breakEvenDistance = revenueGain / vehicleRate;

    return Math.round(breakEvenDistance * 10) / 10;
}

module.exports = {
    calculateProfit,
    calculateMultipleProfits,
    getVehicleRate,
    getAvailableVehicles,
    calculateBreakEvenDistance,
    VEHICLE_RATES: BASE_VEHICLE_RATES, // Keep for backward compatibility
    HANDLING_CHARGES,
};
