import { NextRequest, NextResponse } from 'next/server'
import { Document } from '@/types'
import { serverStorage } from '@/lib/server-storage'

const globalDB = global as any

if (!globalDB.flowerpressDB) {
  globalDB.flowerpressDB = {
    folders: new Map(),
    documents: new Map<string, Document>()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const { spaceId } = params
    const { title, folderId } = await request.json()

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const slug = title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || docId

    const document: Document = {
      id: docId,
      spaceId,
      slug,
      title: title || 'Untitled Document',
      markdown: `# ${title || 'Untitled Document'}\n\n`,
      folderId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to "database"
    globalDB.flowerpressDB.documents.set(docId, document)

    // Save markdown file
    await serverStorage.saveMarkdown(spaceId, slug, document.markdown)

    return NextResponse.json(document)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const { spaceId } = params
    const documents = Array.from(globalDB.flowerpressDB.documents.values())
      .filter((d: Document) => d.spaceId === spaceId)

    return NextResponse.json(documents)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load documents' },
      { status: 500 }
    )
  }
}