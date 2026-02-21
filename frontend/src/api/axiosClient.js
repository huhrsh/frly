import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://192.168.1.17:8080/api', // Update if backend port differs
  baseURL: 'http://172.20.10.3:8080/api', // Update if backend port differs
  // baseURL: 'http://localhost:8080/api', // Update if backend port differs
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach Group ID if present in localStorage or Session
    const currentGroupId = localStorage.getItem('currentGroupId');
    if (currentGroupId) {
      config.headers['X-Group-ID'] = currentGroupId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for 401/403 handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // We might want to trigger a redirect here or handle it in UI
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
