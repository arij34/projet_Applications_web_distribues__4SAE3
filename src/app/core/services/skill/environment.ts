export const environment = {
  production: false,

  // ✅ Proxy Angular → API Gateway :8081
  apiUrl: '/api',

  // WebSocket direct vers skill-management (pas via proxy)
  wsUrl: 'https://localhost:8443'
};
