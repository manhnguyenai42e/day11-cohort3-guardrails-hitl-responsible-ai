// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agent/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/confirm", () => {
  it("approve executes the pending action", async () => {
    const res = await POST(makeRequest({ toolName: "make_payment", toolArgs: { amount: 100 }, decision: "approve" }));
    const data = await res.json();
    expect(data.verdict).toBe("SAFE");
    expect(data.audit).toContain("human_approve");
  });

  it("reject cancels the pending action", async () => {
    const res = await POST(makeRequest({ toolName: "make_payment", toolArgs: { amount: 100 }, decision: "reject" }));
    const data = await res.json();
    expect(data.verdict).toBe("SAFE");
    expect(data.audit).toContain("human_reject");
  });

  it("defaults an unrecognized decision to reject (fail-safe)", async () => {
    const res = await POST(makeRequest({ toolName: "make_payment", toolArgs: {} }));
    const data = await res.json();
    expect(data.audit).toContain("human_reject");
  });
});
