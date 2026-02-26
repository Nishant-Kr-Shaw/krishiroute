import axios from 'axios';
import { API_BASE_URL } from './api';

/**
 * Fetch the latest fuel price from the backend
 */
export const getLatestFuelPrice = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/fuel/price`);
        return response.data;
    } catch (error) {
        console.error('Error fetching fuel price:', error);
        return {
            success: false,
            price: 90.5, // Fallback
            message: 'Using default fuel rate'
        };
    }
};
