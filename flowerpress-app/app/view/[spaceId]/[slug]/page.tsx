import { storage } from '@/lib/storage'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface PageProps {
  params: {
    spaceId: string
    slug: string
  }
}

export default async function ViewPage({ params }: PageProps) {
  const { spaceId, slug } = params

  const { markdown } = await storage.getMarkdown(spaceId, slug)
  const assets = await storage.listAssets(spaceId, slug)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <MarkdownRenderer markdown={markdown} assets={assets} />
      </div>
    </div>
  )
}