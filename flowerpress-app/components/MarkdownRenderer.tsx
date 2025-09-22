'use client'

import { useMemo } from 'react'
import CsvTable from './CsvTable'

interface MarkdownRendererProps {
  markdown: string
  assets: { relPath: string; url: string }[]
}

export default function MarkdownRenderer({ markdown, assets }: MarkdownRendererProps) {
  const processedContent = useMemo(() => {
    let content = markdown

    // Replace CSV table embeds
    const tableRegex = /\{\{table:\s*([^}]+)\}\}/g
    content = content.replace(tableRegex, (match, path) => {
      const trimmedPath = path.trim()
      const asset = assets.find(a => a.relPath === trimmedPath || a.relPath.endsWith(trimmedPath.replace('./', '')))
      if (asset) {
        return `<div data-csv-table="${asset.url}"></div>`
      }
      return match
    })

    // Process markdown to HTML (basic implementation)
    // In production, use a proper markdown parser like marked or remark
    content = content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br />')

    return content
  }, [markdown, assets])

  return (
    <div className="prose max-w-none">
      <div
        dangerouslySetInnerHTML={{ __html: processedContent }}
        ref={(node) => {
          if (node) {
            // Replace CSV table placeholders with actual components
            const tablePlaceholders = node.querySelectorAll('[data-csv-table]')
            tablePlaceholders.forEach((placeholder) => {
              const url = placeholder.getAttribute('data-csv-table')
              if (url) {
                const container = document.createElement('div')
                placeholder.replaceWith(container)
                // In a real app, we'd use React portal or a more sophisticated approach
                // For now, this is a placeholder for the concept
              }
            })
          }
        }}
      />
    </div>
  )
}