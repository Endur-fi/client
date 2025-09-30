import { ApolloClient, DefaultOptions, InMemoryCache } from "@apollo/client";

import { isMainnet } from "@/constants";

export const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: "no-cache",
    errorPolicy: "ignore",
  },
  query: {
    fetchPolicy: "no-cache",
    errorPolicy: "all",
  },
};

const apolloClient = new ApolloClient({
  uri: isMainnet()
    ? "https://endur-graphql-api-v2.onrender.com"
    : "https://graphql.sepolia.endur.fi",
  // uri: "http://localhost:4000",
  cache: new InMemoryCache(),
  defaultOptions,
});

export default apolloClient;
