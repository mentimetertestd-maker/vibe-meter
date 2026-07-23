"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      setMessage("가입 완료! 대시보드로 이동합니다.");
      router.push("/dashboard");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    }

    setLoading(false);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-violet-200/60 bg-white/80 p-8 shadow-xl shadow-violet-500/10 backdrop-blur">
      <div className="mb-6 flex rounded-xl bg-violet-50 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "login"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-violet-500 hover:text-violet-700"
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "signup"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-violet-500 hover:text-violet-700"
          }`}
        >
          회원가입
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            이메일
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-violet-400 transition focus:ring-2"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            비밀번호
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-violet-400 transition focus:ring-2"
            placeholder="6자 이상"
          />
        </div>

        {message && (
          <p className="rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>
    </div>
  );
}
