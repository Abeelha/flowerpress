export interface Space {
  id: string
  ownerId: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  spaceId: string
  slug: string
  title: string
  markdown: string
  folderId?: string
  version?: string
  etag?: string
  createdAt: Date
  updatedAt: Date
}

export interface Folder {
  id: string
  name: string
  parentId?: string
  spaceId: string
  createdAt: Date
  updatedAt: Date
}

export type FileSystemItem = {
  type: 'folder' | 'document'
  item: Folder | Document
}

export interface Asset {
  spaceId: string
  docId: string
  relPath: string
  url: string
  mediaType: string
  size: number
  hash: string
  updatedAt: Date
}

export interface UploadResponse {
  url: string
  relPath: string
  mediaType: string
  hash: string
}

export interface SaveMarkdownResponse {
  version: string
  etag: string
}