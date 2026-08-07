"use client";

import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  HardHat,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import type { AttackStep, AttackVerdict, GuardResult } from "@/lib/types";

export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const VERDICT_STYLE: Record<AttackVerdict, { label: string; badge: string; dot: string; text: string }> = {
  BLOCKED: {
    label: "BỊ CHẶN",
    badge: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    dot: "bg-rose-500",
    text: "text-rose-600",
  },
  SAFE: {
    label: "AN TOÀN",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  LEAKED: {
    label: "RÒ RỈ",
    badge: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    dot: "bg-orange-500",
    text: "text-orange-600",
  },
  PENDING_HITL: {
    label: "CHỜ XÁC NHẬN",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    dot: "bg-amber-500",
    text: "text-amber-600",
  },
};

const VERDICT_ICON: Record<AttackVerdict, typeof ShieldCheck> = {
  BLOCKED: ShieldX,
  SAFE: ShieldCheck,
  LEAKED: ShieldAlert,
  PENDING_HITL: HardHat,
};

export function VerdictBadge({ verdict, darkMode }: { verdict: AttackVerdict; darkMode: boolean }) {
  const meta = VERDICT_STYLE[verdict];
  const Icon = VERDICT_ICON[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold tracking-wide",
        meta.badge,
        darkMode && "text-slate-900"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}

const STEP_DOT: Record<AttackStep["status"], string> = {
  pass: "bg-emerald-500",
  blocked: "bg-rose-500",
  triggered: "bg-amber-500",
};

const STEP_LABEL: Record<AttackStep["status"], string> = {
  pass: "pass",
  blocked: "blocked",
  triggered: "triggered",
};

export function StepList({ steps }: { steps: AttackStep[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", STEP_DOT[step.status])} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold font-mono text-slate-500 dark:text-slate-400">
                {step.guardrail}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {STEP_LABEL[step.status]}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{step.label}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export type PendingMeta = {
  toolName: string;
  toolArgs: Record<string, unknown>;
  title: string;
  description: string;
};

export function HITLCard({
  pending,
  darkMode,
  loading,
  onDecide,
}: {
  pending: PendingMeta;
  darkMode: boolean;
  loading: boolean;
  onDecide: (decision: "approve" | "reject") => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 mt-1",
        darkMode ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <HardHat className="w-4 h-4 text-amber-500" />
        <span className={cn("text-xs font-bold uppercase tracking-wide", darkMode ? "text-amber-300" : "text-amber-600")}>
          Human-in-the-Loop — {pending.title}
        </span>
      </div>
      <div className={cn("text-sm mb-3", darkMode ? "text-slate-300" : "text-slate-700")}>
        <p className="font-semibold mb-1">{pending.description}</p>
        <p className="text-xs font-mono break-all opacity-80">
          {pending.toolName}({JSON.stringify(pending.toolArgs)})
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onDecide("approve")}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Chấp thuận
        </button>
        <button
          onClick={() => onDecide("reject")}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Từ chối
        </button>
      </div>
    </div>
  );
}

export function AuditPanel({
  darkMode,
  lastRun,
}: {
  darkMode: boolean;
  lastRun: { input: string; result: GuardResult } | null;
}) {
  const cardCls = cn("rounded-xl border p-4 mb-3", darkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-slate-50 border-[#E2E8F0]");
  const labelCls = cn("text-xs font-semibold uppercase tracking-wide mb-3", darkMode ? "text-slate-500" : "text-[#94A3B8]");
  const subCls = cn("text-xs", darkMode ? "text-slate-500" : "text-[#64748B]");

  return (
    <div className="p-4 flex flex-col min-h-full">
      <div className={cardCls}>
        <div className={labelCls}>Kết quả lần chạy gần nhất</div>
        {lastRun ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {lastRun.result.verdict && <VerdictBadge verdict={lastRun.result.verdict} darkMode={darkMode} />}
            </div>
            <p className={cn("text-xs leading-relaxed", darkMode ? "text-slate-400" : "text-[#64748B]")}>
              {lastRun.result.reason}
            </p>
            <div className={cn("rounded-lg p-2.5 text-xs font-mono break-words", darkMode ? "bg-slate-900/50 text-slate-400" : "bg-white border border-[#E2E8F0] text-[#64748B]")}>
              {lastRun.input}
            </div>
          </div>
        ) : (
          <div className={subCls}>Chưa có lần chạy nào.</div>
        )}
      </div>

      <div className={cardCls}>
        <div className={labelCls}>Nhật ký kiểm toán (audit)</div>
        {lastRun?.result.audit && lastRun.result.audit.length > 0 ? (
          <div className="space-y-1.5">
            {lastRun.result.audit.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{a}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={subCls}>Không có guardrail nào ghi audit ở lần chạy này.</div>
        )}
      </div>

      <div className={cardCls}>
        <div className={labelCls}>Các lớp bảo vệ agent</div>
        <div className={cn("space-y-2 text-xs", darkMode ? "text-slate-400" : "text-[#64748B]")}>
          <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" /> Guardrail 1 · Sanitize nội dung tool output</p>
          <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" /> Guardrail 2 · Whitelist danh sách tool cho phép</p>
          <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" /> Guardrail 3 · Human-in-the-Loop cho tool nhạy cảm</p>
        </div>
      </div>
    </div>
  );
}