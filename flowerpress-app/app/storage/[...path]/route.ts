import { NextRequest, NextResponse } from 'next/server'

// Mock storage for development - in production, this would serve from R2/S3
const mockStorage = new Map<string, { content: Buffer; contentType: string }>()

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const fullPath = params.path.join('/')

  // For development, return a placeholder response
  // In production, this would fetch from actual storage

  if (fullPath.endsWith('.csv')) {
    return new NextResponse('Year,Value\n2020,100\n2021,150\n2022,200', {
      headers: {
        'Content-Type': 'text/csv'
      }
    })
  }

  if (fullPath.match(/\.(png|jpg|jpeg|gif)$/i)) {
    // Return a 1x1 transparent pixel for images in dev
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/png'
      }
    })
  }

  return NextResponse.json({ error: 'File not found' }, { status: 404 })
}