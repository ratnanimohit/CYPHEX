import axios from "axios";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || "/api";
}

const api = axios.create({
  baseURL: getApiBaseUrl()
});

export function setApiToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
