import { create } from 'zustand'
import { Document, Asset } from '@/types'

interface EditorStore {
  currentDocument: Document | null
  assets: Asset[]
  isLoading: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean

  setDocument: (doc: Document) => void
  updateMarkdown: (markdown: string) => void
  addAsset: (asset: Asset) => void
  setAssets: (assets: Asset[]) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  currentDocument: null,
  assets: [],
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,

  setDocument: (doc) => set({ currentDocument: doc }),
  updateMarkdown: (markdown) => set((state) => ({
    currentDocument: state.currentDocument
      ? { ...state.currentDocument, markdown }
      : null,
    hasUnsavedChanges: true
  })),
  addAsset: (asset) => set((state) => ({
    assets: [...state.assets, asset]
  })),
  setAssets: (assets) => set({ assets }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSaving: (saving) => set({ isSaving: saving }),
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges })
}))