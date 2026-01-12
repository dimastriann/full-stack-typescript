const isDev = import.meta.env.VITE_DEVELOPMENT?.toLowerCase() === 'true';
const envApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// For GraphQL
export const GRAPHQL_URL = isDev ? envApiUrl : '/graphql';

// For REST calls (like attachments)
// If in dev, it's typically http://localhost:3000
// If in prod, we'll proxy /attachment via Nginx to the backend
export const API_BASE_URL = isDev ? envApiUrl.replace(/\/graphql$/, '') : '';

export const getAttachmentUrl = (id: number, download = false) => {
  const base = API_BASE_URL;
  return `${base}/attachment/file/${id}${download ? '?download=true' : ''}`;
};
