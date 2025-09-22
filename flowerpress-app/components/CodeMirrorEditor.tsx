'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'
import { useTheme } from '@/contexts/theme-context'
import { marked } from 'marked'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function CodeMirrorEditor({ value, onChange }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        markdown(),
        theme === 'dark' ? oneDark : [],
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString()
            onChange(newValue)
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px'
          },
          '.cm-content': {
            padding: '20px',
            minHeight: '100%'
          },
          '.cm-focused': {
            outline: 'none'
          },
          '.cm-editor': {
            height: '100%'
          },
          '.cm-scroller': {
            height: '100%'
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
  }, [theme])

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
    <div className="h-full w-full">
      <div ref={editorRef} className="h-full" />
    </div>
  )
}

// Markdown Preview Component
interface MarkdownPreviewProps {
  markdown: string
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    const renderMarkdown = async () => {
      try {
        const rendered = await marked.parse(markdown)
        setHtml(rendered)
      } catch (error) {
        console.error('Error rendering markdown:', error)
        setHtml('<p>Error rendering markdown</p>')
      }
    }

    renderMarkdown()
  }, [markdown])

  return (
    <div className="h-full w-full overflow-auto">
      <div
        className="p-6 prose prose-gray dark:prose-invert max-w-none
                   prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                   prose-p:text-gray-700 dark:prose-p:text-gray-300
                   prose-a:text-blue-600 dark:prose-a:text-blue-400
                   prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                   prose-code:text-pink-600 dark:prose-code:text-pink-400
                   prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}