'use client'

import { useEffect, useState } from 'react'
import { editorAPI } from '@/lib/api'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { Asset } from '@/types'

interface PageProps {
  params: {
    spaceId: string
    slug: string
  }
}

export default function ViewPage({ params }: PageProps) {
  const { spaceId, slug } = params
  const [markdown, setMarkdown] = useState<string>('')
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const [docData, assetList] = await Promise.all([
          editorAPI.getMarkdown(spaceId, slug),
          editorAPI.listAssets(spaceId, slug)
        ])
        setMarkdown(docData.markdown)
        setAssets(assetList)
      } catch (error) {
        console.error('Failed to load document:', error)
        setMarkdown('# Document Not Found\n\nThis document has not been published yet.')
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [spaceId, slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading document...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <MarkdownRenderer markdown={markdown} assets={assets} />
      </div>
    </div>
  )
}