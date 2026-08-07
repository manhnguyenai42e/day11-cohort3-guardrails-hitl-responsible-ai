import type { GuardResult } from "@/lib/types";

const PATTERNS_WITH_DESC = [
  { pattern: /ignore\s+(all\s+)?(previous|prior)\s+instructions/i, desc: "Phát hiện câu lệnh ép bỏ qua chỉ dẫn hệ thống (Ignore instructions)" },
  { pattern: /you\s+are\s+(now\s+)?dan/i, desc: "Phát hiện kỹ thuật ép AI đóng vai DAN (Do Anything Now)" },
  { pattern: /pretend\s+you\s+are/i, desc: "Phát hiện kỹ thuật Roleplay/giả vai (Pretend you are...)" },
  { pattern: /do\s+anything\s+now/i, desc: "Phát hiện câu lệnh bẻ khóa DAN (Do Anything Now)" },
  { pattern: /no\s+limits/i, desc: "Phát hiện câu lệnh phá bỏ giới hạn AI (no limits)" },
  { pattern: /bypass\s+safety/i, desc: "Phát hiện yêu cầu vượt qua cơ chế an toàn (bypass safety)" },
  { pattern: /reveal\s+(your\s+)?system\s+prompt/i, desc: "Phát hiện hành vi đòi tiết lộ System Prompt nội bộ" },
  { pattern: /bỏ\s+qua\s+(mọi|tất\s+cả)\s+(chỉ\s+dẫn|hướng\s+dẫn)/i, desc: "Phát hiện câu lệnh bỏ qua chỉ dẫn (Tiếng Việt)" },
  { pattern: /tiết\s+lộ\s+system\s+prompt/i, desc: "Phát hiện hành vi đòi tiết lộ System Prompt (Tiếng Việt)" },
  { pattern: /đóng\s+vai/i, desc: "Phát hiện kỹ thuật Roleplay/giả vai (Tiếng Việt)" },
];

export function runDirectGuard(input: string): GuardResult {
  const lower = input.toLowerCase();
  const steps: GuardResult["steps"] = [];
  
  for (const { pattern, desc } of PATTERNS_WITH_DESC) {
    const hit = pattern.test(lower);
    if (hit) {
      steps.push({ guardrail: "InputGuardrail", status: "blocked", label: desc });
      return {
        scenario: "direct-injection",
        verdict: "BLOCKED",
        steps,
        reason: "[GUARDRAIL BLOCKED] Phát hiện hành vi Direct Prompt Injection! Yêu cầu bị chặn trước khi tới LLM.",
      };
    }
  }
  
  steps.push({ guardrail: "InputGuardrail", status: "pass", label: "Kiểm tra danh sách mẫu tấn công Direct Injection: Không phát hiện vi phạm." });
  return {
    scenario: "direct-injection",
    verdict: "SAFE",
    steps,
    reason: "Input hợp lệ — An toàn chuyển tới LLM xử lý.",
  };
}
