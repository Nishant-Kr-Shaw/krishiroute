/**
 * Decision Service
 * Optimization algorithm to select the best mandi
 * Selects based on MAXIMUM NET PROFIT, not distance or price alone
 */

const perishabilityService = require('./perishability.service');

/**
 * Find the best mandi based on maximum net profit
 * @param {Array} profitResults - Array of profit calculations
 * @param {string} crop - Crop name for perishability analysis (optional)
 * @returns {object} Optimization decision with best mandi and comparison
 */
function findBestMandi(profitResults, crop = null) {
    if (!profitResults || profitResults.length === 0) {
        throw new Error('No mandi options available for optimization');
    }

    // Sort by net profit (descending)
    const sortedResults = [...profitResults].map(result => ({
        ...result,
        volatilityAlert: checkVolatility(result.priceHistory),
    })).sort((a, b) => b.netProfit - a.netProfit);

    const bestMandi = sortedResults[0];
    const worstMandi = sortedResults[sortedResults.length - 1];
    const localMandi = findLocalMandi(sortedResults); // Nearest mandi

    // Calculate extra profit compared to alternatives
    const extraProfitVsWorst = bestMandi.netProfit - worstMandi.netProfit;
    const extraProfitVsLocal = localMandi
        ? bestMandi.netProfit - localMandi.netProfit
        : 0;

    // Determine if the best choice is worth the extra distance
    const worthExtraDistance = calculateWorthiness(bestMandi, localMandi);

    // Analyze perishability if crop is provided
    let perishabilityAnalysis = null;
    if (crop) {
        const bestMandiAnalysis = perishabilityService.analyzePerishability(crop, bestMandi);
        const localMandiAnalysis = localMandi
            ? perishabilityService.analyzePerishability(crop, localMandi)
            : null;

        perishabilityAnalysis = {
            bestMandi: bestMandiAnalysis,
            localMandi: localMandiAnalysis,
            shouldConsiderLocal: bestMandiAnalysis.riskLevel === 'high' &&
                localMandiAnalysis &&
                localMandiAnalysis.riskLevel !== 'high',
        };
    }

    return {
        bestMandi: {
            name: bestMandi.mandiName,
            netProfit: bestMandi.netProfit,
            distance: bestMandi.distance,
            price: bestMandi.price,
            profitPerQuintal: bestMandi.profitPerQuintal,
            profitPercentage: bestMandi.profitPercentage,
            volatilityAlert: bestMandi.volatilityAlert,
            historicalTrend: bestMandi.historicalTrend,
        },
        localMandi: localMandi ? {
            name: localMandi.mandiName,
            netProfit: localMandi.netProfit,
            distance: localMandi.distance,
            price: localMandi.price,
        } : null,
        extraProfit: extraProfitVsLocal,
        extraProfitVsWorst: extraProfitVsWorst,
        isLocalBest: localMandi ? bestMandi.mandiName === localMandi.mandiName : false,
        worthExtraDistance: worthExtraDistance,
        recommendation: generateRecommendation(bestMandi, localMandi, extraProfitVsLocal),
        perishability: perishabilityAnalysis,
        allOptions: sortedResults,
        totalOptions: sortedResults.length,
    };
}

/**
 * Find the nearest (local) mandi from results
 */
function findLocalMandi(results) {
    if (!results || results.length === 0) return null;

    return [...results].sort((a, b) => a.distance - b.distance)[0];
}

/**
 * Calculate if extra distance is worth the profit gain
 * Uses a simple heuristic: profit gain per km should be significant
 */
function calculateWorthiness(bestMandi, localMandi) {
    if (!localMandi || bestMandi.mandiName === localMandi.mandiName) {
        return {
            worth: true,
            reason: 'Best option is also the nearest',
        };
    }

    const extraDistance = bestMandi.distance - localMandi.distance;
    const extraProfit = bestMandi.netProfit - localMandi.netProfit;
    const profitPerExtraKm = extraProfit / extraDistance;

    // Threshold: At least ₹50 extra profit per km is worth it
    const worthThreshold = 50;

    return {
        worth: profitPerExtraKm >= worthThreshold,
        profitPerExtraKm: Math.round(profitPerExtraKm),
        extraDistance: Math.round(extraDistance * 10) / 10,
        extraProfit: Math.round(extraProfit),
        reason: profitPerExtraKm >= worthThreshold
            ? `Gain of ₹${Math.round(profitPerExtraKm)}/km justifies extra distance`
            : 'Extra distance may not justify the profit gain',
    };
}

/**
 * Generate human-readable recommendation
 */
function generateRecommendation(bestMandi, localMandi, extraProfit) {
    if (!localMandi || bestMandi.mandiName === localMandi.mandiName) {
        return `Your best option is ${bestMandi.mandiName}, which is also the nearest market. Go ahead with confidence!`;
    }

    if (extraProfit > 500) {
        return `Travel to ${bestMandi.mandiName}! You'll earn ₹${Math.round(extraProfit)} more than your local market at ${localMandi.mandiName}.`;
    } else if (extraProfit > 0) {
        return `${bestMandi.mandiName} offers slightly better profit (₹${Math.round(extraProfit)} more), but ${localMandi.mandiName} is closer. Consider fuel and time costs.`;
    } else {
        return `Stick with ${localMandi.mandiName} - it's closer and offers the best profit!`;
    }
}

/**
 * Get top N mandi options
 */
function getTopOptions(profitResults, n = 3) {
    return [...profitResults]
        .sort((a, b) => b.netProfit - a.netProfit)
        .slice(0, n);
}

/**
 * Compare two specific mandis
 */
function compareMandis(mandi1, mandi2) {
    const profitDiff = mandi1.netProfit - mandi2.netProfit;
    const distanceDiff = mandi1.distance - mandi2.distance;
    const priceDiff = mandi1.price - mandi2.price;

    return {
        winner: profitDiff > 0 ? mandi1.mandiName : mandi2.mandiName,
        profitDifference: Math.abs(profitDiff),
        distanceDifference: Math.abs(distanceDiff),
        priceDifference: Math.abs(priceDiff),
        analysis: {
            profitWinner: profitDiff > 0 ? mandi1.mandiName : mandi2.mandiName,
            priceWinner: priceDiff > 0 ? mandi1.mandiName : mandi2.mandiName,
            distanceWinner: distanceDiff < 0 ? mandi1.mandiName : mandi2.mandiName,
        },
    };
}

module.exports = {
    findBestMandi,
    findLocalMandi,
    getTopOptions,
    compareMandis,
    calculateWorthiness,
    checkVolatility,
};

/**
 * Check for price volatility (3 days of consecutive drops)
 */
function checkVolatility(priceHistory) {
    if (!priceHistory || priceHistory.length < 3) return false;

    // energetic check: look for strictly decreasing prices in the last 3 entries
    // priceHistory is ordered oldest to newest.
    // So: history[n-3] > history[n-2] > history[n-1]

    // We need at least 3 points.
    // Let's take the last 3 points.
    const recent = priceHistory.slice(-3);

    if (recent.length < 3) return false;

    // Check if prices are strictly decreasing
    // recent[0] is oldest of the 3, recent[2] is newest
    return recent[0].price > recent[1].price && recent[1].price > recent[2].price;
}
