import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

export function getErrorMessage(error) {
  if (error.response?.data?.error) return error.response.data.error
  if (error.code === 'ERR_NETWORK') return 'Cannot reach the API. Check that the backend and MySQL are running.'
  return error.message || 'Something went wrong. Please try again.'
}

export default api
