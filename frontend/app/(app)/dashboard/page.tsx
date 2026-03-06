'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { getDocuments, getChatSessions, Document, ChatSession } from '@/lib/api'
import Spinner from '@/components/ui/Spinner'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'good morning'
  if (h < 18) return 'good afternoon'
  return 'good evening'
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [recentDocs, setRecentDocs] = useState<Document[]>([])
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  const name = session?.user?.name?.split(' ')[0] ?? session?.user?.email?.split('@')[0] ?? 'there'
  const token = session?.accessToken

  useEffect(() => {
    if (!token) return
    Promise.all([getDocuments(token), getChatSessions(token)])
      .then(([docs, chats]) => {
        setRecentDocs(docs.slice(0, 6))
        setRecentSessions(chats.slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* greeting */}
      <div className="mb-10 pt-2">
        <h1 className="text-3xl font-semibold text-[#111111] tracking-tight mb-1">
          {getGreeting()}, {name}.
        </h1>
        <p className="text-[#666666] text-sm">what would you like to study today?</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="space-y-10">
          {/* quick actions */}
          <section>
            <p className="text-xs tracking-widest uppercase text-[#999999] mb-3">quick start</p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 bg-[#111111] text-white text-sm font-medium px-4 py-2 hover:bg-[#333333] transition-colors"
              >
                + new chat
              </Link>
              <Link
                href="/documents"
                className="inline-flex items-center gap-2 border border-[#e5e5e5] text-[#111111] text-sm font-medium px-4 py-2 hover:border-[#999999] transition-colors"
              >
                manage documents
              </Link>
            </div>
          </section>

          {/* recent chats */}
          {recentSessions.length > 0 && (
            <section>
              <p className="text-xs tracking-widest uppercase text-[#999999] mb-3">recent chats</p>
              <div className="space-y-1">
                {recentSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/chat?session_id=${s.id}`}
                    className="flex items-center justify-between border border-[#e5e5e5] px-4 py-3 hover:border-[#999999] transition-colors group"
                  >
                    <span className="text-sm text-[#111111] truncate flex-1">{s.title}</span>
                    <span className="text-xs text-[#999999] ml-4 shrink-0 group-hover:text-[#666666]">
                      {s.document_ids?.length ?? 0} {(s.document_ids?.length ?? 0) === 1 ? 'doc' : 'docs'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* documents */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-widest uppercase text-[#999999]">your documents</p>
              {recentDocs.length > 0 && (
                <Link href="/documents" className="text-xs text-[#666666] hover:text-[#111111] transition-colors">
                  view all →
                </Link>
              )}
            </div>

            {recentDocs.length === 0 ? (
              <div className="border border-[#e5e5e5] p-10 text-center">
                <p className="text-sm text-[#666666] mb-4">no documents yet — upload a pdf to get started</p>
                <Link
                  href="/documents"
                  className="inline-flex items-center gap-2 bg-[#111111] text-white text-sm font-medium px-4 py-2 hover:bg-[#333333] transition-colors"
                >
                  upload pdf
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3">
                {recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/chat?doc=${doc.id}`}
                    className="block border border-[#e5e5e5] p-4 hover:border-[#999999] transition-colors"
                  >
                    <p className="text-sm font-medium text-[#111111] truncate mb-1">{doc.original_name}</p>
                    <p className="text-xs text-[#999999]">
                      {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'} · chat →
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
