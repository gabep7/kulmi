'use client'

import { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  getDocuments,
  getFolders,
  getChatMessages,
  getChatSession,
  getProviders,
  streamChat,
  Document,
  Folder,
  ChatMessage,
} from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

type Mode = 'chat' | 'explain' | 'exam'
type QuestionType = 'mcq' | 'short_answer' | 'essay'
type ProviderMap = Record<string, { name: string; models: string[]; requires_key: boolean; configured: boolean }>

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      <span className="typing-dot w-1.5 h-1.5 bg-[#999999] inline-block" />
      <span className="typing-dot w-1.5 h-1.5 bg-[#999999] inline-block" />
      <span className="typing-dot w-1.5 h-1.5 bg-[#999999] inline-block" />
    </div>
  )
}

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] lg:max-w-[70%] px-4 py-3 ${
          isUser
            ? 'bg-[#f5f5f5] text-[#111111]'
            : 'bg-white border border-[#e5e5e5] text-[#111111]'
        }`}
      >
        {isStreaming && message.content === '' ? (
          <TypingIndicator />
        ) : (
          <div className="text-base leading-relaxed break-words prose prose-sm max-w-none
            prose-headings:font-semibold prose-headings:text-[#111111]
            prose-p:text-[#111111] prose-p:my-1
            prose-strong:text-[#111111] prose-strong:font-semibold
            prose-li:text-[#111111] prose-li:my-0.5
            prose-code:bg-[#f5f5f5] prose-code:px-1 prose-code:rounded prose-code:text-sm prose-code:text-[#111111]
            prose-pre:bg-[#f5f5f5] prose-pre:text-[#111111] prose-pre:text-sm
            prose-blockquote:border-l-2 prose-blockquote:border-[#e5e5e5] prose-blockquote:text-[#666666]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {isStreaming && <span className="animate-pulse ml-0.5 text-[#999999]">▌</span>}
          </div>
        )}
        <p className="text-xs mt-1.5 text-[#999999]">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = session?.accessToken

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [sessionDocs, setSessionDocs] = useState<Document[]>([])
  const [mode, setMode] = useState<Mode>('chat')
  const [questionCount, setQuestionCount] = useState(10)
  const [questionType, setQuestionType] = useState<QuestionType>('mcq')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState<ProviderMap>({})
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input])

  useEffect(() => {
    if (!token) return

    const urlMode = searchParams.get('mode') as Mode | null
    if (urlMode && ['chat', 'explain', 'exam'].includes(urlMode)) {
      setMode(urlMode)
    }

    Promise.all([
      getDocuments(token),
      getFolders(token).catch(() => [] as Folder[]),
      getProviders(token).catch(() => ({} as ProviderMap)),
    ])
      .then(([docs, fols, providerMap]) => {
        setDocuments(docs)
        setFolders(fols)
        setProviders(providerMap)

        const configuredEntry = Object.entries(providerMap).find(([, v]) => v.configured)
        if (configuredEntry) {
          setSelectedProvider(configuredEntry[0])
          setSelectedModel(configuredEntry[1].models[0] ?? '')
        }

        const docId = searchParams.get('doc')
        if (docId && docs.some((d) => d.id === docId)) {
          setSelectedDocs([docId])
        }

        setLoadingDocs(false)

        const urlSession = searchParams.get('session_id')
        if (urlSession) {
          setSessionId(urlSession)
          setLoadingMessages(true)
          getChatSession(urlSession, token)
            .then((s) => {
              setMessages(s.messages)
              const sDocObjs = s.document_ids
                .map((numId) => docs.find((d) => d.id === String(numId)))
                .filter((d): d is Document => d !== undefined)
              setSessionDocs(sDocObjs)
              if (s.provider) setSelectedProvider(s.provider)
              if (s.model) setSelectedModel(s.model)
            })
            .catch(() => {
              getChatMessages(urlSession, token)
                .then(setMessages)
                .catch(() => {})
            })
            .finally(() => setLoadingMessages(false))
        }
      })
      .catch(() => {
        setLoadingDocs(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const toggleDoc = useCallback((id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }, [])

  const handleProviderModelChange = (value: string) => {
    const sepIdx = value.indexOf(':::')
    if (sepIdx !== -1) {
      setSelectedProvider(value.slice(0, sepIdx))
      setSelectedModel(value.slice(sepIdx + 3))
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isStreaming || !token) return

    if (!sessionId && selectedDocs.length === 0) {
      setError('Please select at least one document to include in the context.')
      return
    }

    setError('')

    const userMsg: ChatMessage = {
      id: `tmp-user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }

    const assistantMsg: ChatMessage = {
      id: `tmp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsStreaming(true)

    try {
      const stream = streamChat(
        {
          session_id: sessionId,
          document_ids: selectedDocs,
          message: text,
          mode,
          ...(mode === 'exam' ? { question_count: questionCount, question_type: questionType } : {}),
          ...(selectedProvider ? { provider: selectedProvider } : {}),
          ...(selectedModel ? { model: selectedModel } : {}),
        },
        token
      )

      for await (const event of stream) {
        if (event.type === 'token' && event.content) {
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: last.content + event.content }
            }
            return updated
          })
        } else if (event.type === 'session_id' && event.session_id) {
          const newSessionId = event.session_id
          setSessionId(newSessionId)
          setSessionDocs(documents.filter((d) => selectedDocs.includes(d.id)))
          router.replace(`/chat?mode=${mode}&session_id=${newSessionId}`, { scroll: false })
        } else if (event.type === 'error') {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: `Error: ${event.message ?? 'Something went wrong.'}`,
            }
            return updated
          })
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'An error occurred while generating a response. Please try again.',
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const modeTabs: { value: Mode; label: string }[] = [
    { value: 'chat', label: 'Chat' },
    { value: 'explain', label: 'Explain' },
    { value: 'exam', label: 'Exam' },
  ]

  const providerSelectEl = Object.keys(providers).length > 0 ? (
    <select
      value={`${selectedProvider}:::${selectedModel}`}
      onChange={(e) => handleProviderModelChange(e.target.value)}
      className="shrink-0 border border-[#e5e5e5] text-[#666666] text-xs px-2 py-1.5 focus:outline-none focus:border-[#999999] bg-white self-end mb-0.5"
    >
      {Object.entries(providers).map(([key, prov]) => (
        <optgroup key={key} label={prov.name}>
          {prov.models.map((m) => (
            <option
              key={m}
              value={`${key}:::${m}`}
              disabled={!prov.configured}
              className={!prov.configured ? 'text-[#999999]' : ''}
            >
              {m}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  ) : null

  // === NO ACTIVE SESSION: Setup panel ===
  if (!sessionId && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-full max-w-xl px-6 py-10">
          <h1 className="text-3xl font-semibold text-[#111111] tracking-tight mb-8">New chat</h1>

          {/* Document picker */}
          <div>
            <p className="text-xs tracking-widest uppercase text-[#999999] mb-3">Documents for this chat</p>
            <p className="text-sm text-[#666666] mb-3">
              Pick individual files or select a whole folder.
            </p>
            {loadingDocs ? (
              <div className="flex justify-center py-6">
                <Spinner size="sm" />
              </div>
            ) : documents.length === 0 ? (
              <div className="py-4">
                <p className="text-sm text-[#999999] mb-2">No documents uploaded yet.</p>
                <a
                  href="/documents"
                  className="text-sm text-[#666666] hover:text-[#111111] underline underline-offset-2"
                >
                  Upload a PDF →
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {/* folders first */}
                {folders.map(folder => {
                  const folderDocs = documents.filter(d => d.folder_id === folder.id)
                  if (folderDocs.length === 0) return null
                  const allSelected = folderDocs.every(d => selectedDocs.includes(d.id))
                  const someSelected = folderDocs.some(d => selectedDocs.includes(d.id))
                  return (
                    <div key={folder.id} className="border border-[#e5e5e5]">
                      <label className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer bg-[#fafafa] border-b border-[#e5e5e5] ${allSelected ? 'bg-[#f5f5f5]' : ''}`}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                          onChange={() => {
                            if (allSelected) {
                              setSelectedDocs(prev => prev.filter(id => !folderDocs.some(d => d.id === id)))
                            } else {
                              setSelectedDocs(prev => [...new Set([...prev, ...folderDocs.map(d => d.id)])])
                            }
                          }}
                          className="accent-[#111111]"
                        />
                        <span className="text-sm font-medium">{folder.name}</span>
                        <span className="text-xs text-[#999999]">{folderDocs.length} file{folderDocs.length !== 1 ? 's' : ''}</span>
                      </label>
                      {folderDocs.map(doc => (
                        <label key={doc.id} className={`flex items-start gap-2.5 px-5 py-2 cursor-pointer border-b border-[#e5e5e5] last:border-b-0 ${selectedDocs.includes(doc.id) ? 'bg-[#f5f5f5]' : 'hover:bg-[#fafafa]'}`}>
                          <input type="checkbox" checked={selectedDocs.includes(doc.id)} onChange={() => toggleDoc(doc.id)} className="mt-0.5 accent-[#111111]" />
                          <div className="min-w-0">
                            <p className="text-sm text-[#111111] truncate">{doc.original_name}</p>
                            <p className="text-xs text-[#999999]">{doc.page_count} pages</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )
                })}
                {/* unfiled docs */}
                {documents.filter(d => d.folder_id === null).map(doc => (
                  <label key={doc.id} className={`flex items-start gap-2.5 p-2 cursor-pointer border ${selectedDocs.includes(doc.id) ? 'border-[#111111] bg-[#f5f5f5]' : 'border-transparent hover:border-[#e5e5e5]'}`}>
                    <input type="checkbox" checked={selectedDocs.includes(doc.id)} onChange={() => toggleDoc(doc.id)} className="mt-0.5 accent-[#111111]" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#111111] font-medium truncate">{doc.original_name}</p>
                      <p className="text-xs text-[#999999]">{doc.page_count} pages</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* First message */}
          <p className="text-xs tracking-widest uppercase text-[#999999] mb-2 mt-6">First message</p>
          <div className="border border-[#e5e5e5] px-4 py-3 focus-within:border-[#999999] transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              rows={3}
              className="w-full bg-transparent text-[#111111] placeholder-[#bbbbbb] text-base resize-none focus:outline-none leading-relaxed"
              style={{ minHeight: '72px', maxHeight: '160px' }}
            />
          </div>
          <p className="text-xs text-[#999999] mt-1.5">Press ⌘+Enter to send</p>

          {/* Provider/model row */}
          {Object.keys(providers).length > 0 && (
            <div className="mt-4">
              <select
                value={`${selectedProvider}:::${selectedModel}`}
                onChange={(e) => handleProviderModelChange(e.target.value)}
                className="border border-[#e5e5e5] text-[#666666] text-sm px-2 py-1.5 focus:outline-none focus:border-[#999999] bg-white"
              >
                {Object.entries(providers).map(([key, prov]) => (
                  <optgroup key={key} label={prov.name}>
                    {prov.models.map((m) => (
                      <option
                        key={m}
                        value={`${key}:::${m}`}
                        disabled={!prov.configured}
                        className={!prov.configured ? 'text-[#999999]' : ''}
                      >
                        {m}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 px-4 py-2.5 text-[#cc0000] text-sm flex items-center justify-between border border-[#cc0000]/20">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-[#999999] hover:text-[#cc0000] ml-4">
                ×
              </button>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={handleSend}
            disabled={selectedDocs.length === 0 || !input.trim() || isStreaming}
            className="w-full mt-4 py-3 bg-[#111111] text-white text-base font-medium hover:bg-[#333333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isStreaming ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" /> Starting…
              </span>
            ) : (
              'Start chat'
            )}
          </button>
          {selectedDocs.length > 0 && !input.trim() && (
            <p className="text-xs text-[#999999] mt-2 text-center">Type your first message above to start</p>
          )}
          {selectedDocs.length === 0 && (
            <p className="text-xs text-[#999999] mt-2 text-center">Select at least one document above</p>
          )}
        </div>
      </div>
    )
  }

  // === ACTIVE SESSION ===
  return (
    <div className="flex h-full">
      {/* Left panel */}
      <aside
        className={`
          shrink-0 border-r border-[#e5e5e5] bg-white flex flex-col
          transition-all duration-300 overflow-hidden
          ${panelOpen ? 'w-60' : 'w-0'}
        `}
      >
        {/* Session docs (read-only) */}
        <div className="p-4 border-b border-[#e5e5e5] shrink-0">
          <p className="text-xs tracking-widest uppercase text-[#999999] mb-3">This chat</p>
          {sessionDocs.length === 0 ? (
            <p className="text-xs text-[#999999]">No documents</p>
          ) : (
            <div className="space-y-2">
              {sessionDocs.map((doc) => (
                <div key={doc.id} className="min-w-0">
                  <p className="text-sm text-[#111111] truncate">{doc.original_name}</p>
                  <p className="text-xs text-[#999999]">{doc.page_count} pages</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div className="p-4 border-b border-[#e5e5e5] shrink-0">
          <p className="text-xs tracking-widest uppercase text-[#999999] mb-3">Study Mode</p>
          <div className="flex gap-4">
            {modeTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setMode(tab.value)}
                className={`text-sm transition-colors pb-0.5 ${
                  mode === tab.value
                    ? 'text-[#111111] font-semibold border-b-2 border-[#111111]'
                    : 'text-[#999999] hover:text-[#666666]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exam options */}
        {mode === 'exam' && (
          <div className="p-4 border-b border-[#e5e5e5] shrink-0">
            <p className="text-xs tracking-widest uppercase text-[#999999] mb-3">Exam Settings</p>
            <div className="mb-3">
              <label className="text-xs text-[#666666] mb-1.5 block">Questions</label>
              <div className="flex gap-1.5 flex-wrap">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`text-xs px-2.5 py-1 border transition-colors ${
                      questionCount === n
                        ? 'bg-[#111111] border-[#111111] text-white'
                        : 'border-[#e5e5e5] text-[#666666] hover:border-[#999999]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#666666] mb-1.5 block">Type</label>
              <div className="flex flex-col gap-1">
                {[
                  { value: 'mcq', label: 'MCQ' },
                  { value: 'short_answer', label: 'Short Answer' },
                  { value: 'essay', label: 'Essay' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setQuestionType(t.value as QuestionType)}
                    className={`text-xs px-3 py-1.5 border text-left transition-colors ${
                      questionType === t.value
                        ? 'bg-[#111111] border-[#111111] text-white'
                        : 'border-[#e5e5e5] text-[#666666] hover:border-[#999999]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[#e5e5e5] shrink-0">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="text-[#999999] hover:text-[#111111] transition-colors p-1"
            title={panelOpen ? 'Hide panel' : 'Show panel'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            {modeTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setMode(tab.value)}
                className={`text-sm transition-colors pb-0.5 ${
                  mode === tab.value
                    ? 'text-[#111111] font-semibold border-b-2 border-[#111111]'
                    : 'text-[#999999] hover:text-[#666666]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {sessionDocs.length > 0 && (
            <div className="ml-auto text-xs text-[#999999]">
              {sessionDocs.length} doc{sessionDocs.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loadingMessages ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
              <h2 className="text-xl font-semibold text-[#111111] tracking-tight mb-2">
                {mode === 'chat'
                  ? 'Ask anything about your documents'
                  : mode === 'explain'
                  ? 'Get clear explanations of complex topics'
                  : 'Generate a practice exam'}
              </h2>
              <p className="text-[#666666] text-sm mb-4 leading-relaxed">
                {mode === 'exam'
                  ? 'Type "generate exam" or describe what topics to test.'
                  : 'Type your question or topic below.'}
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 px-4 py-2.5 text-[#cc0000] text-sm flex items-center justify-between border border-[#cc0000]/20">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-[#999999] hover:text-[#cc0000] ml-4">
              ×
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="shrink-0 px-4 pb-4 pt-2 border-t border-[#e5e5e5]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-white border border-[#e5e5e5] px-4 py-3 focus-within:border-[#999999] transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === 'exam'
                    ? 'Describe the exam you want to generate…'
                    : mode === 'explain'
                    ? 'What would you like explained?'
                    : 'Ask a question…'
                }
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-transparent text-[#111111] placeholder-[#bbbbbb] text-base resize-none focus:outline-none leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ minHeight: '24px', maxHeight: '160px' }}
              />
              {providerSelectEl}
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                size="sm"
                className="shrink-0"
              >
                {isStreaming ? <Spinner size="sm" /> : '↑'}
              </Button>
            </div>
            <p className="text-xs text-[#999999] mt-2 text-center">
              Press Ctrl+Enter or ⌘+Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
