'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { useTheme } from '@/contexts/theme-context'
import { editorAPI } from '@/lib/api'
import '@blocknote/mantine/style.css'

interface BlockNoteEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function BlockNoteEditor({ value, onChange }: BlockNoteEditorProps) {
  const { theme } = useTheme()
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastValue, setLastValue] = useState(value)
  const isUpdatingFromProps = useRef(false)

  // Mock asset upload integrated with our storage system
  const uploadAsset = useCallback(async (file: File): Promise<string> => {
    try {
      // Use our mock storage system
      const result = await editorAPI.saveAsset(file, 'default-space', 'current-doc')
      return result.url
    } catch (error) {
      console.error('Failed to upload asset:', error)
      // Fallback to object URL for images
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file)
      }
      throw error
    }
  }, [])

  // Create editor with stable configuration
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: "Start writing your document..."
      }
    ],
    uploadFile: uploadAsset
  })

  // Initialize editor content only once or when document changes significantly
  useEffect(() => {
    if (!editor || isUpdatingFromProps.current) return

    const initializeContent = async () => {
      try {
        if (value && value !== lastValue) {
          setLastValue(value)

          // Only update if the value has changed significantly
          if (value.trim()) {
            const blocks = await editor.tryParseMarkdownToBlocks(value)
            isUpdatingFromProps.current = true
            editor.replaceBlocks(editor.document, blocks)
            isUpdatingFromProps.current = false
          }
        }

        if (!isInitialized) {
          setIsInitialized(true)
        }
      } catch (error) {
        console.warn('Failed to initialize editor content:', error)
        isUpdatingFromProps.current = false
        setIsInitialized(true)
      }
    }

    initializeContent()
  }, [value, editor, isInitialized, lastValue])

  // Handle changes from the editor
  const handleChange = useCallback(async () => {
    if (!editor || isUpdatingFromProps.current || !isInitialized) return

    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document)

      // Only call onChange if the content actually changed
      if (markdown !== lastValue) {
        setLastValue(markdown)
        onChange(markdown)
      }
    } catch (error) {
      console.error('Failed to convert blocks to markdown:', error)
    }
  }, [editor, onChange, lastValue, isInitialized])

  // Error boundary for block operations
  const handleError = useCallback((error: Error) => {
    console.error('BlockNote editor error:', error)
    // Don't crash the app, just log the error
  }, [])

  if (!editor) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500">
        Loading editor...
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme={theme === 'dark' ? 'dark' : 'light'}
        className="h-full"
      />
    </div>
  )
}