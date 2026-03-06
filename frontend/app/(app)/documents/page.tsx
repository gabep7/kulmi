'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  getDocuments, uploadDocument, deleteDocument,
  getFolders, createFolder, renameFolder, deleteFolder, assignDocumentToFolder,
  Document, Folder,
} from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

export default function DocumentsPage() {
  const { data: session } = useSession()
  const token = session?.accessToken
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadFolderId, setUploadFolderId] = useState<number | null>(null)
  const [error, setError] = useState('')

  // folder creation
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)

  // rename folder
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null)
  const [renameName, setRenameName] = useState('')

  // delete modals
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null)
  const [deleteFolderId, setDeleteFolderId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // move doc to folder
  const [movingDoc, setMovingDoc] = useState<Document | null>(null)

  // which folders are expanded
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const fetchAll = async () => {
    if (!token) return
    try {
      const [docs, fols] = await Promise.all([getDocuments(token), getFolders(token)])
      setDocuments(docs)
      setFolders(fols)
    } catch {
      setError('failed to load documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [token]) // eslint-disable-line

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    if (!file.name.endsWith('.pdf')) { setError('only pdf files are supported.'); return }

    setUploading(true)
    setUploadProgress(10)
    setError('')
    const interval = setInterval(() => setUploadProgress(p => Math.min(p + 15, 85)), 400)

    try {
      const doc = await uploadDocument(file, token)
      if (uploadFolderId !== null) {
        await assignDocumentToFolder(doc.id, uploadFolderId, token)
        setExpanded(prev => new Set(prev).add(uploadFolderId))
      }
      setUploadProgress(100)
      setTimeout(() => setUploadProgress(0), 800)
      fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed.')
    } finally {
      clearInterval(interval)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteDoc = async () => {
    if (!deleteDocId || !token) return
    setDeleting(true)
    try {
      await deleteDocument(deleteDocId, token)
      setDocuments(prev => prev.filter(d => d.id !== deleteDocId))
    } catch { setError('failed to delete.') }
    finally { setDeleting(false); setDeleteDocId(null) }
  }

  const handleDeleteFolder = async () => {
    if (!deleteFolderId || !token) return
    setDeleting(true)
    try {
      await deleteFolder(deleteFolderId, token)
      fetchAll()
    } catch { setError('failed to delete folder.') }
    finally { setDeleting(false); setDeleteFolderId(null) }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim() || !token) return
    setCreatingFolder(true)
    try {
      const f = await createFolder(newFolderName.trim(), token)
      setFolders(prev => [...prev, f].sort((a, b) => a.name.localeCompare(b.name)))
      setNewFolderName('')
      setShowNewFolder(false)
      setExpanded(prev => new Set(prev).add(f.id))
    } catch { setError('failed to create folder.') }
    finally { setCreatingFolder(false) }
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renamingFolder || !renameName.trim() || !token) return
    try {
      const updated = await renameFolder(renamingFolder.id, renameName.trim(), token)
      setFolders(prev => prev.map(f => f.id === updated.id ? updated : f).sort((a, b) => a.name.localeCompare(b.name)))
      setRenamingFolder(null)
    } catch { setError('failed to rename folder.') }
  }

  const handleMove = async (folderId: number | null) => {
    if (!movingDoc || !token) return
    try {
      await assignDocumentToFolder(movingDoc.id, folderId, token)
      if (folderId !== null) setExpanded(prev => new Set(prev).add(folderId))
      fetchAll()
    } catch { setError('failed to move document.') }
    finally { setMovingDoc(null) }
  }

  const toggleFolder = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const unfiledDocs = documents.filter(d => d.folder_id === null)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">documents</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => { setShowNewFolder(true); setUploadFolderId(null) }}>
            + new folder
          </Button>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'uploading...' : '+ upload pdf'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-6 h-0.5 bg-[#e5e5e5]">
          <div className="h-0.5 bg-[#111111] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* new folder form */}
      {showNewFolder && (
        <form onSubmit={handleCreateFolder} className="flex gap-2 mb-6">
          <input
            autoFocus
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="folder name"
            className="flex-1 border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#111111]"
          />
          <Button type="submit" disabled={creatingFolder || !newFolderName.trim()}>
            {creatingFolder ? 'creating...' : 'create'}
          </Button>
          <Button variant="ghost" type="button" onClick={() => { setShowNewFolder(false); setNewFolderName('') }}>
            cancel
          </Button>
        </form>
      )}

      {/* folders */}
      {folders.map(folder => {
        const folderDocs = documents.filter(d => d.folder_id === folder.id)
        const open = expanded.has(folder.id)
        return (
          <div key={folder.id} className="mb-4 border border-[#e5e5e5]">
            <div className="flex items-center justify-between px-4 py-3 bg-[#fafafa] cursor-pointer select-none"
              onClick={() => toggleFolder(folder.id)}>
              <div className="flex items-center gap-2">
                <span className="text-[#999999] text-xs">{open ? '▾' : '▸'}</span>
                <span className="font-medium text-sm">{folder.name}</span>
                <span className="text-xs text-[#999999]">{folderDocs.length} file{folderDocs.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                <button
                  className="text-xs text-[#999999] hover:text-[#111111]"
                  onClick={() => {
                    setUploadFolderId(folder.id)
                    setExpanded(prev => new Set(prev).add(folder.id))
                    fileInputRef.current?.click()
                  }}
                >
                  upload here
                </button>
                <button
                  className="text-xs text-[#999999] hover:text-[#111111]"
                  onClick={() => { setRenamingFolder(folder); setRenameName(folder.name) }}
                >
                  rename
                </button>
                <button
                  className="text-xs text-[#999999] hover:text-red-500"
                  onClick={() => setDeleteFolderId(folder.id)}
                >
                  delete
                </button>
              </div>
            </div>

            {open && (
              <div>
                {folderDocs.length === 0 ? (
                  <p className="text-sm text-[#999999] px-4 py-3">no files yet — upload here or move files in</p>
                ) : (
                  folderDocs.map(doc => (
                    <DocRow key={doc.id} doc={doc} folders={folders}
                      onDelete={() => setDeleteDocId(doc.id)}
                      onMove={() => setMovingDoc(doc)} />
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* unfiled docs */}
      {unfiledDocs.length > 0 && (
        <div className="border border-[#e5e5e5]">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#e5e5e5]">
            <span className="text-sm text-[#999999]">unfiled</span>
          </div>
          {unfiledDocs.map(doc => (
            <DocRow key={doc.id} doc={doc} folders={folders}
              onDelete={() => setDeleteDocId(doc.id)}
              onMove={() => setMovingDoc(doc)} />
          ))}
        </div>
      )}

      {folders.length === 0 && documents.length === 0 && (
        <p className="text-[#999999] text-sm mt-4">no documents yet. upload a pdf to get started.</p>
      )}

      {/* delete doc modal */}
      <Modal isOpen={!!deleteDocId} onClose={() => setDeleteDocId(null)} title="delete document">
        <p className="text-sm text-[#555555] mb-6">this will permanently remove the document and its index.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteDocId(null)}>cancel</Button>
          <Button onClick={handleDeleteDoc} disabled={deleting}>
            {deleting ? 'deleting...' : 'delete'}
          </Button>
        </div>
      </Modal>

      {/* delete folder modal */}
      <Modal isOpen={!!deleteFolderId} onClose={() => setDeleteFolderId(null)} title="delete folder">
        <p className="text-sm text-[#555555] mb-6">the folder will be removed. files inside will become unfiled.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteFolderId(null)}>cancel</Button>
          <Button onClick={handleDeleteFolder} disabled={deleting}>
            {deleting ? 'deleting...' : 'delete'}
          </Button>
        </div>
      </Modal>

      {/* rename folder modal */}
      <Modal isOpen={!!renamingFolder} onClose={() => setRenamingFolder(null)} title="rename folder">
        <form onSubmit={handleRename}>
          <input
            autoFocus
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            className="w-full border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#111111] mb-6"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setRenamingFolder(null)}>cancel</Button>
            <Button type="submit" disabled={!renameName.trim()}>save</Button>
          </div>
        </form>
      </Modal>

      {/* move doc modal */}
      <Modal isOpen={!!movingDoc} onClose={() => setMovingDoc(null)} title="move to folder">
        <p className="text-sm text-[#555555] mb-4">choose a folder for <strong>{movingDoc?.original_name}</strong></p>
        <div className="flex flex-col gap-2 mb-6">
          {folders.map(f => (
            <button key={f.id}
              className={`text-left px-3 py-2 text-sm border ${movingDoc?.folder_id === f.id ? 'border-[#111111] bg-[#f5f5f5]' : 'border-[#e5e5e5] hover:border-[#111111]'}`}
              onClick={() => handleMove(f.id)}>
              {f.name}
            </button>
          ))}
          {movingDoc?.folder_id !== null && (
            <button
              className="text-left px-3 py-2 text-sm border border-[#e5e5e5] hover:border-[#111111] text-[#999999]"
              onClick={() => handleMove(null)}>
              remove from folder (unfiled)
            </button>
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => setMovingDoc(null)}>cancel</Button>
        </div>
      </Modal>
    </div>
  )
}

function DocRow({ doc, folders, onDelete, onMove }: {
  doc: Document
  folders: Folder[]
  onDelete: () => void
  onMove: () => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e5e5] first:border-t-0">
      <div>
        <p className="text-sm font-medium">{doc.original_name}</p>
        <p className="text-xs text-[#999999]">{doc.page_count} pages · {new Date(doc.created_at).toLocaleDateString()}</p>
      </div>
      <div className="flex gap-3">
        <button className="text-xs text-[#999999] hover:text-[#111111]" onClick={onMove}>
          move
        </button>
        <button className="text-xs text-[#999999] hover:text-red-500" onClick={onDelete}>
          delete
        </button>
      </div>
    </div>
  )
}
