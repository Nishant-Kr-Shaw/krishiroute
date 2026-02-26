/**
 * Pooling Service
 * Simulates real-time ride-sharing opportunities from other farmers
 */

/**
 * Generate a list of simulated pool requests near the source location
 * @param {object} source - {lat, lng} of the user
 * @param {string} targetCrop - The crop the user is selling
 * @returns {Array} List of pool opportunities
 */
function getPoolOpportunities(source, targetCrop) {
    const opportunities = [
        {
            id: 'pool_1',
            farmerName: 'Rajesh Kumar',
            location: {
                lat: source.lat + (Math.random() * 0.04 - 0.02),
                lng: source.lng + (Math.random() * 0.04 - 0.02),
            },
            crop: targetCrop,
            quantity: Math.floor(Math.random() * 20) + 10, // 10-30 quintals
            distanceFromUser: 1.2,
            isCompatible: true
        },
        {
            id: 'pool_2',
            farmerName: 'Suresh Patil',
            location: {
                lat: source.lat + (Math.random() * 0.06 - 0.03),
                lng: source.lng + (Math.random() * 0.06 - 0.03),
            },
            crop: 'Wheat', // Different compatible crop
            quantity: Math.floor(Math.random() * 30) + 20, // 20-50 quintals
            distanceFromUser: 2.8,
            isCompatible: true
        },
        {
            id: 'pool_3',
            farmerName: 'Meena Devi',
            location: {
                lat: source.lat + (Math.random() * 0.08 - 0.04),
                lng: source.lng + (Math.random() * 0.08 - 0.04),
            },
            crop: targetCrop,
            quantity: Math.floor(Math.random() * 15) + 5, // 5-20 quintals
            distanceFromUser: 4.5,
            isCompatible: true
        }
    ];

    // Simplified filtering: Only show opportunities for the same crop
    // This addresses the user requirement: "pool cards to only show the crop regarding pooling opportunities"
    const filteredOpportunities = opportunities.filter(op => 
        op.crop.toLowerCase() === targetCrop.toLowerCase()
    );

    // Calculate actual distance from user for sorting
    return filteredOpportunities.sort((a, b) => a.distanceFromUser - b.distanceFromUser);
}

/**
 * Calculate the cost share factor based on weights
 * @param {number} userQuantity 
 * @param {number} partnerQuantity 
 * @returns {number} The ratio of cost the user pays (0.0 to 1.0)
 */
function calculateCostShareFactor(userQuantity, partnerQuantity) {
    const totalQuantity = userQuantity + partnerQuantity;
    // User pays proportional to their weight in the pool
    // We add a small "coordination discount" to make it better than solo
    const simpleRatio = userQuantity / totalQuantity;
    return Math.max(0.3, Math.min(0.7, simpleRatio));
}

module.exports = {
    getPoolOpportunities,
    calculateCostShareFactor
};
