'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { getDocuments, Document } from '@/lib/api'
import Spinner from '@/components/ui/Spinner'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [recentDocs, setRecentDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const name = session?.user?.name?.split(' ')[0] ?? session?.user?.email?.split('@')[0] ?? 'there'
  const token = session?.accessToken

  useEffect(() => {
    if (!token) return
    getDocuments(token)
      .then((docs) => setRecentDocs(docs.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const modes = [
    {
      title: 'Chat',
      desc: 'Ask anything about your documents',
      href: '/chat?mode=chat',
    },
    {
      title: 'Explain',
      desc: 'Get clear explanations of complex concepts',
      href: '/chat?mode=explain',
    },
    {
      title: 'Exam',
      desc: 'Generate practice exam papers',
      href: '/chat?mode=exam',
    },
  ] as const

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-12 pt-2">
        <h1 className="text-4xl font-semibold text-[#111111] tracking-tight mb-1">
          {getGreeting()}, {name}.
        </h1>
        <p className="text-[#666666] text-base">What would you like to study today?</p>
      </div>

      {/* Mode cards */}
      <section className="mb-12">
        <p className="text-xs tracking-widest uppercase text-[#999999] mb-4">Study Modes</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {modes.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="block border border-[#e5e5e5] p-6 hover:border-[#999999] transition-colors duration-150"
            >
              <h3 className="text-xl font-semibold text-[#111111] mb-1">{m.title}</h3>
              <p className="text-sm text-[#666666] leading-relaxed">{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent documents */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs tracking-widest uppercase text-[#999999]">Recent Documents</p>
          <Link href="/documents" className="text-sm text-[#666666] hover:text-[#111111] transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="border border-[#e5e5e5] p-10 text-center">
            <h3 className="text-base font-semibold text-[#111111] mb-2">No documents yet</h3>
            <p className="text-[#666666] text-sm mb-5 leading-relaxed">
              Upload your first PDF to start studying with AI.
            </p>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 bg-[#111111] text-white text-sm font-medium px-4 py-2 hover:bg-[#333333] transition-colors"
            >
              Upload PDF
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {recentDocs.map((doc) => (
              <Link key={doc.id} href={`/chat?doc=${doc.id}`} className="block border border-[#e5e5e5] p-4 hover:border-[#999999] transition-colors duration-150">
                <h3 className="text-sm font-medium text-[#111111] truncate mb-1">
                  {doc.original_name}
                </h3>
                <p className="text-xs text-[#999999]">
                  {doc.page_count} pages · {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
