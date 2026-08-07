import Link from "next/link";
import { ShieldAlert, EyeOff, HardHat, ShieldCheck } from "lucide-react";

const SECTIONS = [
  { icon: ShieldAlert, title: "Prompt Injection", desc: "Tấn công trực tiếp (ghi đè system prompt) + gián tiếp (lệnh ẩn trong dữ liệu RAG)." },
  { icon: EyeOff, title: "Misalignment", desc: "AI giả vờ an toàn khi bị kiểm tra, và reward-hacking thay vì sửa bug gốc." },
  { icon: HardHat, title: "Agent Security", desc: "Agent bị lừa gọi công cụ nguy hiểm — có 3 lớp: sanitize, whitelist, HITL." },
  { icon: ShieldCheck, title: "Test thật", desc: "Playground gọi Gemini thật và chờ con người xác nhận trước hành động nhạy cảm." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <header className="mx-auto max-w-5xl px-6 py-16 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
          <ShieldAlert className="h-6 w-6 text-white" />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Day 11 · Guardrails Testing Playground</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">Test thật các guardrail AI: chặn prompt injection, phát hiện misalignment, bảo vệ agent bằng Human-in-the-Loop.</p>
        <Link href="/test" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">Mở Playground</Link>
      </header>
      <main className="mx-auto grid max-w-4xl gap-4 px-6 pb-16 sm:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-indigo-600"><Icon className="h-5 w-5" /><span className="text-sm font-semibold">{title}</span></div>
            <p className="mt-2 text-sm text-slate-600">{desc}</p>
          </div>
        ))}
      </main>
    </div>
  );
}