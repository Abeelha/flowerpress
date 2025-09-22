import { NextRequest, NextResponse } from 'next/server'
import { serverStorage } from '@/lib/server-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { spaceId: string; slug: string } }
) {
  try {
    const { spaceId, slug } = params
    const assets = await serverStorage.listAssets(spaceId, slug)
    return NextResponse.json(assets)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to list assets' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { spaceId: string; slug: string } }
) {
  try {
    const { spaceId, slug } = params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 25 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds limit' },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await serverStorage.uploadAsset(spaceId, slug, {
      name: file.name,
      content: buffer,
      contentType: file.type
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    )
  }
}