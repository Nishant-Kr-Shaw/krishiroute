/**
 * Perishability Service
 * Calculates crop spoilage risk based on distance and perishability ratings
 * Generates warnings for crops at risk of spoilage
 */

// Perishability ratings for common crops
const PERISHABILITY_RATINGS = {
    // High perishability (leafy vegetables, soft fruits)
    tomato: {
        level: 'high',
        safeDistance: 50, // km
        spoilageRate: 0.20, // 20% per 50km beyond safe distance
        shelfLife: '3-7 days',
    },
    lettuce: {
        level: 'high',
        safeDistance: 30,
        spoilageRate: 0.25,
        shelfLife: '3-5 days',
    },
    spinach: {
        level: 'high',
        safeDistance: 30,
        spoilageRate: 0.25,
        shelfLife: '3-5 days',
    },
    cucumber: {
        level: 'high',
        safeDistance: 40,
        spoilageRate: 0.20,
        shelfLife: '7-10 days',
    },

    // Medium perishability (root vegetables, hardy vegetables)
    potato: {
        level: 'medium',
        safeDistance: 150,
        spoilageRate: 0.10, // 10% per 50km beyond safe distance
        shelfLife: '2-3 months',
    },
    onion: {
        level: 'medium',
        safeDistance: 150,
        spoilageRate: 0.10,
        shelfLife: '1-2 months',
    },
    carrot: {
        level: 'medium',
        safeDistance: 120,
        spoilageRate: 0.12,
        shelfLife: '2-4 weeks',
    },
    cabbage: {
        level: 'medium',
        safeDistance: 100,
        spoilageRate: 0.15,
        shelfLife: '2-3 weeks',
    },

    // Low perishability (grains, pulses, dry crops)
    rice: {
        level: 'low',
        safeDistance: 300,
        spoilageRate: 0.02, // 2% per 50km beyond safe distance
        shelfLife: '6-12 months',
    },
    wheat: {
        level: 'low',
        safeDistance: 300,
        spoilageRate: 0.02,
        shelfLife: '6-12 months',
    },
    corn: {
        level: 'low',
        safeDistance: 250,
        spoilageRate: 0.05,
        shelfLife: '3-6 months',
    },
    soybean: {
        level: 'low',
        safeDistance: 300,
        spoilageRate: 0.02,
        shelfLife: '6-12 months',
    },

    // Default for unknown crops (medium perishability)
    default: {
        level: 'medium',
        safeDistance: 100,
        spoilageRate: 0.12,
        shelfLife: '1-2 weeks',
    },
};

/**
 * Get perishability rating for a crop
 * @param {string} crop - Crop name
 * @returns {object} Perishability data
 */
function getPerishabilityRating(crop) {
    const normalizedCrop = crop.toLowerCase().trim();
    return PERISHABILITY_RATINGS[normalizedCrop] || PERISHABILITY_RATINGS.default;
}

/**
 * Calculate spoilage percentage and adjusted profit
 * @param {string} crop - Crop name
 * @param {number} distance - Distance in kilometers
 * @param {number} netProfit - Original net profit
 * @returns {object} Spoilage calculation results
 */
function calculateSpoilage(crop, distance, netProfit = 0) {
    const rating = getPerishabilityRating(crop);

    if (distance <= rating.safeDistance) {
        return {
            spoilagePercentage: 0,
            spoilageAmount: 0,
            adjustedProfit: netProfit,
            isSafe: true,
            riskLevel: 'low',
        };
    }

    // Calculate excess distance beyond safe threshold
    const excessDistance = distance - rating.safeDistance;

    // Calculate spoilage rate based on excess distance
    // Each 50km beyond safe distance adds spoilageRate percentage
    const spoilageMultiplier = Math.floor(excessDistance / 50);
    const spoilagePercentage = Math.min(
        rating.spoilageRate * 100 * (spoilageMultiplier + (excessDistance % 50) / 50),
        50 // Cap at 50% maximum spoilage
    );

    // Calculate monetary loss due to spoilage
    const spoilageAmount = (netProfit * spoilagePercentage) / 100;
    const adjustedProfit = netProfit - spoilageAmount;

    // Determine risk level
    let riskLevel;
    if (spoilagePercentage >= 15) {
        riskLevel = 'high';
    } else if (spoilagePercentage >= 5) {
        riskLevel = 'medium';
    } else {
        riskLevel = 'low';
    }

    return {
        spoilagePercentage: Math.round(spoilagePercentage * 10) / 10,
        spoilageAmount: Math.round(spoilageAmount),
        adjustedProfit: Math.round(adjustedProfit),
        isSafe: false,
        riskLevel,
        excessDistance: Math.round(excessDistance),
    };
}

/**
 * Generate perishability warning message
 * @param {string} crop - Crop name
 * @param {number} distance - Distance in kilometers
 * @param {object} spoilageData - Spoilage calculation results
 * @returns {object} Warning data with message and recommendations
 */
function generatePerishabilityWarning(crop, distance, spoilageData) {
    const rating = getPerishabilityRating(crop);

    if (spoilageData.isSafe) {
        return {
            hasWarning: false,
            severity: 'none',
            icon: 'OK',
            message: `${crop.charAt(0).toUpperCase() + crop.slice(1)} is safe to transport at ${distance}km`,
            recommendation: 'No special precautions needed.',
        };
    }

    let icon, severity, message, recommendation;

    if (spoilageData.riskLevel === 'high') {
        icon = 'HIGH';
        severity = 'high';
        message = `HIGH SPOILAGE RISK: ${crop.charAt(0).toUpperCase() + crop.slice(1)} may spoil at ${distance}km distance!`;
        recommendation = `Expected ${spoilageData.spoilagePercentage}% spoilage (loss of ₹${spoilageData.spoilageAmount.toLocaleString()}). Consider selling locally or using refrigerated transport.`;
    } else if (spoilageData.riskLevel === 'medium') {
        icon = 'MED';
        severity = 'medium';
        message = `MODERATE SPOILAGE RISK: ${crop.charAt(0).toUpperCase() + crop.slice(1)} at ${distance}km from safe range`;
        recommendation = `Expected ${spoilageData.spoilagePercentage}% spoilage (loss of ₹${spoilageData.spoilageAmount.toLocaleString()}). Transport quickly to minimize losses.`;
    } else {
        icon = 'LOW';
        severity = 'low';
        message = `Minor spoilage risk for ${crop} at ${distance}km`;
        recommendation = `Expected ${spoilageData.spoilagePercentage}% spoilage. Acceptable loss for better prices.`;
    }

    return {
        hasWarning: true,
        severity,
        icon,
        message,
        recommendation,
        details: {
            crop: crop,
            distance: distance,
            safeDistance: rating.safeDistance,
            excessDistance: spoilageData.excessDistance,
            perishabilityLevel: rating.level,
            shelfLife: rating.shelfLife,
        },
    };
}

/**
 * Analyze perishability for a mandi option
 * @param {string} crop - Crop name
 * @param {object} mandiResult - Mandi profit calculation result
 * @returns {object} Complete perishability analysis
 */
function analyzePerishability(crop, mandiResult) {
    const spoilageData = calculateSpoilage(crop, mandiResult.distance, mandiResult.netProfit);
    const warning = generatePerishabilityWarning(crop, mandiResult.distance, spoilageData);

    return {
        ...spoilageData,
        warning,
        originalProfit: mandiResult.netProfit,
    };
}

module.exports = {
    getPerishabilityRating,
    calculateSpoilage,
    generatePerishabilityWarning,
    analyzePerishability,
    PERISHABILITY_RATINGS,
};
