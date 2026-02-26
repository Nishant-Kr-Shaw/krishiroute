import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

/**
 * API Client for Krishi Route Backend
 */

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Optimize trip to find best mandi
 */
export const optimizeTrip = async (data) => {
    try {
        const response = await api.post('/optimize', data);
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

/**
 * Get available crops
 */
export const getAvailableCrops = async () => {
    try {
        const response = await api.get('/crops');
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

/**
 * Get available vehicle types
 */
export const getAvailableVehicles = async () => {
    try {
        const response = await api.get('/vehicles');
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

/**
 * Health check
 */
export const healthCheck = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

/**
 * Error handler
 */
function handleError(error) {
    if (error.response) {
        // Server responded with error
        return {
            message: error.response.data.message || 'An error occurred',
            errors: error.response.data.errors || [],
            status: error.response.status,
        };
    } else if (error.request) {
        // Request made but no response
        return {
            message: 'Unable to connect to server. Please check if backend is running.',
            status: 0,
        };
    } else {
        // Something else happened
        return {
            message: error.message || 'An unexpected error occurred',
            status: -1,
        };
    }
}

export default api;
