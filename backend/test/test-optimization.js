const axios = require('axios');

/**
 * Test script for optimization endpoint
 */

const API_URL = 'http://localhost:5000/api';

// Test data - Farmer from Kolkata selling onions
const testData = {
    crop: 'onion',
    quantity: 20,
    vehicleType: 'truck',
    source: {
        lat: 22.5726,
        lng: 88.3639,
    },
};

async function testOptimization() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING KRISHI-ROUTE OPTIMIZATION API');
    console.log('='.repeat(60));

    try {
        console.log('\n📤 Sending optimization request...');
        console.log('Test Data:', JSON.stringify(testData, null, 2));

        const response = await axios.post(`${API_URL}/optimize`, testData);

        if (response.data.success) {
            console.log('\n✅ Optimization successful!\n');

            const { optimization, results, metadata } = response.data.data;

            console.log('🏆 BEST MANDI:', optimization.bestMandi.name);
            console.log('💰 Net Profit: ₹' + optimization.bestMandi.netProfit.toLocaleString());
            console.log('📏 Distance: ' + optimization.bestMandi.distance + ' km');
            console.log('💵 Price: ₹' + optimization.bestMandi.price + '/Quintal');

            if (optimization.localMandi) {
                console.log('\n📍 LOCAL MANDI:', optimization.localMandi.name);
                console.log('💰 Local Profit: ₹' + optimization.localMandi.netProfit.toLocaleString());
                console.log('📏 Local Distance: ' + optimization.localMandi.distance + ' km');
            }

            if (optimization.extraProfit > 0) {
                console.log('\n💎 EXTRA PROFIT: ₹' + optimization.extraProfit.toLocaleString());
                console.log('   (Gain over local mandi)');
            }

            console.log('\n💡 RECOMMENDATION:');
            console.log('   ' + optimization.recommendation);

            console.log('\n📊 ALL RESULTS:');
            console.log('─'.repeat(60));
            results.forEach((result, index) => {
                const isBest = result.mandi === optimization.bestMandi.name;
                const marker = isBest ? '⭐' : '  ';
                console.log(`${marker} ${index + 1}. ${result.mandi}`);
                console.log(`   Distance: ${result.distance} km | Net Profit: ₹${result.netProfit.toLocaleString()}`);
            });

            console.log('\n📈 METADATA:');
            console.log(`   Total Mandis Analyzed: ${metadata.totalMandisAnalyzed}`);
            console.log(`   Max Distance: ${metadata.maxDistanceKm} km`);
            console.log(`   Vehicle Rate: ₹${metadata.vehicleRate}/km`);

            console.log('\n' + '='.repeat(60));
            console.log('✅ TEST PASSED - API is working correctly!');
            console.log('='.repeat(60) + '\n');

        } else {
            console.error('❌ Optimization failed:', response.data.message);
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else if (error.request) {
            console.error('No response from server. Is the backend running?');
        } else {
            console.error('Error:', error.message);
        }
        console.log('\n' + '='.repeat(60) + '\n');
    }
}

// Run test
testOptimization();
