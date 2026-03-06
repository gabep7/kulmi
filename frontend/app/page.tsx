import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LandingPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#e5e5e5] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-semibold text-[#111111] tracking-tight">Kulmi</span>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-[#666666] hover:text-[#111111] text-sm transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-[#111111] hover:bg-[#333333] text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#111111] tracking-tight mb-6 leading-tight">
            Study with intention.
          </h1>
          <p className="text-xl text-[#666666] mb-4 leading-relaxed max-w-xl mx-auto">
            Upload your study materials, ask questions, get explanations, and generate practice exams — all powered by AI.
          </p>
          <p className="text-sm text-[#999999] mb-12">No dark mode. No noise. Just learning.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-[#111111] hover:bg-[#333333] text-white font-medium px-8 py-3.5 transition-colors text-base"
            >
              Get started free →
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-white hover:bg-[#f5f5f5] border border-[#e5e5e5] hover:border-[#999999] text-[#111111] font-medium px-8 py-3.5 transition-colors text-base"
            >
              Sign in
            </Link>
          </div>

          {/* Feature list */}
          <div className="border-t border-[#e5e5e5] pt-12">
            <p className="text-xs tracking-widest uppercase text-[#999999] mb-8">What you can do</p>
            <div className="grid sm:grid-cols-3 gap-8 text-left">
              {[
                {
                  title: 'Chat with Documents',
                  desc: 'Ask any question about your uploaded materials and get instant, accurate answers.',
                },
                {
                  title: 'Get Explanations',
                  desc: 'Complex concepts broken down into clear, easy-to-understand explanations.',
                },
                {
                  title: 'Practice Exams',
                  desc: 'Auto-generate MCQ, short answer, or essay questions to test your knowledge.',
                },
              ].map((f) => (
                <div key={f.title} className="border-t-2 border-[#111111] pt-4">
                  <h3 className="text-base font-semibold text-[#111111] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#e5e5e5] py-6 px-6 text-center text-[#999999] text-sm">
        © {new Date().getFullYear()} Kulmi. Made for students.
      </footer>
    </div>
  )
}
