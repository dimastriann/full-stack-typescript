import { ApolloClient, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { GRAPHQL_URL } from './config/api';

const httpLink = createUploadLink({
  uri: GRAPHQL_URL,
  headers: {
    'Apollo-Require-Preflight': 'true', // Recommended for security
  },
});

const authLink = setContext((_, { headers }) => {
  const token = sessionStorage.getItem('session_id');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
