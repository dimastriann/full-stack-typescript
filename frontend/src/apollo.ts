import { ApolloClient, InMemoryCache, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { GRAPHQL_URL } from './config/api';

const httpLink = createUploadLink({
  uri: GRAPHQL_URL,
  headers: {
    'Apollo-Require-Preflight': 'true', // Recommended for security
  },
  credentials: 'include',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: (() => {
      if (GRAPHQL_URL.startsWith('http')) {
        return GRAPHQL_URL.replace(/^http/, 'ws');
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/graphql`;
    })(),
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          conversationMessages: {
            // Key by the conversationId parameter only, ignore cursor/limit for the cache key
            keyArgs: ['conversationId'],
            merge(existing = [], incoming) {
              // De-duplicate messages based on id
              const merged = [...existing];
              const incomingMap = new Map(incoming.map((item: any) => [item.__ref || item.id, item]));
              
              for (let i = 0; i < merged.length; i++) {
                const itemRefOrId = merged[i].__ref || merged[i].id;
                if (incomingMap.has(itemRefOrId)) {
                  merged[i] = incomingMap.get(itemRefOrId);
                  incomingMap.delete(itemRefOrId);
                }
              }
              
              return [...merged, ...Array.from(incomingMap.values())];
            },
          },
          users: {
            keyArgs: false, // Cache globally as a single list, skip pagination args
            merge(_, incoming) {
              return incoming;
            },
          },
          projects: {
            keyArgs: false,
            merge(_, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});

