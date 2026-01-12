import { ApolloClient, InMemoryCache } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { GRAPHQL_URL } from './config/api';

const httpLink = createUploadLink({
  uri: GRAPHQL_URL,
  headers: {
    'Apollo-Require-Preflight': 'true', // Recommended for security
  },
  credentials: 'include',
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
