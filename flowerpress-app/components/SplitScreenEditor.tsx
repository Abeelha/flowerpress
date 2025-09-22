'use client'

import { useState, useEffect } from 'react'
import CodeMirrorEditor, { MarkdownPreview } from './CodeMirrorEditor'
import BlockNoteEditor from './BlockNoteEditor'
import { useEditorStore } from '@/lib/store'
import { editorAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface SplitScreenEditorProps {
  spaceId: string
  docSlug: string
}

export default function SplitScreenEditor({ spaceId, docSlug }: SplitScreenEditorProps) {
  const [markdown, setMarkdown] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'rich' | 'split' | 'source' | 'preview'>('rich')

  const {
    currentDocument,
    setDocument,
    setSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges
  } = useEditorStore()

  // Load document on mount
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true)
        const { markdown: content, version } = await editorAPI.getMarkdown(spaceId, docSlug)
        setMarkdown(content || '# Untitled Document\n\n')
        setDocument({
          id: docSlug,
          spaceId,
          slug: docSlug,
          title: content?.split('\n')[0]?.replace(/^#\s*/, '') || 'Untitled Document',
          markdown: content || '',
          version,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        setHasUnsavedChanges(false)
      } catch (error) {
        console.error('Failed to load document:', error)
        setMarkdown('# Untitled Document\n\n')
      } finally {
        setIsLoading(false)
      }
    }

    loadDocument()
  }, [spaceId, docSlug, setDocument, setHasUnsavedChanges])

  // Handle markdown changes
  const handleMarkdownChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown)
    setDocument({
      id: currentDocument?.id || docSlug,
      spaceId,
      slug: docSlug,
      title: newMarkdown.split('\n')[0]?.replace(/^#\s*/, '') || 'Untitled Document',
      markdown: newMarkdown,
      version: currentDocument?.version,
      createdAt: currentDocument?.createdAt || new Date(),
      updatedAt: new Date()
    })
    setHasUnsavedChanges(true)
  }

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(async () => {
      if (hasUnsavedChanges && markdown) {
        try {
          setSaving(true)
          await editorAPI.saveMarkdown(spaceId, docSlug, markdown)
          setHasUnsavedChanges(false)
        } catch (error) {
          console.error('Autosave failed:', error)
        } finally {
          setSaving(false)
        }
      }
    }, 3000) // Auto-save every 3 seconds

    return () => clearInterval(interval)
  }, [hasUnsavedChanges, markdown, spaceId, docSlug, setSaving, setHasUnsavedChanges])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('rich')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'rich'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Rich
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'split'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('source')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'source'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Source
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'preview'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{markdown.length} chars</span>
          <span>•</span>
          <span>{markdown.split('\n').length} lines</span>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex min-h-0">
        {viewMode === 'rich' && (
          <div className="w-full h-full">
            <BlockNoteEditor
              value={markdown}
              onChange={handleMarkdownChange}
            />
          </div>
        )}

        {viewMode === 'split' && (
          <>
            <div className="w-1/2 h-full border-r border-gray-200 dark:border-gray-700">
              <BlockNoteEditor
                value={markdown}
                onChange={handleMarkdownChange}
              />
            </div>
            <div className="w-1/2 h-full bg-white dark:bg-gray-900">
              <MarkdownPreview markdown={markdown} />
            </div>
          </>
        )}

        {viewMode === 'source' && (
          <div className="w-full h-full">
            <CodeMirrorEditor
              value={markdown}
              onChange={handleMarkdownChange}
            />
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="w-full h-full bg-white dark:bg-gray-900">
            <MarkdownPreview markdown={markdown} />
          </div>
        )}
      </div>
    </div>
  )
}