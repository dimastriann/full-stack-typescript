import { ApolloClient, InMemoryCache, split, ApolloLink, fromPromise, Observable } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { onError } from '@apollo/client/link/error';
import { createClient } from 'graphql-ws';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { GRAPHQL_URL } from './config/api';
import { refreshSession } from './lib/authRefresh';
import { usePaywallStore } from './store/paywallStore';

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
  }),
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
  httpLink,
);

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    // Check for plan limit exceeded errors
    const limitError = graphQLErrors.find((err) =>
      err.message?.includes('Plan limit exceeded'),
    );
    if (limitError) {
      let limitType: 'project' | 'member' | 'storage' = 'project';
      if (limitError.message.includes('member')) {
        limitType = 'member';
      } else if (limitError.message.includes('storage')) {
        limitType = 'storage';
      }
      usePaywallStore.getState().openPaywall(limitType);
    }

    const hasAuthError = graphQLErrors.some(
      (err) =>
        err.extensions?.code === 'UNAUTHENTICATED' ||
        err.message === 'Unauthorized' ||
        err.message?.includes('revoked or expired'),
    );

    if (hasAuthError) {
      return fromPromise(
        refreshSession().then((refreshed) => {
          if (!refreshed) return null;
          return true;
        }),
      ).flatMap((refreshed) => {
        if (!refreshed) {
          return new Observable((observer) => {
            observer.complete();
          });
        }
        return forward(operation);
      });
    }
  }

  if (
    networkError &&
    'statusCode' in networkError &&
    networkError.statusCode === 401
  ) {
    return fromPromise(
      refreshSession().then((refreshed) => {
        if (!refreshed) return null;
        return true;
      }),
    ).flatMap((refreshed) => {
      if (!refreshed) {
        return new Observable((observer) => {
          observer.complete();
        });
      }
      return forward(operation);
    });
  }
});

export const client = new ApolloClient({
  link: ApolloLink.from([errorLink, splitLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          conversationMessages: {
            // Key by the conversationId parameter only, ignore cursor/limit for the cache key
            keyArgs: ['conversationId'],
            merge(existing = [], incoming) {
              // De-duplicate messages based on id
              const merged = [...existing] as {
                __ref?: string;
                id?: string | number;
              }[];
              const incomingMap = new Map<
                string | number | undefined,
                { __ref?: string; id?: string | number }
              >(
                incoming.map(
                  (item: { __ref?: string; id?: string | number }) => [
                    item.__ref || item.id,
                    item,
                  ],
                ),
              );

              for (let i = 0; i < merged.length; i++) {
                const itemRefOrId = merged[i].__ref || merged[i].id;
                if (incomingMap.has(itemRefOrId)) {
                  merged[i] = incomingMap.get(itemRefOrId) as {
                    __ref?: string;
                    id?: string | number;
                  };
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
