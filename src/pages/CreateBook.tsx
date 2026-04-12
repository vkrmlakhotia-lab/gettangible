import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooks } from '@/context/BookContext'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeft, Loader2 } from 'lucide-react'
import ApplePhotosImport from '@/components/ApplePhotosImport'
import type { BookPhoto } from '@/types/book'

const CreateBook = () => {
  const navigate = useNavigate()
  const { createProject } = useBooks()
  const { isAuthenticated } = useAuth()
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState({ uploaded: 0, total: 0 })

  useEffect(() => {
    if (!isAuthenticated) navigate('/onboarding')
  }, [])

  const handleImport = async (photos: BookPhoto[]) => {
    if (photos.length === 0) return
    setCreating(true)
    try {
      const label = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      const project = await createProject(
        `My Book · ${label}`,
        photos,
        { style: 'classic', paperFinish: 'matte' },
        (uploaded, total) => setProgress({ uploaded, total })
      )
      navigate(`/editor/${project.id}`)
    } catch (err) {
      console.error(err)
      setCreating(false)
    }
  }

  if (creating) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[16px] font-medium text-foreground">Creating your book…</p>
        {progress.total > 0 && (
          <p className="text-[13px] text-muted-foreground">
            Uploading {progress.uploaded} of {progress.total} photos
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate('/home')}>
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-[17px] font-semibold text-foreground">Create a Book</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <ApplePhotosImport onImport={handleImport} />
      </div>
    </div>
  )
}

export default CreateBook
