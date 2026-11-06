import type { Operation } from "@apollo/client/core";
import { graphqlBatchKey } from "@/lib/apollo/graphqlBatchKey";

const key = (context: Record<string, unknown> = {}) => graphqlBatchKey({
  getContext: () => context,
} as Operation, "/api/streamGraphql");

describe("GraphQL request batch isolation", () => {
  it("keeps explicitly separated article and recommendation requests in different batches", () => {
    expect(key({ batchKey: "singlePost" })).not.toBe(key({ batchKey: "recommendations" }));
    expect(key({ batchKey: "singlePost" })).not.toBe(key());
  });

  it("batches compatible requests with the same explicit key", () => {
    expect(key({ batchKey: "singlePost" })).toBe(key({ batchKey: "singlePost" }));
    expect(key()).toBe(key());
  });

  it("still separates transport settings and ignores unsupported explicit keys", () => {
    expect(key({ credentials: "omit" })).not.toBe(key({ credentials: "same-origin" }));
    expect(key({ batchKey: 123 })).toBe(key());
  });
});
