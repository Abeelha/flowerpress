import { NextRequest, NextResponse } from 'next/server'

const globalDB = global as any

if (!globalDB.flowerpressDB) {
  globalDB.flowerpressDB = {
    folders: new Map(),
    documents: new Map()
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { spaceId: string; id: string } }
) {
  try {
    const { id } = params
    const { name } = await request.json()

    const document = globalDB.flowerpressDB.documents.get(id)
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    document.title = name
    document.updatedAt = new Date()
    globalDB.flowerpressDB.documents.set(id, document)

    return NextResponse.json(document)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to rename document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { spaceId: string; id: string } }
) {
  try {
    const { id } = params

    globalDB.flowerpressDB.documents.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}