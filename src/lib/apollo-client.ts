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
  uri:
    process.env.NEXT_PUBLIC_USE_MOCK_SERVER === "true"
      ? "http://localhost:4000"
      : isMainnet()
        ? "https://endur-graphql-api-v2.onrender.com"
        : "https://graphql.sepolia.endur.fi",
  cache: new InMemoryCache(),
  defaultOptions,
});

export default apolloClient;
