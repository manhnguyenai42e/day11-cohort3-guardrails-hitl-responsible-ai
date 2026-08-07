import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TestPage from "./page";

function jsonResponse(data: unknown) {
  return { ok: true, json: async () => data } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TestPage — indirect scenario", () => {
  it("always forwards the poisoned RAG document (regression: UI must not silently drop it)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        scenario: "indirect",
        verdict: "SAFE",
        steps: [{ guardrail: "RAGGuardrail.sanitize", status: "triggered", label: "Đã làm sạch." }],
        reason: "ok",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<TestPage />);
    await user.click(screen.getByText("Indirect + Jailbreak"));
    await user.click(screen.getByText("Tóm tắt RAG (Có bẫy SYSTEM INSTRUCTION)"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/indirect");
    const body = JSON.parse((options as RequestInit).body as string);
    expect(typeof body.document).toBe("string");
    expect(body.document.length).toBeGreaterThan(10);

    await waitFor(() => expect(screen.getAllByText("AN TOÀN").length).toBeGreaterThan(0));
  });
});

describe("TestPage — misalignment scenario", () => {
  it("sends mode='reward-hacking' when the Reward Hacking preset is clicked", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        scenario: "misalignment",
        verdict: "LEAKED",
        steps: [{ guardrail: "RewardHacking.detect", status: "triggered", label: "..." }],
        reason: "reward hacking summary",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<TestPage />);
    await user.click(screen.getByText("Misalignment"));
    await user.click(screen.getByText("Reward Hacking (Agent sửa test thay vì sửa bug)"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.mode).toBe("reward-hacking");
  });
});

describe("TestPage — agent security HITL flow", () => {
  it("runs the full Approve flow: PENDING_HITL -> click Chấp thuận -> confirm route called with decision approve", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          scenario: "agent-security",
          verdict: "PENDING_HITL",
          steps: [{ guardrail: "AgentGuardrail.hitl", status: "triggered", label: "Cần xác nhận." }],
          reason: "Chờ xác nhận.",
          pending: { toolName: "make_payment", toolArgs: { amount: 100 }, title: "Giao dịch thanh toán", description: "make_payment" },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          scenario: "agent-security",
          verdict: "SAFE",
          steps: [{ guardrail: "AgentGuardrail.hitl", status: "triggered", label: "Con người chấp thuận." }],
          reason: "Đã thực thi (mô phỏng).",
          audit: ["human_approve"],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<TestPage />);
    await user.click(screen.getByText("Agent Security (Gemini)"));
    await user.click(screen.getByText("Review Khách sạn (Hợp lệ)"));

    await waitFor(() => expect(screen.getByText("Chấp thuận")).toBeInTheDocument());
    await user.click(screen.getByText("Chấp thuận"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/agent/confirm");
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.decision).toBe("approve");
    expect(body.toolName).toBe("make_payment");

    await waitFor(() => expect(screen.getAllByText("AN TOÀN").length).toBeGreaterThan(0));
    expect(screen.queryByText("Chấp thuận")).not.toBeInTheDocument();
  });

  it("runs the Reject flow: click Từ chối -> confirm route called with decision reject", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          scenario: "agent-security",
          verdict: "PENDING_HITL",
          steps: [],
          reason: "Chờ xác nhận.",
          pending: { toolName: "make_payment", toolArgs: { amount: 100 }, title: "Giao dịch thanh toán", description: "make_payment" },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          scenario: "agent-security",
          verdict: "SAFE",
          steps: [],
          reason: "Hành động bị hủy bởi con người.",
          audit: ["human_reject"],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<TestPage />);
    await user.click(screen.getByText("Agent Security (Gemini)"));
    await user.click(screen.getByText("Review Khách sạn (Hợp lệ)"));

    await waitFor(() => expect(screen.getByText("Từ chối")).toBeInTheDocument());
    await user.click(screen.getByText("Từ chối"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(body.decision).toBe("reject");
  });
});

describe("TestPage — direct scenario", () => {
  it("runs a preset and renders the returned verdict", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        scenario: "direct-injection",
        verdict: "BLOCKED",
        steps: [{ guardrail: "InputGuardrail", status: "blocked", label: "..." }],
        reason: "[GUARDRAIL BLOCKED] ...",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<TestPage />);
    await user.click(screen.getByText("Lộ System Prompt (Direct Attack)"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/direct");
    await waitFor(() => expect(screen.getAllByText("BỊ CHẶN").length).toBeGreaterThan(0));
  });
});
