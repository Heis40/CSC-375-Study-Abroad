const BASE_URL =
  typeof window !== 'undefined'
    ? 'http://localhost:8080/api'
    : 'http://10.0.2.2:8080/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    throw new Error(`Cannot reach SmartFarm API at ${BASE_URL}. Start backend with: mvn spring-boot:run`);
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error('Received an invalid response from the SmartFarm API.');
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  createFarm: (payload) => request('/farms', { method: 'POST', body: JSON.stringify(payload) }),
  createField: (payload) => request('/fields', { method: 'POST', body: JSON.stringify(payload) }),
  getDashboard: (farmId) => request(`/dashboard/${farmId}`),
  getRecommendations: (farmId) => request(`/recommendations/${farmId}`),
  getMonitoring: (fieldId) => request(`/monitoring/${fieldId}`),
  calculateBalance: (payload) => request('/calculator/livestock-land', { method: 'POST', body: JSON.stringify(payload) }),
  getPrograms: () => request('/programs'),
  applyProgram: (programId, farmerId) => request(`/programs/${programId}/apply?farmerId=${farmerId}`, { method: 'POST' }),
  getSeasonalReport: (farmId, season = 'Spring') => request(`/reports/seasonal/${farmId}?season=${encodeURIComponent(season)}`),
};

export const setApiBaseUrl = (baseUrl) => {
  global.__SMARTFARM_API__ = baseUrl;
};
