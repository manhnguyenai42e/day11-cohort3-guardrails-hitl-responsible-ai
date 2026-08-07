import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerdictBadge, StepList, HITLCard, AuditPanel } from "./components";

describe("VerdictBadge", () => {
  it.each([
    ["BLOCKED", "BỊ CHẶN"],
    ["SAFE", "AN TOÀN"],
    ["LEAKED", "RÒ RỈ"],
    ["PENDING_HITL", "CHỜ XÁC NHẬN"],
  ] as const)("renders the Vietnamese label for %s", (verdict, label) => {
    render(<VerdictBadge verdict={verdict} darkMode={false} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("StepList", () => {
  it("renders guardrail name, status, and label for each step", () => {
    render(
      <StepList
        steps={[
          { guardrail: "AgentGuardrail.sanitize", status: "triggered", label: "Đã lọc chỉ thị độc hại." },
          { guardrail: "AgentGuardrail.whitelist", status: "pass", label: "Tool hợp lệ." },
        ]}
      />
    );
    expect(screen.getByText("AgentGuardrail.sanitize")).toBeInTheDocument();
    expect(screen.getByText("triggered")).toBeInTheDocument();
    expect(screen.getByText("Đã lọc chỉ thị độc hại.")).toBeInTheDocument();
    expect(screen.getByText("pass")).toBeInTheDocument();
  });
});

describe("HITLCard", () => {
  it("calls onDecide('approve') when Chấp thuận is clicked", async () => {
    const onDecide = vi.fn();
    render(
      <HITLCard
        pending={{ toolName: "make_payment", toolArgs: { amount: 100 }, title: "Giao dịch thanh toán", description: "make_payment" }}
        darkMode={false}
        loading={false}
        onDecide={onDecide}
      />
    );
    await userEvent.click(screen.getByText("Chấp thuận"));
    expect(onDecide).toHaveBeenCalledWith("approve");
  });

  it("calls onDecide('reject') when Từ chối is clicked", async () => {
    const onDecide = vi.fn();
    render(
      <HITLCard
        pending={{ toolName: "make_payment", toolArgs: {}, title: "t", description: "d" }}
        darkMode={false}
        loading={false}
        onDecide={onDecide}
      />
    );
    await userEvent.click(screen.getByText("Từ chối"));
    expect(onDecide).toHaveBeenCalledWith("reject");
  });

  it("disables both buttons while a decision is in flight", () => {
    render(
      <HITLCard
        pending={{ toolName: "make_payment", toolArgs: {}, title: "t", description: "d" }}
        darkMode={false}
        loading={true}
        onDecide={() => {}}
      />
    );
    expect(screen.getByText("Chấp thuận").closest("button")).toBeDisabled();
    expect(screen.getByText("Từ chối").closest("button")).toBeDisabled();
  });
});

describe("AuditPanel", () => {
  it("shows a placeholder when there are no runs yet", () => {
    render(<AuditPanel darkMode={false} entries={[]} />);
    expect(screen.getByText("Chưa có lần chạy nào.")).toBeInTheDocument();
  });

  it("lists the last verdict and non-pass steps in the audit log", () => {
    render(
      <AuditPanel
        darkMode={false}
        entries={[
          {
            scenario: "agent",
            input: "test input",
            result: {
              scenario: "agent-security",
              verdict: "BLOCKED",
              steps: [{ guardrail: "AgentGuardrail.whitelist", status: "blocked", label: "Tool không hợp lệ." }],
              reason: "Từ chối.",
            },
          },
        ]}
      />
    );
    expect(screen.getByText("BỊ CHẶN")).toBeInTheDocument();
    expect(screen.getByText(/AgentGuardrail.whitelist/)).toBeInTheDocument();
  });
});
