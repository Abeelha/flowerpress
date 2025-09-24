'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { basicSetup } from 'codemirror'
import { marked } from 'marked'
import CSVPreview from './CSVPreview'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function CodeMirrorEditor({ value, onChange }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        markdown(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString()
            onChange(newValue)
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            backgroundColor: 'white'
          },
          '.cm-content': {
            padding: '20px',
            minHeight: '100%',
            color: '#1a1a1a',
            backgroundColor: 'white'
          },
          '.cm-focused': {
            outline: 'none'
          },
          '.cm-editor': {
            height: '100%',
            backgroundColor: 'white'
          },
          '.cm-editor.cm-focused': {
            outline: 'none'
          },
          '.cm-scroller': {
            height: '100%',
            backgroundColor: 'white'
          },
          '.cm-line': {
            color: '#1a1a1a'
          },
          '.cm-gutters': {
            backgroundColor: '#f5f5f5',
            color: '#666',
            borderRight: '1px solid #ddd'
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#e8f2ff'
          },
          '.cm-activeLine': {
            backgroundColor: '#f0f8ff'
          }
        })
      ]
    })

    const view = new EditorView({
      state,
      parent: editorRef.current
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [])

  // Update editor content when value changes externally
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value
        }
      })
    }
  }, [value])

  return (
    <div className="h-full w-full bg-white">
      <div ref={editorRef} className="h-full" />
    </div>
  )
}

// Markdown Preview Component
interface MarkdownPreviewProps {
  markdown: string
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const [content, setContent] = useState<{ html: string; csvBlocks: Array<{ id: string; url: string; title?: string }> }>({
    html: '',
    csvBlocks: []
  })

  useEffect(() => {
    const renderMarkdown = async () => {
      try {
        const csvBlocks: Array<{ id: string; url: string; title?: string }> = []
        let processedMarkdown = markdown

        const csvBlockRegex = /```csv\n(.*?)\n```/g
        let match
        let blockIndex = 0

        while ((match = csvBlockRegex.exec(markdown)) !== null) {
          const url = match[1].trim()
          const blockId = `csv-block-${blockIndex++}`

          const beforeBlock = markdown.substring(0, match.index)
          const titleMatch = beforeBlock.match(/###\s+([^\n]+)\n*$/m)
          const title = titleMatch ? titleMatch[1].trim() : undefined

          csvBlocks.push({ id: blockId, url, title })

          processedMarkdown = processedMarkdown.replace(match[0], `<div id="${blockId}" class="csv-preview-placeholder"></div>`)
        }

        const rendered = await marked.parse(processedMarkdown)
        setContent({ html: rendered, csvBlocks })
      } catch (error) {
        console.error('Error rendering markdown:', error)
        setContent({ html: '<p>Error rendering markdown</p>', csvBlocks: [] })
      }
    }

    renderMarkdown()
  }, [markdown])

  return (
    <div className="h-full w-full overflow-auto bg-white">
      <div
        className="p-6 prose prose-gray max-w-none
                   prose-headings:text-gray-900
                   prose-p:text-gray-700
                   prose-a:text-blue-600
                   prose-strong:text-gray-900
                   prose-code:text-pink-600
                   prose-code:bg-gray-100
                   prose-code:px-1
                   prose-code:py-0.5
                   prose-code:rounded
                   prose-pre:bg-gray-100
                   prose-pre:text-gray-800
                   prose-blockquote:text-gray-700
                   prose-blockquote:border-gray-300"
      >
        <div dangerouslySetInnerHTML={{ __html: content.html }} />

        {/* Render CSV previews */}
        {content.csvBlocks.map(block => (
          <div key={block.id} className="my-4">
            <CSVPreview url={block.url} title={block.title} />
          </div>
        ))}
      </div>
    </div>
  )
}

