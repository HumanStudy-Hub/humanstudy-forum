import { type Operation, selectURI } from "@apollo/client/core";

export function graphqlBatchKey(operation: Operation, uri: string): string {
  // The default part is copied from https://github.com/apollographql/apollo-client/blob/main/src/link/batch-http/batchHttpLink.ts#L192-L206
  const context = operation.getContext();

  const contextConfig = {
    http: context.http,
    options: context.fetchOptions,
    credentials: context.credentials,
  };

  const defaultBatchKey = selectURI(operation, uri) + JSON.stringify(contextConfig);

  // If the operation has a batchKey variable, add that to the batch key.
  // This is to manually separate out very slow queries
  const explicitBatchKey = context.batchKey;

  return JSON.stringify([defaultBatchKey, typeof explicitBatchKey === "string" ? explicitBatchKey : null]);
}
