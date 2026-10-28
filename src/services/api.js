import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export function getErrorMessage(error) {
  if (error.response?.data?.error) return error.response.data.error
  if (error.code === 'ERR_NETWORK' || (error.response?.status >= 500 && error.response.status <= 599)) {
    return 'The API is unavailable. Start the Spring Boot backend and make sure it can connect to MySQL, then try again.'
  }
  if (error.code === 'ECONNABORTED') return 'The API took too long to respond. Check the backend and database, then try again.'
  return error.message || 'Something went wrong. Please try again.'
}

export default api
