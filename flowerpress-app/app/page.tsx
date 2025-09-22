'use client'

import { useState, useEffect } from 'react'
import Editor from '@/components/Editor'
import Sidebar from '@/components/Sidebar'
import { useEditorStore } from '@/lib/store'
import { editorAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'
import { Document } from '@/types'

export default function Home() {
  const [spaceId] = useState('default-space')
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishUrl, setPublishUrl] = useState<string | null>(null)

  const { currentDocument, isSaving, hasUnsavedChanges, setHasUnsavedChanges } = useEditorStore()

  // Initialize with a default document on first load
  useEffect(() => {
    const initializeDocument = async () => {
      try {
        const response = await fetch(`/api/spaces/${spaceId}/documents`)
        const documents = await response.json()

        if (documents.length === 0) {
          // Create a default document if none exist
          const createResponse = await fetch(`/api/spaces/${spaceId}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Welcome to FlowerPress' })
          })
          const newDoc = await createResponse.json()
          setCurrentDoc(newDoc)
        } else {
          setCurrentDoc(documents[0])
        }
      } catch (error) {
        console.error('Failed to initialize document:', error)
      }
    }

    initializeDocument()
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
      if (!confirm('You have unsaved changes. Do you want to continue?')) {
        return
      }
    }
    setCurrentDoc(doc)
    setPublishUrl(null)
  }

  const handleNewDocument = async (folderId?: string) => {
    const title = prompt('Enter document title:')
    if (!title) return

    try {
      const response = await fetch(`/api/spaces/${spaceId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, folderId })
      })

      if (response.ok) {
        const newDoc = await response.json()
        setCurrentDoc(newDoc)
        toast.success('Document created')
        // Trigger sidebar refresh
        window.dispatchEvent(new CustomEvent('refresh-sidebar'))
      }
    } catch (error) {
      toast.error('Failed to create document')
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
            <div className="h-full p-6">
              <Editor key={currentDoc.id} spaceId={spaceId} docSlug={currentDoc.slug} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select or create a document to get started
            </div>
          )}
        </main>
      </div>
    </div>
  )
}