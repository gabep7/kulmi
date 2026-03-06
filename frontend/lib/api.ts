const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface Document {
  id: string
  filename: string
  original_name: string
  page_count: number
  created_at: string
}

export interface ChatSession {
  id: string
  document_id: string
  document_ids: number[]
  title: string
  provider?: string
  model?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatRequest {
  session_id?: string
  document_ids: string[]
  message: string
  mode: 'chat' | 'explain' | 'exam'
  question_count?: number
  question_type?: 'mcq' | 'short_answer' | 'essay'
  provider?: string
  model?: string
}

export interface StreamEvent {
  type: 'session_id' | 'token' | 'done' | 'error'
  content?: string
  session_id?: string
  message?: string
}

async function fetchAPI(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || `HTTP ${res.status}`)
  }

  return res
}

export async function uploadDocument(file: File, token: string): Promise<Document> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function deleteDocument(id: string, token: string): Promise<void> {
  await fetchAPI(`/documents/${id}`, { method: 'DELETE' }, token)
}

export async function getDocuments(token: string): Promise<Document[]> {
  const res = await fetchAPI('/documents', {}, token)
  return res.json()
}

export async function getChatSessions(token: string): Promise<ChatSession[]> {
  const res = await fetchAPI('/chat/sessions', {}, token)
  return res.json()
}

export async function getChatMessages(
  sessionId: string,
  token: string
): Promise<ChatMessage[]> {
  const res = await fetchAPI(`/chat/sessions/${sessionId}/messages`, {}, token)
  return res.json()
}

export async function deleteChatSession(id: string, token: string): Promise<void> {
  await fetchAPI(`/chat/sessions/${id}`, { method: 'DELETE' }, token)
}

export async function getProviders(token: string): Promise<Record<string, {
  name: string
  models: string[]
  requires_key: boolean
  configured: boolean
}>> {
  const res = await fetchAPI('/chat/providers', {}, token)
  return res.json()
}

export async function getChatSession(sessionId: string, token: string): Promise<{
  id: string
  title: string
  document_ids: number[]
  provider?: string
  model?: string
  created_at: string
  messages: ChatMessage[]
}> {
  const res = await fetchAPI(`/chat/sessions/${sessionId}`, {}, token)
  return res.json()
}

export async function registerUser(data: {
  full_name: string
  email: string
  password: string
}): Promise<{ id: string; email: string; full_name: string }> {
  const res = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function* streamChat(
  body: ChatRequest,
  token: string
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Stream failed: HTTP ${response.status}`)
  }

  if (!response.body) {
    throw new Error('No response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          yield JSON.parse(data) as StreamEvent
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}
