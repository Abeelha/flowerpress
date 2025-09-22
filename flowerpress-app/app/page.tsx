'use client'

import { useState } from 'react'
import Editor from '@/components/Editor'
import { useEditorStore } from '@/lib/store'
import { editorAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  const [spaceId] = useState('default-space')
  const [docSlug] = useState('my-document')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishUrl, setPublishUrl] = useState<string | null>(null)

  const { currentDocument, isSaving, hasUnsavedChanges } = useEditorStore()

  const handleSave = async () => {
    if (!currentDocument?.markdown) return

    try {
      await editorAPI.saveMarkdown(spaceId, docSlug, currentDocument.markdown)
      toast.success('Document saved successfully')
    } catch (error) {
      toast.error('Failed to save document')
    }
  }

  const handlePublish = async () => {
    if (!currentDocument?.markdown) return

    setIsPublishing(true)
    try {
      await editorAPI.saveMarkdown(spaceId, docSlug, currentDocument.markdown)
      const url = `${window.location.origin}/view/${spaceId}/${docSlug}`
      setPublishUrl(url)
      toast.success('Document published successfully!')
    } catch (error) {
      toast.error('Failed to publish document')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🌸 FlowerPress</h1>
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
              disabled={!hasUnsavedChanges || isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
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

      <main className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        <div className="h-full max-w-5xl mx-auto p-6">
          <Editor spaceId={spaceId} docSlug={docSlug} />
        </div>
      </main>
    </div>
  )
}