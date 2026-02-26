const agmarknetService = require('../services/agmarknet.service');
const distanceService = require('../services/distance.service');
const profitService = require('../services/profit.service');
const decisionService = require('../services/decision.service');
const fuelService = require('../services/fuel.service');
const poolingService = require('../services/pooling.service');

/**
 * Optimize Controller
 * Orchestrates the entire optimization workflow
 * This is the brain of the application - coordinates all services
 */

/**
 * Main optimization endpoint
 * POST /api/optimize
 */
async function optimizeTrip(req, res) {
    try {
        const { crop, quantity, vehicleType, source, customVehicle, isRideShare = false } = req.body;
        const customVehicleRate = customVehicle?.ratePerKm || null;

        console.log('\nStarting optimization request...');
        console.log(`Crop: ${crop}, Quantity: ${quantity} quintals, Vehicle: ${vehicleType}, RideShare: ${isRideShare}`);
        console.log(`Source: ${source.lat}, ${source.lng}`);

        // STEP 0: Fetch current fuel rates
        console.log('\nSTEP 0: Fetching fuel rates...');
        let fuelRates = { diesel: 90.5 };
        try {
            const livePrice = await fuelService.getLatestFuelPrice();
            fuelRates = { diesel: livePrice };
            console.log(`Current Diesel Price: ₹${fuelRates.diesel}/L`);
        } catch (fuelError) {
            console.warn('Failed to fetch fuel rates, using fallback:', fuelError.message);
        }

        // STEP 1: Fetch mandi prices from Agmarknet
        console.log('\nSTEP 1: Fetching mandi prices...');
        const mandis = await agmarknetService.getMandiPrices(crop, source);

        if (!mandis || mandis.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No mandis found for crop: ${crop}`,
            });
        }

        console.log(`Found ${mandis.length} mandis with prices`);

        // STEP 2: Calculate distances to each mandi
        console.log('\nSTEP 2: Calculating distances...');
        const mandiDistances = await distanceService.calculateDistances(source, mandis);
        console.log(`Calculated distances for ${mandiDistances.length} mandis`);

        // STEP 3: Filter mandis within maximum distance
        const maxDistance = parseInt(process.env.MAX_MANDI_DISTANCE_KM) || 100;
        const nearbyMandis = distanceService.filterByMaxDistance(mandiDistances, maxDistance);

        if (nearbyMandis.length === 0) {
            console.log(`No mandis found within ${maxDistance} km. Falling back to closest mandis.`);

            // Sort by distance and take top 5
            const sortedByDistance = [...mandiDistances].sort((a, b) => a.distance - b.distance);
            const closestMandis = sortedByDistance.slice(0, 5);

            if (closestMandis.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `No mandis found for crop: ${crop}`,
                });
            }

            console.log(`Using ${closestMandis.length} closest mandis outside range`);

            // Add a flag to indicate these are fallback results
            closestMandis.forEach(m => {
                m.destination.isFallback = true;
                m.destination.originalDistance = m.distance;
            });

            // Use these as nearby mandis
            nearbyMandis.push(...closestMandis);
        }

        // STEP 2.5: Find pooling opportunities
        console.log('\nSTEP 2.5: Searching for pooling partners...');
        const poolOpportunities = poolingService.getPoolOpportunities(source, crop);
        const topPartner = poolOpportunities.length > 0 ? poolOpportunities[0] : null;

        if (isRideShare && topPartner) {
            console.log(`Matched with pooling partner: ${topPartner.name} (${topPartner.quantity} quintals)`);
        }

        // STEP 4: Calculate profit for each mandi
        console.log('\nSTEP 3: Calculating profits...');
        const profitResults = profitService.calculateMultipleProfits(
            nearbyMandis,
            quantity,
            vehicleType,
            {
                customVehicleRate,
                isRideShare,
                poolPartner: isRideShare ? topPartner : null,
                fuelPrice: fuelRates.diesel
            }
        );
        console.log(`Calculated profits for ${profitResults.length} mandis`);
        if (customVehicleRate) {
            console.log(`Using custom vehicle rate: ₹${customVehicleRate}/km`);
        }

        // STEP 5: Decision engine - find best mandi with perishability analysis
        console.log('\nSTEP 4: Running optimization algorithm...');
        const decision = decisionService.findBestMandi(profitResults, crop);
        console.log(`Best mandi: ${decision.bestMandi.name}`);
        console.log(`Net profit: ₹${decision.bestMandi.netProfit}`);
        if (decision.perishability?.bestMandi?.warning?.hasWarning) {
            console.log(`Perishability warning: ${decision.perishability.bestMandi.warning.severity} risk`);
        }

        // STEP 6: Prepare response
        const response = {
            success: true,
            message: 'Optimization completed successfully',
            data: {
                metadata: {
                    crop,
                    quantity,
                    vehicleType,
                    isRideShare,
                    maxDistanceKm: maxDistance,
                    sourceLocation: source,
                    totalMandisAnalyzed: profitResults.length,
                    vehicleRate: customVehicleRate || profitService.getVehicleRate(vehicleType, fuelRates.diesel),
                    fuelPrice: fuelRates.diesel,
                    customVehicle: customVehicle || null,
                    timestamp: new Date().toISOString(),
                },
                optimization: {
                    bestMandi: decision.bestMandi,
                    localMandi: decision.localMandi,
                    extraProfit: decision.extraProfit,
                    recommendation: decision.recommendation,
                    worthExtraDistance: decision.worthExtraDistance,
                    perishability: decision.perishability,
                    // Advanced Ride-Sharing: Real-time pool opportunities
                    poolOpportunities: poolOpportunities,
                    activePoolPartner: isRideShare ? topPartner : null
                },
                results: decision.allOptions.map(result => ({
                    mandi: result.mandiName,
                    distance: result.distance,
                    price: result.price,
                    revenue: result.revenue,
                    transportCost: result.transportCost,
                    handlingCost: result.handlingCost,
                    totalCost: result.totalCost,
                    netProfit: result.netProfit,
                    profitPerQuintal: result.profitPerQuintal,
                    profitPercentage: result.profitPercentage,
                    volatilityAlert: result.volatilityAlert,
                    historicalTrend: result.historicalTrend,
                    breakdown: result.breakdown
                }))
            },
        };

        console.log('\nOptimization completed successfully!\n');

        res.status(200).json(response);

    } catch (error) {
        console.error('Optimization error:', error);

        res.status(500).json({
            success: false,
            message: 'An error occurred during optimization',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
}

/**
 * Get available crops
 * GET /api/crops
 */
function getAvailableCrops(req, res) {
    try {
        const crops = agmarknetService.getAvailableCrops();

        res.status(200).json({
            success: true,
            data: {
                crops: crops.map(crop => ({
                    name: crop,
                    displayName: crop.charAt(0).toUpperCase() + crop.slice(1),
                })),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available crops',
        });
    }
}

/**
 * Get available vehicle types
 * GET /api/vehicles
 */
async function getAvailableVehicles(req, res) {
    try {
        let fuelPrice = 90.5;
        try {
            const livePrice = await fuelService.getLatestFuelPrice();
            fuelPrice = livePrice;
        } catch (e) { }

        const vehicles = profitService.getAvailableVehicles(fuelPrice);

        res.status(200).json({
            success: true,
            data: {
                vehicles,
                fuelPrice
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available vehicles',
        });
    }
}

/**
 * Health check endpoint
 * GET /api/health
 */
function healthCheck(req, res) {
    res.status(200).json({
        success: true,
        message: 'Krishi Route API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        usingMockData: process.env.USE_MOCK_DATA === 'true',
    });
}

module.exports = {
    optimizeTrip,
    getAvailableCrops,
    getAvailableVehicles,
    healthCheck,
};
