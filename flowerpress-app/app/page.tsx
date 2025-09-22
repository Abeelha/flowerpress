'use client'

import { useState, useEffect } from 'react'
import SplitScreenEditor from '@/components/SplitScreenEditor'
import Sidebar from '@/components/Sidebar'
import SaveDumpViewer from '@/components/SaveDumpViewer'
import { useEditorStore } from '@/lib/store'
import { editorAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'
import { Document } from '@/types'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function Home() {
  const [spaceId] = useState('default-space')
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishUrl, setPublishUrl] = useState<string | null>(null)
  const [newDocModal, setNewDocModal] = useState<{ isOpen: boolean, folderId?: string }>({ isOpen: false })
  const [unsavedConfirm, setUnsavedConfirm] = useState<{ isOpen: boolean, pendingDoc: Document | null }>({ isOpen: false, pendingDoc: null })
  const [isCreatingDocument, setIsCreatingDocument] = useState(false)

  const { currentDocument, isSaving, hasUnsavedChanges, setHasUnsavedChanges } = useEditorStore()

  // Initialize with a default document for headless mode
  useEffect(() => {
    const defaultDoc: Document = {
      id: 'welcome-doc',
      spaceId,
      slug: 'welcome',
      title: 'Welcome to Flowerpress',
      markdown: `# Welcome to Flowerpress

This is a headless markdown editor with drag & drop support!

## Features

- **Drag & Drop Images**: Drop image files to insert them automatically
- **CSV Support**: Drop CSV files to convert them to markdown tables
- **Save Visualization**: All saves are dumped to screen so you can see the flow
- **Multiple View Modes**: Rich text, split, source, and preview modes

## Try it out!

1. Try typing in this editor
2. Drag and drop an image file
3. Drop a CSV file to see it converted to a table
4. Click the "💾 Saves" button in the top right to see all save events

The backend is completely mocked - all saves are logged and displayed so you can see exactly what data would be sent to your real backend.
`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setCurrentDoc(defaultDoc)
  }, [spaceId])

  const handleSave = async () => {
    if (!currentDocument?.markdown || !currentDoc) return

    try {
      await editorAPI.saveMarkdown(spaceId, currentDoc.slug, currentDocument.markdown)
      setHasUnsavedChanges(false)
      toast.success('Document saved successfully')
    } catch (error) {
      toast.error('Failed to save document')
    }
  }

  const handlePublish = async () => {
    if (!currentDocument?.markdown || !currentDoc) return

    setIsPublishing(true)
    try {
      await editorAPI.saveMarkdown(spaceId, currentDoc.slug, currentDocument.markdown)
      const url = `${window.location.origin}/view/${spaceId}/${currentDoc.slug}`
      setPublishUrl(url)
      toast.success('Document published successfully!')
    } catch (error) {
      toast.error('Failed to publish document')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDocumentSelect = (doc: Document) => {
    if (hasUnsavedChanges) {
      setUnsavedConfirm({ isOpen: true, pendingDoc: doc })
      return
    }
    setCurrentDoc(doc)
    setPublishUrl(null)
  }

  const handleDocumentUpdate = (updatedDoc: Document) => {
    setCurrentDoc(updatedDoc)
    // Trigger sidebar refresh to show updated title
    window.dispatchEvent(new CustomEvent('refresh-sidebar'))
  }

  const handleUnsavedConfirm = () => {
    if (unsavedConfirm.pendingDoc) {
      setCurrentDoc(unsavedConfirm.pendingDoc)
      setPublishUrl(null)
      setHasUnsavedChanges(false)
    }
    setUnsavedConfirm({ isOpen: false, pendingDoc: null })
  }

  const handleNewDocument = (folderId?: string) => {
    setNewDocModal({ isOpen: true, folderId })
  }

  const handleNewDocumentConfirm = async (title: string) => {
    if (isCreatingDocument) return // Prevent duplicate submissions

    try {
      setIsCreatingDocument(true)
      const response = await fetch(`/api/spaces/${spaceId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), folderId: newDocModal.folderId })
      })

      if (response.ok) {
        const newDoc = await response.json()
        setCurrentDoc(newDoc)
        toast.success('Document created')
        // Trigger sidebar refresh
        window.dispatchEvent(new CustomEvent('refresh-sidebar'))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create document')
      }
    } catch (error) {
      console.error('Document creation error:', error)
      toast.error('Failed to create document')
    } finally {
      setIsCreatingDocument(false)
      setNewDocModal({ isOpen: false })
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors">
      <Sidebar
        spaceId={spaceId}
        currentDocId={currentDoc?.id}
        onDocumentSelect={handleDocumentSelect}
        onNewDocument={handleNewDocument}
      />

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentDoc?.title || 'No document selected'}
              </h1>
              {hasUnsavedChanges && !isSaving && (
                <span className="text-sm text-gray-500 dark:text-gray-400">• Unsaved changes</span>
              )}
              {isSaving && (
                <span className="text-sm text-gray-500 dark:text-gray-400">• Saving...</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving || !currentDoc}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || !currentDoc}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPublishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
          {publishUrl && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md text-sm">
              Document published at:{' '}
              <a
                href={publishUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                {publishUrl}
              </a>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-hidden">
          {currentDoc ? (
            <div className="h-full">
              <SplitScreenEditor
                key={currentDoc.id}
                spaceId={spaceId}
                document={currentDoc}
                onDocumentUpdate={handleDocumentUpdate}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select or create a document to get started
            </div>
          )}
        </main>
      </div>

      {/* Modal for new document */}
      <Modal
        isOpen={newDocModal.isOpen}
        onClose={() => !isCreatingDocument && setNewDocModal({ isOpen: false })}
        onConfirm={handleNewDocumentConfirm}
        title="Create New Document"
        placeholder="Enter document title"
        confirmText={isCreatingDocument ? "Creating..." : "Create"}
        disabled={isCreatingDocument}
      />

      {/* Confirmation dialog for unsaved changes */}
      <ConfirmDialog
        isOpen={unsavedConfirm.isOpen}
        onClose={() => setUnsavedConfirm({ isOpen: false, pendingDoc: null })}
        onConfirm={handleUnsavedConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Do you want to continue without saving?"
        confirmText="Continue"
        cancelText="Stay"
        variant="default"
      />

      {/* Save Dump Viewer */}
      <SaveDumpViewer />
    </div>
  )
}