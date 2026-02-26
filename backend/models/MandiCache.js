const mongoose = require('mongoose');

/**
 * MandiCache Schema
 * Stores cached mandi (market) information including location and prices
 */
const mandiCacheSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
    },
    district: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
    },
    prices: [{
        crop: {
            type: String,
            required: true,
        },
        minPrice: {
            type: Number,
            required: true,
        },
        maxPrice: {
            type: Number,
            required: true,
        },
        modalPrice: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            default: 'Quintal',
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    active: {
        type: Boolean,
        default: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Create geospatial index for location-based queries
mandiCacheSchema.index({ location: '2dsphere' });

// Index for quick price lookups
mandiCacheSchema.index({ 'prices.crop': 1 });

// Method to get price for a specific crop
mandiCacheSchema.methods.getPriceForCrop = function (cropName) {
    const priceData = this.prices.find(
        p => p.crop.toLowerCase() === cropName.toLowerCase()
    );
    return priceData ? priceData.modalPrice : null;
};

module.exports = mongoose.model('MandiCache', mandiCacheSchema);
