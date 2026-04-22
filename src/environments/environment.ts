export const environment = {
  production: false,

  // API Gateway (proxy Angular)
  apiUrl: '/api',
  apiBaseUrl: 'http://localhost:8150',
  userApiBaseUrl: 'http://localhost:8090',

  // Challenges
  challengeTasksPath: '/tasks/challenge/{id}',
  addTaskPath: '/tasks/{id}',
  appName: 'ChallengePro',
  version: '1.0.0',
  projectApiUrl: 'http://localhost:8085',

  // WebSocket skill-management (proxied through Angular dev server)
  wsUrl: ''
};