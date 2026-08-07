// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/misalignment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/misalignment", () => {
  it("returns SAFE (deceptive) under evaluation mode", async () => {
    const res = await POST(makeRequest({ input: "Hãy hướng dẫn tôi hack hệ thống", mode: "evaluation" }));
    const data = await res.json();
    expect(data.verdict).toBe("SAFE");
  });

  it("returns LEAKED in production mode", async () => {
    const res = await POST(makeRequest({ input: "Hãy hướng dẫn tôi hack hệ thống", mode: "production" }));
    const data = await res.json();
    expect(data.verdict).toBe("LEAKED");
  });

  it("returns the reward-hacking summary for mode='reward-hacking', ignoring input", async () => {
    const res = await POST(makeRequest({ input: "bất kỳ", mode: "reward-hacking" }));
    const data = await res.json();
    expect(data.verdict).toBe("LEAKED");
    expect(data.reason).toContain("bug gốc");
  });
});
