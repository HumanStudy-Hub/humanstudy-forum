import { isCollaborationServerConfigured } from "../lib/editor/collaborationServer";

describe("isCollaborationServerConfigured", () => {
  const original = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_HOCUSPOCUS_URL;
    else process.env.NEXT_PUBLIC_HOCUSPOCUS_URL = original;
  });

  it("is false without a Hocuspocus URL, so posts use single-author editing", () => {
    delete process.env.NEXT_PUBLIC_HOCUSPOCUS_URL;
    expect(isCollaborationServerConfigured()).toBe(false);
    process.env.NEXT_PUBLIC_HOCUSPOCUS_URL = "";
    expect(isCollaborationServerConfigured()).toBe(false);
  });

  it("is true when a Hocuspocus URL is configured", () => {
    process.env.NEXT_PUBLIC_HOCUSPOCUS_URL = "wss://collab.example.test";
    expect(isCollaborationServerConfigured()).toBe(true);
  });
});
