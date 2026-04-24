export const environment = {
  production: false,
  useKeycloak: false,

  // API Gateway (proxy Angular)
  apiUrl: '/api',

  // Challenges
  challengeTasksPath: '/tasks/challenge/{id}',
  addTaskPath: '/tasks/{id}',
  appName: 'ChallengePro',
  version: '1.0.0',
  projectApiUrl: 'http://localhost:8085',

  // WebSocket skill-management
  wsUrl: 'http://localhost:8081'
};