/**
 * Fuel Price Service
 * Fetches and caches diesel prices for transport cost calculation.
 * Defaults to Indian national average diesel prices.
 */

// Cache structure
let fuelPriceCache = {
    price: 90.5, // Default/Fallback Indian Diesel Price in ₹
    lastUpdated: null,
    ttl: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Get the latest diesel price
 * In production, this would call a real fuel price API.
 * For now, it provides a realistic rate with small fluctuations to simulate "live" data.
 */
const getLatestFuelPrice = async () => {
    const now = Date.now();

    // Return cached price if valid
    if (fuelPriceCache.lastUpdated && (now - fuelPriceCache.lastUpdated < fuelPriceCache.ttl)) {
        return fuelPriceCache.price;
    }

    try {
        /**
         * REAL API INTEGRATION PLACEHOLDER
         * const response = await axios.get('https://api.fuelpricesindia.com/latest');
         * const livePrice = response.data.diesel.avg;
         */

        // Simulating a "Live" fetch with a realistic base price + small daily fluctuation
        // Indian Diesel range usually ₹87 - ₹94
        const basePrice = 89.5;
        const fluctuation = (Math.sin(now / (24 * 60 * 60 * 1000)) * 2); // Daily wave +/- 2 rupees
        const livePrice = Math.round((basePrice + fluctuation) * 100) / 100;

        fuelPriceCache.price = livePrice;
        fuelPriceCache.lastUpdated = now;

        console.log(`⛽ FuelPriceService: Updated live price to ₹${livePrice}/L`);
        return livePrice;
    } catch (error) {
        console.error('❌ FuelPriceService: Failed to fetch live price, using fallback:', error);
        return fuelPriceCache.price;
    }
};

module.exports = {
    getLatestFuelPrice
};
