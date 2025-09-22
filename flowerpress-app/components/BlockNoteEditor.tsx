'use client'

import React from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { useTheme } from '@/contexts/theme-context'
import '@blocknote/mantine/style.css'

// Mock asset upload function - we'll implement the real API later
const uploadAsset = async (file: File): Promise<{url: string, relPath: string}> => {
  // Generate a content-addressed filename like the design specifies
  const hash = Math.random().toString(36).substr(2, 8)
  const ext = file.name.split('.').pop() || ''
  const baseName = file.name.replace(/\.[^/.]+$/, '')

  return {
    url: `/assets/${baseName}-${hash}.${ext}`,
    relPath: `./assets/${baseName}-${hash}.${ext}`
  }
}

interface BlockNoteEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function BlockNoteEditor({ value, onChange }: BlockNoteEditorProps) {
  const { theme } = useTheme()

  const editor = useCreateBlockNote({
    initialContent: value ? undefined : [
      {
        type: "paragraph",
        content: "Start writing your document..."
      }
    ],
    uploadFile: async (file: File) => {
      const result = await uploadAsset(file)
      return result.url
    }
  })

  // Convert markdown to blocks on mount and when value changes
  React.useEffect(() => {
    if (value && editor) {
      const parseMarkdown = async () => {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(value)
          editor.replaceBlocks(editor.document, blocks)
        } catch (error) {
          console.warn('Failed to parse markdown:', error)
        }
      }
      parseMarkdown()
    }
  }, [value, editor])

  const handleChange = async () => {
    if (editor) {
      try {
        const markdown = await editor.blocksToMarkdownLossy(editor.document)
        onChange(markdown)
      } catch (error) {
        console.error('Failed to convert to markdown:', error)
      }
    }
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