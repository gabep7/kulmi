'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getDocuments, uploadDocument, deleteDocument, Document } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

export default function DocumentsPage() {
  const { data: session } = useSession()
  const token = session?.accessToken
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const fetchDocs = async () => {
    if (!token) return
    try {
      const docs = await getDocuments(token)
      setDocuments(docs)
    } catch {
      setError('Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    if (!file.name.endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      return
    }

    setUploading(true)
    setUploadProgress(10)
    setError('')

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 15, 85))
    }, 500)

    try {
      await uploadDocument(file, token)
      setUploadProgress(100)
      setTimeout(() => setUploadProgress(0), 1000)
      fetchDocs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      clearInterval(progressInterval)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!deleteId || !token) return
    setDeleting(true)
    try {
      await deleteDocument(deleteId, token)
      setDocuments((prev) => prev.filter((d) => d.id !== deleteId))
    } catch {
      setError('Failed to delete document.')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const docToDelete = documents.find((d) => d.id === deleteId)

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111] tracking-tight">Documents</h1>
          <p className="text-[#666666] text-sm mt-0.5">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} uploaded
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} loading={uploading} size="md">
          Upload PDF
        </Button>
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
      </div>

      {/* Upload progress */}
      {uploading && uploadProgress > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-[#666666] mb-1.5">
            <span>Uploading…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-0.5 bg-[#e5e5e5] overflow-hidden">
            <div
              className="h-full bg-[#111111] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 text-sm text-[#cc0000]">{error}</div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold text-[#111111] mb-2">No documents yet</h2>
          <p className="text-[#666666] mb-6 max-w-sm leading-relaxed text-sm">
            Upload your first PDF to get started. Kulmi will analyze it so you can chat, get explanations, and generate practice exams.
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>Upload your first PDF</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="border border-[#e5e5e5] p-5 group hover:border-[#999999] transition-colors duration-150">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 border border-[#e5e5e5] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#999999]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <button
                  onClick={() => setDeleteId(doc.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#999999] hover:text-[#cc0000] transition-all text-sm"
                  title="Delete"
                >
                  ×
                </button>
              </div>
              <h3 className="text-base font-semibold text-[#111111] mb-1 truncate" title={doc.original_name}>
                {doc.original_name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-[#999999]">
                <span>{doc.page_count} pages</span>
                <span>·</span>
                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={
          <span>
            Are you sure you want to delete{' '}
            <strong className="text-[#111111]">{docToDelete?.original_name}</strong>?
            This will also remove any chat sessions associated with it. This action cannot be undone.
          </span>
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
