import crypto from 'crypto'

interface StorageProvider {
  upload(key: string, content: Buffer | string, contentType?: string): Promise<string>
  get(key: string): Promise<Buffer | string | null>
  list(prefix: string): Promise<string[]>
  delete(key: string): Promise<void>
}

class LocalStorageProvider implements StorageProvider {
  private storage = new Map<string, Buffer | string>()
  private baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  async upload(key: string, content: Buffer | string, contentType?: string): Promise<string> {
    this.storage.set(key, content)
    return `${this.baseUrl}/storage/${key}`
  }

  async get(key: string): Promise<Buffer | string | null> {
    return this.storage.get(key) || null
  }

  async list(prefix: string): Promise<string[]> {
    return Array.from(this.storage.keys()).filter(key => key.startsWith(prefix))
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key)
  }
}

export class StorageService {
  private provider: StorageProvider

  constructor() {
    this.provider = new LocalStorageProvider()
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
    const url = await this.provider.upload(key, file.content, file.contentType)

    return {
      url,
      relPath: `./assets/${key.split('/').pop()}`,
      mediaType: file.contentType,
      hash: crypto.createHash('sha256').update(file.content).digest('hex').slice(0, 8)
    }
  }

  async saveMarkdown(spaceId: string, docSlug: string, markdown: string) {
    const key = `spaces/${spaceId}/${docSlug}/README.md`
    await this.provider.upload(key, markdown, 'text/markdown')

    return {
      version: Date.now().toString(),
      etag: crypto.createHash('sha256').update(markdown).digest('hex').slice(0, 16)
    }
  }

  async getMarkdown(spaceId: string, docSlug: string) {
    const key = `spaces/${spaceId}/${docSlug}/README.md`
    const content = await this.provider.get(key)

    return {
      markdown: content?.toString() || '# Untitled Document\n',
      version: Date.now().toString()
    }
  }

  async listAssets(spaceId: string, docSlug: string) {
    const prefix = `spaces/${spaceId}/${docSlug}/assets/`
    const keys = await this.provider.list(prefix)

    return keys.map(key => ({
      spaceId,
      docId: docSlug,
      relPath: `./assets/${key.split('/').pop()}`,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/storage/${key}`,
      mediaType: 'application/octet-stream',
      size: 0,
      hash: '',
      updatedAt: new Date()
    }))
  }
}

export const storage = new StorageService()