import AuthForm from "@/components/AuthForm";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-fuchsia-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.2),transparent_35%)]" />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col items-center justify-center gap-12 px-6 py-16 lg:flex-row lg:gap-20">
        <div className="max-w-xl text-center lg:text-left">
          <p className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-violet-100 ring-1 ring-white/20">
            실시간 인터랙션 SaaS
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Vibe Meter
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-violet-100/90">
            객관식, 단어구름, 익명 Q&A로 청중과 실시간으로 소통하세요.
            가입 후 나만의 멘티미터 방을 만들고 QR코드로 참여자를 초대할 수
            있습니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            {["객관식 투표", "단어구름", "익명 Q&A"].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-violet-50 ring-1 ring-white/15"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <AuthForm />
      </div>

      <footer className="relative pb-8 text-center text-sm text-violet-200/70">
        이미 계정이 있으신가요?{" "}
        <Link href="/dashboard" className="underline hover:text-white">
          대시보드로 이동
        </Link>
      </footer>
    </div>
  );
}
