import { describe, expect, it } from "vitest";
import { hashApiKey } from "./api-keys";
import { hashApiKeyEdge } from "./api-keys.edge";

describe("hashApiKeyEdge", () => {
  it("produces the same hash as the Node.js version", async () => {
    //* Act
    const rawKey = "anc_k_abc123xyz";
    const nodeHash = hashApiKey(rawKey);
    const edgeHash = await hashApiKeyEdge(rawKey);

    //* Assert
    expect(edgeHash).toBe(nodeHash);
  });

  it("returns a 64-character hex string", async () => {
    //* Act
    const hash = await hashApiKeyEdge("anc_k_testkey");

    //* Assert
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different hashes for different keys", async () => {
    //* Act
    const hash1 = await hashApiKeyEdge("anc_k_key1");
    const hash2 = await hashApiKeyEdge("anc_k_key2");

    //* Assert
    expect(hash1).not.toBe(hash2);
  });
});
