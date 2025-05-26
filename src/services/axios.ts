import axios from 'axios';

const axiosApi = axios.create({
    baseURL: './api',
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

export default axiosApi;