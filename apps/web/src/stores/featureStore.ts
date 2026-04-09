import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Feature {
  id: string
  projectId: string
  name: string
  slug: string
  branch?: string
  status: string
  createdAt: string
  updatedAt: string
}

interface FeatureStore {
  features: Feature[]
  addFeature: (feature: Feature) => void
  updateFeature: (id: string, updates: Partial<Feature>) => void
  removeFeature: (id: string) => void
}

export const useFeatureStore = create<FeatureStore>()(
  persist(
    (set) => ({
      features: [],
      addFeature: (feature) =>
        set((state) => ({ features: [...state.features, feature] })),
      updateFeature: (id, updates) =>
        set((state) => ({
          features: state.features.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),
      removeFeature: (id) =>
        set((state) => ({
          features: state.features.filter((f) => f.id !== id),
        })),
    }),
    { name: 'specflow-features' }
  )
)
