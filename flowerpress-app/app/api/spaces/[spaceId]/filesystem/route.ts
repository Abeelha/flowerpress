import { NextRequest, NextResponse } from 'next/server'
import { serverStorage } from '@/lib/server-storage'
import { Document, Folder } from '@/types'

// Mock database for folders and documents metadata
// In production, this would be a real database
const globalDB = global as any

if (!globalDB.flowerpressDB) {
  globalDB.flowerpressDB = {
    folders: new Map<string, Folder>(),
    documents: new Map<string, Document>()
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const { spaceId } = params

    const folders = Array.from(globalDB.flowerpressDB.folders.values())
      .filter((f: Folder) => f.spaceId === spaceId)

    const documents = Array.from(globalDB.flowerpressDB.documents.values())
      .filter((d: Document) => d.spaceId === spaceId)

    return NextResponse.json({
      folders,
      documents
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load file system' },
      { status: 500 }
    )
  }
}