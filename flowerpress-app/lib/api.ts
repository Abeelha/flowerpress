import axios from 'axios'
import { Document, Asset, UploadResponse, SaveMarkdownResponse } from '@/types'

const api = axios.create({
  baseURL: '/api'
})

export const editorAPI = {
  async saveMarkdown(spaceId: string, docSlug: string, markdown: string): Promise<SaveMarkdownResponse> {
    const response = await api.post(`/spaces/${spaceId}/docs/${docSlug}/markdown`, {
      markdown
    })
    return response.data
  },

  async uploadAsset(spaceId: string, docSlug: string, file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post(`/spaces/${spaceId}/docs/${docSlug}/assets`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async listAssets(spaceId: string, docSlug: string): Promise<Asset[]> {
    const response = await api.get(`/spaces/${spaceId}/docs/${docSlug}/assets`)
    return response.data
  },

  async getMarkdown(spaceId: string, docSlug: string): Promise<{ markdown: string; version?: string }> {
    const response = await api.get(`/spaces/${spaceId}/docs/${docSlug}/markdown`)
    return response.data
  }
}