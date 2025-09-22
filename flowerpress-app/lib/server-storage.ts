// Server-side storage using file system for persistence
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const STORAGE_DIR = path.join(process.cwd(), '.flowerpress-storage')

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

export class ServerStorage {
  private baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  async upload(key: string, content: Buffer | string, contentType?: string): Promise<string> {
    const filePath = path.join(STORAGE_DIR, key)
    await ensureDir(path.dirname(filePath))

    const data = content instanceof Buffer ? content : Buffer.from(content)
    await fs.writeFile(filePath, data)

    // Also save metadata
    await fs.writeFile(`${filePath}.meta`, JSON.stringify({ contentType }))

    return `${this.baseUrl}/storage/${key}`
  }

  async get(key: string): Promise<Buffer | string | null> {
    try {
      const filePath = path.join(STORAGE_DIR, key)
      const content = await fs.readFile(filePath)

      // Check if it's markdown (text) or binary
      if (key.endsWith('.md')) {
        return content.toString('utf-8')
      }

      return content
    } catch (error) {
      return null
    }
  }

  async list(prefix: string): Promise<string[]> {
    try {
      const dirPath = path.join(STORAGE_DIR, prefix)
      await ensureDir(dirPath)

      const files = await fs.readdir(dirPath, { recursive: true })
      return files
        .filter(f => !f.endsWith('.meta'))
        .map(f => path.join(prefix, f).replace(/\\/g, '/'))
    } catch (error) {
      return []
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = path.join(STORAGE_DIR, key)
      await fs.unlink(filePath)
      await fs.unlink(`${filePath}.meta`)
    } catch (error) {
      // File might not exist
    }
  }

  generateAssetKey(spaceId: string, docSlug: string, file: { name: string; content: Buffer }): string {
    const hash = crypto.createHash('sha256').update(file.content).digest('hex').slice(0, 8)
    const ext = file.name.split('.').pop() || ''
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    return `spaces/${spaceId}/${docSlug}/assets/${baseName}-${hash}.${ext}`
  }

  async uploadAsset(
    spaceId: string,
    docSlug: string,
    file: { name: string; content: Buffer; contentType: string }
  ) {
    const key = this.generateAssetKey(spaceId, docSlug, file)
    const url = await this.upload(key, file.content, file.contentType)

    return {
      url,
      relPath: `./assets/${key.split('/').pop()}`,
      mediaType: file.contentType,
      hash: crypto.createHash('sha256').update(file.content).digest('hex').slice(0, 8)
    }
  }

  async saveMarkdown(spaceId: string, docSlug: string, markdown: string) {
    const key = `spaces/${spaceId}/${docSlug}/README.md`
    await this.upload(key, markdown, 'text/markdown')

    return {
      version: Date.now().toString(),
      etag: crypto.createHash('sha256').update(markdown).digest('hex').slice(0, 16)
    }
  }

  async getMarkdown(spaceId: string, docSlug: string) {
    const key = `spaces/${spaceId}/${docSlug}/README.md`
    const content = await this.get(key)

    return {
      markdown: content?.toString() || '# Untitled Document\n',
      version: Date.now().toString()
    }
  }

  async listAssets(spaceId: string, docSlug: string) {
    const prefix = `spaces/${spaceId}/${docSlug}/assets`
    const keys = await this.list(prefix)

    return keys.map(key => ({
      spaceId,
      docId: docSlug,
      relPath: `./assets/${key.split('/').pop()}`,
      url: `${this.baseUrl}/storage/${key}`,
      mediaType: 'application/octet-stream',
      size: 0,
      hash: '',
      updatedAt: new Date()
    }))
  }
}

export const serverStorage = new ServerStorage()