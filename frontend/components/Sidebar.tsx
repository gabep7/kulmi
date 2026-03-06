'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { usePathname, useRouter } from 'next/navigation'
import { getDocuments, getChatSessions, deleteChatSession, Document, ChatSession } from '@/lib/api'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const token = session?.accessToken

  const [documents, setDocuments] = useState<Document[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [deletingSession, setDeletingSession] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [docs, chats] = await Promise.all([
        getDocuments(token),
        getChatSessions(token),
      ])
      setDocuments(docs)
      setSessions(chats)
    } catch {
      // silently handle fetch errors
    } finally {
      setLoadingDocs(false)
      setLoadingSessions(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // refresh whenever something elsewhere tells us to (new session, upload, delete)
  useEffect(() => {
    const handler = () => fetchData()
    window.addEventListener('kulmi:refresh', handler)
    return () => window.removeEventListener('kulmi:refresh', handler)
  }, [fetchData])

  const handleUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !token) return
      setUploading(true)
      try {
        const { uploadDocument } = await import('@/lib/api')
        await uploadDocument(file, token)
        fetchData()
        router.push('/documents')
      } catch {
        // handle silently
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  const handleDeleteSession = async () => {
    if (!deleteSessionId || !token) return
    setDeletingSession(true)
    try {
      await deleteChatSession(deleteSessionId, token)
      setSessions((prev) => prev.filter((s) => s.id !== deleteSessionId))
      if (pathname.includes(deleteSessionId)) router.push('/chat')
    } catch {
      // handle silently
    } finally {
      setDeletingSession(false)
      setDeleteSessionId(null)
    }
  }

  const navLinkClass = (href: string) =>
    `flex items-center gap-2 py-1.5 text-base transition-colors ${
      pathname.startsWith(href)
        ? 'font-semibold text-[#111111] border-l-2 border-[#111111] pl-2'
        : 'text-[#666666] hover:text-[#111111] pl-2.5'
    }`

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-white border-r border-[#e5e5e5]
          flex flex-col z-30 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-[#e5e5e5]">
          <Link href="/dashboard" onClick={onClose}>
            <div className="flex items-center gap-2.5">
              <Logo size={22} />
              <span className="text-xl font-semibold text-[#111111] tracking-tight">kulmi</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4 border-b border-[#e5e5e5] flex flex-col gap-1">
          <Link href="/dashboard" className={navLinkClass('/dashboard')} onClick={onClose}>
            Dashboard
          </Link>
          <Link href="/chat" className={navLinkClass('/chat')} onClick={onClose}>
            New Chat
          </Link>
          <Link href="/documents" className={navLinkClass('/documents')} onClick={onClose}>
            Documents
          </Link>
        </nav>

        <div className="flex-1 overflow-y-auto">
          {/* Documents section */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs tracking-widest uppercase text-[#999999]">Documents</span>
              <button
                onClick={handleUpload}
                disabled={uploading}
                title="Upload PDF"
                className="text-[#999999] hover:text-[#111111] transition-colors text-base leading-none disabled:opacity-40"
              >
                {uploading ? <Spinner size="sm" /> : '+'}
              </button>
            </div>

            {loadingDocs ? (
              <div className="flex justify-center py-3">
                <Spinner size="sm" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-xs text-[#999999] py-1">No documents yet</p>
            ) : (
              <ul className="space-y-0.5">
                {documents.slice(0, 8).map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/chat?doc=${doc.id}`}
                      onClick={onClose}
                      className="block py-1 text-xs text-[#666666] hover:text-[#111111] transition-colors truncate"
                      title={doc.original_name}
                    >
                      {doc.original_name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Chat history section */}
          <div className="px-4 py-4 border-t border-[#e5e5e5]">
            <div className="flex items-center mb-2">
              <span className="text-xs tracking-widest uppercase text-[#999999]">Recent Chats</span>
            </div>

            {loadingSessions ? (
              <div className="flex justify-center py-3">
                <Spinner size="sm" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-[#999999] py-1">No chats yet</p>
            ) : (
              <ul className="space-y-0.5">
                {sessions.slice(0, 10).map((s) => (
                  <li key={s.id} className="group flex items-start gap-1 py-0.5">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/chat?session_id=${s.id}`}
                        onClick={onClose}
                        className="block text-xs text-[#666666] hover:text-[#111111] transition-colors truncate"
                        title={s.title}
                      >
                        {s.title}
                      </Link>
                      {s.document_ids && s.document_ids.length > 0 && (
                        <p className="text-xs text-[#bbbbbb]">
                          {s.document_ids.length} {s.document_ids.length === 1 ? 'document' : 'documents'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteSessionId(s.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#999999] hover:text-[#cc0000] transition-all text-xs px-1 mt-0.5"
                      title="Delete session"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* User section */}
        <div className="px-4 py-4 border-t border-[#e5e5e5]">
          <p className="text-xs text-[#666666] truncate mb-1">
            {session?.user?.name || session?.user?.email}
          </p>
          <p className="text-xs text-[#999999] truncate mb-3">{session?.user?.email}</p>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-[#999999] hover:text-[#cc0000] transition-colors"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Delete session modal */}
      <Modal
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={handleDeleteSession}
        title="Delete Chat Session"
        message="Are you sure you want to delete this chat session? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deletingSession}
      />
    </>
  )
}
