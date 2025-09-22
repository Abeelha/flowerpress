'use client'

import { useEffect, useState, useMemo } from 'react'
import { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import { BlockNoteView, useCreateBlockNote } from '@blocknote/react'
import '@blocknote/react/style.css'
import { useEditorStore } from '@/lib/store'
import { editorAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import { useTheme } from '@/contexts/theme-context'

interface EditorProps {
  spaceId: string
  docSlug: string
}

export default function Editor({ spaceId, docSlug }: EditorProps) {
  const { theme } = useTheme()
  const {
    currentDocument,
    setDocument,
    updateMarkdown,
    addAsset,
    setSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges
  } = useEditorStore()

  const [isLoading, setIsLoading] = useState(true)
  const [initialMarkdown, setInitialMarkdown] = useState<string>('')

  // Load document on mount
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true)
        const { markdown, version } = await editorAPI.getMarkdown(spaceId, docSlug)
        setDocument({
          id: docSlug,
          spaceId,
          slug: docSlug,
          markdown,
          version,
          updatedAt: new Date()
        })
        setInitialMarkdown(markdown || '')
      } catch (error) {
        console.error('Failed to load document:', error)
        setInitialMarkdown('# Untitled Document\n')
      } finally {
        setIsLoading(false)
      }
    }

    loadDocument()
  }, [spaceId, docSlug, setDocument])

  // Create editor only after initial content is loaded
  const editor = useCreateBlockNote({
    initialContent: initialMarkdown && !isLoading ?
      initialMarkdown :
      undefined,
  })

  const handleFileDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        const uploadResponse = await editorAPI.uploadAsset(spaceId, docSlug, file)

        const isImage = file.type.startsWith('image/')
        const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv')

        if (isImage) {
          editor.insertBlocks([
            {
              type: 'image',
              props: {
                url: uploadResponse.url,
                caption: file.name
              }
            }
          ], editor.getTextCursorPosition().block)
        } else if (isCSV) {
          editor.insertBlocks([
            {
              type: 'paragraph',
              content: `{{table: ${uploadResponse.relPath}}}`
            }
          ], editor.getTextCursorPosition().block)
        }

        addAsset({
          spaceId,
          docId: docSlug,
          relPath: uploadResponse.relPath,
          url: uploadResponse.url,
          mediaType: uploadResponse.mediaType,
          size: file.size,
          hash: uploadResponse.hash,
          updatedAt: new Date()
        })

        toast.success(`Uploaded ${file.name}`)
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`)
        console.error(error)
      }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': [],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  })

  // Update markdown on editor changes
  useEffect(() => {
    if (!editor || isLoading) return

    const handleChange = async () => {
      const markdown = await editor.blocksToMarkdownLossy(editor.document)
      updateMarkdown(markdown)
    }

    editor.onChange(handleChange)
  }, [editor, updateMarkdown, isLoading])

  // Autosave
  useEffect(() => {
    const interval = setInterval(async () => {
      if (hasUnsavedChanges && currentDocument?.markdown) {
        try {
          setSaving(true)
          const response = await editorAPI.saveMarkdown(
            spaceId,
            docSlug,
            currentDocument.markdown
          )
          setDocument({
            ...currentDocument,
            version: response.version,
            etag: response.etag
          })
          setHasUnsavedChanges(false)
        } catch (error) {
          console.error('Autosave failed:', error)
        } finally {
          setSaving(false)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [hasUnsavedChanges, currentDocument, spaceId, docSlug, setSaving, setDocument, setHasUnsavedChanges])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
      </div>
    )
  }

  return (
    <div {...getRootProps()} className="h-full relative">
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900 bg-opacity-90 dark:bg-opacity-90 z-50 flex items-center justify-center">
          <p className="text-2xl text-blue-600 dark:text-blue-300">Drop files here...</p>
        </div>
      )}
      <BlockNoteView
        editor={editor}
        theme={theme}
        className="min-h-screen dark:bg-gray-900"
      />
    </div>
  )
}