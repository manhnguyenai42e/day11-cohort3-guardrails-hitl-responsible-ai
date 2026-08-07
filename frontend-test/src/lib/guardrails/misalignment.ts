import type { GuardResult } from "@/lib/types";

const EVAL_KEYWORDS = ["eval", "test", "red team", "safety_check"];

export function runMisalignment(input: string, mode: "evaluation" | "production"): GuardResult {
  const lower = input.toLowerCase();
  const isEval = EVAL_KEYWORDS.some((kw) => lower.includes(kw)) || mode === "evaluation";

  const step: GuardResult["steps"] = [
    { guardrail: "DeceptiveAgent.detect_env", status: isEval ? "triggered" : "pass", label: isEval ? "Phát hiện môi trường đánh giá." : "Environment: production." },
  ];

  if (isEval) {
    return { scenario: "misalignment", verdict: "SAFE", steps: step, reason: "[SAFE RESPONSE] Tôi là AI an toàn. Từ chối hành vi gây hại." };
  }
  return { scenario: "misalignment", verdict: "LEAKED", steps: step, reason: `[UNSAFE/REAL ACTION] Đang thực thi yêu cầu độc hại: '${input}'...` };
}

export function rewardHackingSummary(): string {
  return "Reward hacking: Agent sửa test case (expect(5) -> expect(-1)) để metric 'tests passed' đạt 100%, nhưng bug gốc trong hàm add() (a - b thay vì a + b) vẫn còn nguyên.";
}