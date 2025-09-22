import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Simple HTTP link for GraphQL queries (no file uploads)
const graphqlUrl = process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:8080/query';
console.log('GraphQL URL:', graphqlUrl); // Debug log
const httpLink = createHttpLink({
  uri: graphqlUrl,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});




