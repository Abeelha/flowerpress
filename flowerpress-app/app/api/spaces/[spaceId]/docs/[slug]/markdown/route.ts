import { NextRequest, NextResponse } from 'next/server'
import { serverStorage } from '@/lib/server-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { spaceId: string; slug: string } }
) {
  try {
    const { spaceId, slug } = params
    const result = await serverStorage.getMarkdown(spaceId, slug)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch markdown' },
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
    const { markdown } = await request.json()

    if (!markdown) {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      )
    }

    const result = await serverStorage.saveMarkdown(spaceId, slug, markdown)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save markdown' },
      { status: 500 }
    )
  }
}