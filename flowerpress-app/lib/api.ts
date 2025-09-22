import { SaveMarkdownResponse } from '@/types'

const api = {
  async post(url: string, data: any) {
    const response = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return { data: await response.json() }
  },

  async get(url: string) {
    const response = await fetch(`/api${url}`)
    return { data: await response.json() }
  }
}

export const editorAPI = {
  async saveMarkdown(spaceId: string, docSlug: string, markdown: string): Promise<SaveMarkdownResponse> {
    const response = await api.post(`/spaces/${spaceId}/docs/${docSlug}/markdown`, {
      markdown
    })
    return response.data
  },

  async getMarkdown(spaceId: string, docSlug: string): Promise<{ markdown: string; version?: string }> {
    const response = await api.get(`/spaces/${spaceId}/docs/${docSlug}/markdown`)
    return response.data
  }
}