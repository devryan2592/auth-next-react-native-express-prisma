import { ENVIRONMENT, CLIENT_URLS } from '@/constants';

const allowedOrigins = [
  CLIENT_URLS.DEVELOPMENT.NEXT,
  CLIENT_URLS.DEVELOPMENT.EXPO,
  CLIENT_URLS.DEVELOPMENT.EXPO_ALTERNATIVE,
  CLIENT_URLS.DEVELOPMENT.VITE,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:19006',
  'http://localhost:8000',
  'https://localhost:3000',
  'https://localhost:5173',
  'https://localhost:19006',
  'https://localhost:8000',
];

if (process.env.NODE_ENV === ENVIRONMENT.PRODUCTION) {
  const { CLIENT: clientUrl, API: apiUrl } = CLIENT_URLS.PRODUCTION;
  if (clientUrl) allowedOrigins.push(clientUrl);
  if (apiUrl) allowedOrigins.push(apiUrl);
}

export default allowedOrigins; 