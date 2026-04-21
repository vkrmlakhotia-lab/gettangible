import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { BookProject, BookPage, BookPhoto, PageLayout, PaperFinish, BookStyle, Collaborator } from '@/types/book'
import { supabase } from '@/lib/supabase'
import { uploadPhotos } from '@/lib/storage'
import { useAuth } from './AuthContext'

interface BookContextType {
  projects: BookProject[]
  currentProject: BookProject | null
  isLoading: boolean
  createProject: (title: string, photos: BookPhoto[], options?: { style?: BookStyle; paperFinish?: PaperFinish; aiPrompt?: string }, onProgress?: (uploaded: number, total: number) => void) => Promise<BookProject>
  setCurrentProject: (id: string) => void
  updatePage: (pageId: string, updates: Partial<BookPage>) => Promise<void>
  addPage: (page: BookPage) => Promise<void>
  removePage: (pageId: string) => Promise<void>
  reorderPages: (fromIndex: number, toIndex: number) => Promise<void>
  updateProjectTitle: (title: string) => Promise<void>
  updateProjectSettings: (updates: Partial<BookProject>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  markOrdered: (id: string) => Promise<string | null>
  clearCurrentProject: () => void
  orderPlaced: (id: string) => void
  generateShareLink: (id: string) => Promise<string>
  addCollaborator: (name: string, email: string) => Promise<void>
}

const BookContext = createContext<BookContextType | undefined>(undefined)

// -------------------------------------------------------
// Auto-layout: maps style → rich layout pattern sequence
// -------------------------------------------------------
import { LAYOUT_PHOTO_COUNT } from '@/types/book'

type StyleKey = 'classic' | 'minimal' | 'wedding' | 'baby' | 'yearbook' | 'travel'

const layoutPatterns: Record<StyleKey, PageLayout[]> = {
  classic: [
    'full-bleed', 'two-stacked', 'three-mixed', 'photo-caption-below',
    'two-side', 'full-bleed', 'four-grid', 'photo-caption-above',
    'single-bordered', 'three-mixed',
  ],
  minimal: [
    'single-bordered', 'full-bleed', 'photo-caption-below', 'single-bordered',
    'text-left-photo-right', 'full-bleed', 'photo-caption-above',
  ],
  wedding: [
    'full-bleed', 'photo-caption-below', 'two-stacked', 'text-left-photo-right',
    'full-bleed', 'single-bordered', 'photo-caption-above', 'photo-left-text-right',
  ],
  baby: [
    'full-bleed', 'three-mixed', 'photo-caption-below', 'two-stacked',
    'four-grid', 'photo-caption-above', 'full-bleed', 'five-collage',
  ],
  yearbook: [
    'four-grid', 'three-mixed', 'two-side', 'five-collage',
    'full-bleed', 'four-grid', 'two-stacked',
  ],
  travel: [
    'full-bleed', 'photo-caption-below', 'two-stacked', 'three-mixed',
    'text-left-photo-right', 'full-bleed', 'five-collage', 'photo-caption-above',
  ],
}

function autoLayout(photos: BookPhoto[], style?: BookStyle): BookPage[] {
  const pages: BookPage[] = []
  let i = 0
  const pattern = layoutPatterns[(style as StyleKey) || 'classic'] || layoutPatterns.classic
  let layoutIdx = 0

  while (i < photos.length) {
    const layout = pattern[layoutIdx % pattern.length]
    const count = LAYOUT_PHOTO_COUNT[layout]

    // Skip text-only and cover in auto-layout (they need no photos)
    if (count === 0) { layoutIdx++; continue }

    const pagePhotos = photos.slice(i, i + count)
    // If we don't have enough photos for this layout, fall back to a single-photo layout
    const actualLayout = pagePhotos.length >= count ? layout : 'full-bleed'
    pages.push({
      id: crypto.randomUUID(),
      layout: actualLayout,
      photos: pagePhotos,
      caption: '',
    })
    i += pagePhotos.length
    layoutIdx++
  }

  return pages
}

// -------------------------------------------------------
// Provider
// -------------------------------------------------------
export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [projects, setProjects] = useState<BookProject[]>([])
  const [currentProject, setCurrentProjectState] = useState<BookProject | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load projects when user logs in
  const loadProjects = useCallback(async () => {
    if (!user) { setProjects([]); return }
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('book_projects')
        .select(`
          *,
          book_pages (
            *,
            book_photos (*)
          ),
          collaborators (*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Map DB rows to BookProject shape
      const mapped: BookProject[] = (data || []).map(p => ({
        id: p.id,
        title: p.title,
        coverPhoto: p.cover_photo ?? undefined,
        status: p.status as BookProject['status'],
        paperFinish: p.paper_finish as PaperFinish,
        style: p.style as BookStyle,
        giftNote: p.gift_note ?? undefined,
        shareLink: p.share_link ?? undefined,
        aiPrompt: p.ai_prompt ?? undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        collaborators: (p.collaborators || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          photosAdded: c.photos_added,
          joinedAt: c.joined_at,
        })),
        pages: (p.book_pages || [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((pg: any) => ({
            id: pg.id,
            layout: pg.layout as PageLayout,
            caption: pg.caption ?? '',
            photos: (pg.book_photos || [])
              .sort((a: any, b: any) => a.position - b.position)
              .map((ph: any) => ({
                id: ph.id,
                url: ph.url,
                isLowRes: ph.is_low_res,
                isDuplicate: ph.is_duplicate,
              })),
          })),
      }))

      setProjects(mapped)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => { loadProjects() }, [loadProjects])

  // -------------------------------------------------------
  // Write helpers
  // -------------------------------------------------------

  const createProject = async (
    title: string,
    photos: BookPhoto[],
    options?: { style?: BookStyle; paperFinish?: PaperFinish; aiPrompt?: string },
    onProgress?: (uploaded: number, total: number) => void
  ): Promise<BookProject> => {
    if (!user) {
      const pages = autoLayout(photos, options?.style)
      const project: BookProject = {
        id: crypto.randomUUID(),
        title,
        coverPhoto: photos[0]?.url,
        pages,
        status: 'draft',
        paperFinish: options?.paperFinish ?? 'matte',
        style: options?.style ?? 'classic',
        aiPrompt: options?.aiPrompt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [],
      }
      setCurrentProjectState(project)
      setProjects(prev => [...prev, project])
      return project
    }

    // Upload any local files to Supabase Storage before saving to DB
    const uploadedPhotos = await uploadPhotos(photos, user.id, onProgress)
    const pages = autoLayout(uploadedPhotos, options?.style)

    // Insert project
    const { data: projectRow, error: projectError } = await supabase
      .from('book_projects')
      .insert({
        user_id: user.id,
        title,
        cover_photo: uploadedPhotos[0]?.url ?? null,
        status: 'draft',
        paper_finish: options?.paperFinish ?? 'matte',
        style: options?.style ?? 'classic',
        ai_prompt: options?.aiPrompt ?? null,
      })
      .select()
      .single()

    if (projectError) throw projectError

    // Insert pages + photos
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const { data: pageRow, error: pageError } = await supabase
        .from('book_pages')
        .insert({ project_id: projectRow.id, layout: page.layout, caption: page.caption, position: i })
        .select()
        .single()

      if (pageError) throw pageError

      if (page.photos.length > 0) {
        await supabase.from('book_photos').insert(
          page.photos.map((ph, j) => ({
            page_id: pageRow.id,
            project_id: projectRow.id,
            url: ph.url,
            storage_path: ph.storagePath ?? null,
            is_low_res: ph.isLowRes ?? false,
            is_duplicate: ph.isDuplicate ?? false,
            position: j,
          }))
        )
      }
    }

    await loadProjects()
    // Construct directly from known data — don't search stale projects state
    const created: BookProject = {
      id: projectRow.id,
      title,
      coverPhoto: uploadedPhotos[0]?.url,
      pages,
      status: 'draft' as const,
      paperFinish: options?.paperFinish ?? 'matte',
      style: options?.style ?? 'classic',
      aiPrompt: options?.aiPrompt,
      createdAt: projectRow.created_at,
      updatedAt: projectRow.updated_at,
      collaborators: [],
    }
    setCurrentProjectState(created)
    return created
  }

  const setCurrentProject = (id: string) => {
    const p = projects.find(p => p.id === id)
    if (p) setCurrentProjectState(p)
  }

  const updatePage = async (pageId: string, updates: Partial<BookPage>) => {
    const { layout, caption } = updates
    await supabase.from('book_pages').update({
      ...(layout && { layout }),
      ...(caption !== undefined && { caption }),
    }).eq('id', pageId)

    setCurrentProjectState(prev => prev ? {
      ...prev,
      pages: prev.pages.map(p => p.id === pageId ? { ...p, ...updates } : p),
    } : null)
  }

  const addPage = async (page: BookPage) => {
    if (!currentProject) return
    const position = currentProject.pages.length
    const { data: pageRow, error } = await supabase
      .from('book_pages')
      .insert({ project_id: currentProject.id, layout: page.layout, caption: page.caption, position })
      .select().single()
    if (error) throw error

    if (page.photos.length > 0) {
      await supabase.from('book_photos').insert(
        page.photos.map((ph, j) => ({
          page_id: pageRow.id, project_id: currentProject.id,
          url: ph.url, position: j,
        }))
      )
    }

    setCurrentProjectState(prev => prev ? { ...prev, pages: [...prev.pages, { ...page, id: pageRow.id }] } : null)
  }

  const removePage = async (pageId: string) => {
    await supabase.from('book_pages').delete().eq('id', pageId)
    setCurrentProjectState(prev => prev ? {
      ...prev, pages: prev.pages.filter(p => p.id !== pageId),
    } : null)
  }

  const reorderPages = async (fromIndex: number, toIndex: number) => {
    if (!currentProject) return
    const pages = [...currentProject.pages]
    const [moved] = pages.splice(fromIndex, 1)
    pages.splice(toIndex, 0, moved)

    await Promise.all(pages.map((p, i) =>
      supabase.from('book_pages').update({ position: i }).eq('id', p.id)
    ))

    setCurrentProjectState(prev => prev ? { ...prev, pages } : null)
  }

  const updateProjectFields = async (updates: Partial<BookProject>) => {
    if (!currentProject) return
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.coverPhoto !== undefined) dbUpdates.cover_photo = updates.coverPhoto
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.paperFinish !== undefined) dbUpdates.paper_finish = updates.paperFinish
    if (updates.style !== undefined) dbUpdates.style = updates.style
    if (updates.giftNote !== undefined) dbUpdates.gift_note = updates.giftNote
    if (updates.shareLink !== undefined) dbUpdates.share_link = updates.shareLink
    if (updates.aiPrompt !== undefined) dbUpdates.ai_prompt = updates.aiPrompt

    await supabase.from('book_projects').update(dbUpdates).eq('id', currentProject.id)
    const updated = { ...currentProject, ...updates, updatedAt: new Date().toISOString() }
    setCurrentProjectState(updated)
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  const updateProjectTitle = (title: string) => updateProjectFields({ title })
  const updateProjectSettings = (updates: Partial<BookProject>) => updateProjectFields(updates)

  const deleteProject = async (id: string) => {
    await supabase.from('book_projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
    if (currentProject?.id === id) setCurrentProjectState(null)
  }

  const markOrdered = async (id: string): Promise<string | null> => {
    const project = projects.find(p => p.id === id)
    if (!project || !user) return null
    const { data: order } = await supabase.from('orders').insert({
      user_id: user.id,
      book_id: id,
      book_title: project.title,
      page_count: project.pages.length,
      price_per_page: 1.5,
      delivery_fee: 4.99,
      total: project.pages.length * 1.5 + 4.99,
    }).select('id').single()
    const orderedAt = new Date().toISOString()
    await supabase.from('book_projects').update({ status: 'ordered', ordered_at: orderedAt }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'ordered' as const } : p))
    return order?.id ?? null
  }

  const generateShareLink = async (id: string): Promise<string> => {
    const link = `https://snapora.app/collab/${id}`
    await supabase.from('book_projects').update({ share_link: link }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, shareLink: link } : p))
    return link
  }

  const addCollaborator = async (name: string, email: string) => {
    if (!currentProject) return
    const { data, error } = await supabase
      .from('collaborators')
      .insert({ project_id: currentProject.id, name, email })
      .select().single()
    if (error) throw error

    const collaborator: Collaborator = {
      id: data.id, name, email, photosAdded: 0, joinedAt: data.joined_at,
    }
    setCurrentProjectState(prev => prev ? {
      ...prev, collaborators: [...(prev.collaborators || []), collaborator],
    } : null)
  }

  const clearCurrentProject = () => setCurrentProjectState(null)

  const orderPlaced = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'ordered' as const } : p))
    setCurrentProjectState(prev => prev?.id === id ? { ...prev, status: 'ordered' as const } : prev)
  }

  return (
    <BookContext.Provider value={{
      projects, currentProject, isLoading, createProject, setCurrentProject,
      updatePage, addPage, removePage, reorderPages,
      updateProjectTitle, updateProjectSettings, deleteProject,
      markOrdered, clearCurrentProject, orderPlaced, generateShareLink, addCollaborator,
    }}>
      {children}
    </BookContext.Provider>
  )
}

export const useBooks = () => {
  const ctx = useContext(BookContext)
  if (!ctx) throw new Error('useBooks must be used within BookProvider')
  return ctx
}
