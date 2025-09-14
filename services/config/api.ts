import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_BASIC_API_URL,
  timeout: 10000,

});

//request eka yanna mohothkt kalin check krnn puluwn
api.interceptors.request.use(async (config) => {
    // config.headers.Authorization = `Beare ${token}`//Example of adding Authorization headder
    return config;
})

//respond eka enn mohothkt kalin check krnn puluwn
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)



export default api;

//accesstoken - 1h uparima
//refresh token - 7 dayas
