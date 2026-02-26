const mongoose = require('mongoose');

/**
 * PriceHistory Schema
 * Stores historical price data for trend analysis and predictions
 */
const priceHistorySchema = new mongoose.Schema({
    mandi: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MandiCache',
        required: true,
    },
    mandiName: {
        type: String,
        required: true,
    },
    crop: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    priceType: {
        type: String,
        enum: ['min', 'max', 'modal'],
        default: 'modal',
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    source: {
        type: String,
        enum: ['agmarknet', 'manual', 'estimated'],
        default: 'agmarknet',
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries
priceHistorySchema.index({ mandi: 1, crop: 1, date: -1 });
priceHistorySchema.index({ crop: 1, date: -1 });

// Static method to get average price over time period
priceHistorySchema.statics.getAveragePrice = async function (crop, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.aggregate([
        {
            $match: {
                crop: crop,
                date: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: null,
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
    ]);

    return result[0] || null;
};

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
