import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Crucial for sending/receiving cookies
});

// Response interceptor to handle 401s and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // Avoid infinite loops if refresh-token itself fails with 401
            if (originalRequest.url.includes('/api/auth/refresh-token')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // Attempt to refresh tokens
                await axios.post(`${API_URL}/api/auth/refresh-token`, {}, { withCredentials: true });
                
                // If refresh succeeds, retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, we can't do much - user needs to log in again
                // We'll let the component/AuthContext handle the final failure
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
