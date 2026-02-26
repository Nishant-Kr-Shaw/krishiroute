const axios = require('axios');

/**
 * Distance Service
 * Calculates road distance between source and destination
 * Uses Google Maps Distance Matrix API with Haversine formula fallback
 */

/**
 * Calculate distance from source to multiple destinations
 * @param {object} source - Source location {lat, lng}
 * @param {Array} destinations - Array of destination objects with location {lat, lng}
 * @returns {Promise<Array>} Array with distance in kilometers
 */
async function calculateDistances(source, destinations) {
    const useMockData = process.env.USE_MOCK_DATA === 'true' || !process.env.GOOGLE_MAPS_API_KEY;

    if (useMockData) {
        console.log('Using Haversine formula for distance calculation (API key not configured)');
        return destinations.map(dest => ({
            destination: dest,
            distance: calculateHaversineDistance(
                source.lat,
                source.lng,
                dest.location.lat,
                dest.location.lng
            ),
        }));
    }

    try {
        // Real Google Maps API implementation
        const origins = `${source.lat},${source.lng}`;
        const destinationCoords = destinations
            .map(d => `${d.location.lat},${d.location.lng}`)
            .join('|');

        const response = await axios.get(process.env.GOOGLE_MAPS_BASE_URL, {
            params: {
                origins: origins,
                destinations: destinationCoords,
                key: process.env.GOOGLE_MAPS_API_KEY,
                mode: 'driving',
                units: 'metric',
            },
            timeout: 5000,
        });

        if (response.data.status === 'OK') {
            return destinations.map((dest, index) => {
                const element = response.data.rows[0].elements[index];
                return {
                    destination: dest,
                    distance: element.status === 'OK'
                        ? element.distance.value / 1000 // Convert meters to km
                        : calculateHaversineDistance(source.lat, source.lng, dest.location.lat, dest.location.lng),
                };
            });
        } else {
            throw new Error(`Google Maps API error: ${response.data.status}`);
        }

    } catch (error) {
        console.warn('Google Maps API error:', error.message);
        console.log('Falling back to Haversine formula');

        return destinations.map(dest => ({
            destination: dest,
            distance: calculateHaversineDistance(
                source.lat,
                source.lng,
                dest.location.lat,
                dest.location.lng
            ),
        }));
    }
}

/**
 * Calculate straight-line distance using Haversine formula
 * @param {number} lat1 - Source latitude
 * @param {number} lon1 - Source longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lon2 - Destination longitude
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Apply a 1.3x multiplier to approximate road distance from straight-line
    return Math.round(distance * 1.3 * 100) / 100;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Filter destinations by maximum distance
 */
function filterByMaxDistance(distanceResults, maxDistanceKm = 100) {
    return distanceResults.filter(result => result.distance <= maxDistanceKm);
}

module.exports = {
    calculateDistances,
    filterByMaxDistance,
    calculateHaversineDistance,
};
