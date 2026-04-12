import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooks } from '@/context/BookContext'
import { useAuth } from '@/context/AuthContext'
import { Capacitor } from '@capacitor/core'
import { ChevronLeft, Loader2, ImageIcon } from 'lucide-react'
import type { BookPhoto } from '@/types/book'

// ─── Helpers (copied from ApplePhotosImport) ──────────────────────────────────

async function getNativeCamera() {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const { Camera } = await import('@capacitor/camera')
    return Camera
  } catch { return null }
}

async function requestNativePhotosPermission(): Promise<'granted' | 'denied' | 'web'> {
  const Camera = await getNativeCamera()
  if (!Camera) return 'web'
  const result = await Camera.requestPermissions({ permissions: ['photos'] })
  return result.photos === 'granted' || result.photos === 'limited' ? 'granted' : 'denied'
}

async function pickPhotosNative(): Promise<File[]> {
  const Camera = await getNativeCamera()
  if (!Camera) return []
  const result = await Camera.pickImages({ quality: 90, limit: 0 })
  return Promise.all(
    result.photos.map(async photo => {
      const response = await fetch(photo.webPath!)
      const blob = await response.blob()
      const filename = photo.webPath!.split('/').pop() || 'photo.jpg'
      return new File([blob], filename, { type: blob.type || 'image/jpeg' })
    })
  )
}

interface RichPhoto {
  bookPhoto: BookPhoto
  file: File
  date: Date | null
}

async function parseExif(file: File): Promise<Date | null> {
  try {
    const exifr = await import('exifr')
    const data = await exifr.default.parse(file, ['DateTimeOriginal'])
    return data?.DateTimeOriginal instanceof Date ? data.DateTimeOriginal : null
  } catch { return null }
}

function fmt(d: Date) { return d.toISOString().split('T')[0] }

// ─── Component ────────────────────────────────────────────────────────────────

type Step = 'requesting' | 'denied' | 'picking' | 'analysing' | 'date-picker' | 'creating'

const CreateBook = () => {
  const navigate = useNavigate()
  const { createProject } = useBooks()
  const { isAuthenticated } = useAuth()
  const [step, setStep] = useState<Step>('requesting')
  const [allPhotos, setAllPhotos] = useState<RichPhoto[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [progress, setProgress] = useState({ uploaded: 0, total: 0 })
  const dateFromRef = useRef<HTMLInputElement>(null)
  const dateToRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/onboarding'); return }
    requestAccess()
  }, [])

  const requestAccess = async () => {
    const result = await requestNativePhotosPermission()
    if (result === 'denied') {
      setStep('denied')
    } else {
      setStep('picking')
      openPicker()
    }
  }

  const openPicker = async () => {
    if (Capacitor.isNativePlatform()) {
      const files = await pickPhotosNative()
      if (files.length === 0) { navigate('/home'); return }
      await processFiles(files)
    } else {
      fileRef.current?.click()
    }
  }

  const processFiles = async (files: File[] | FileList) => {
    setStep('analysing')
    const arr = Array.from(files)
    const rich: RichPhoto[] = await Promise.all(
      arr.map(async file => {
        const date = await parseExif(file)
        const url = URL.createObjectURL(file)
        return { bookPhoto: { id: crypto.randomUUID(), url, file }, file, date }
      })
    )
    setAllPhotos(rich)

    // Pre-fill date range from actual photo dates
    const dates = rich.map(p => p.date).filter(Boolean) as Date[]
    if (dates.length) {
      const min = new Date(Math.min(...dates.map(d => d.getTime())))
      const max = new Date(Math.max(...dates.map(d => d.getTime())))
      setDateFrom(fmt(min))
      setDateTo(fmt(max))
    }
    setStep('date-picker')
  }

  const handleCreate = async () => {
    const from = new Date(dateFrom)
    const to = new Date(dateTo)
    to.setHours(23, 59, 59)

    const filtered = allPhotos
      .filter(p => !p.date || (p.date >= from && p.date <= to))
      .map(p => p.bookPhoto)

    if (filtered.length === 0) return

    setStep('creating')
    try {
      const label = new Date(dateFrom).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      const project = await createProject(
        `My Book · ${label}`,
        filtered,
        { style: 'classic', paperFinish: 'matte' },
        (uploaded, total) => setProgress({ uploaded, total })
      )
      navigate(`/editor/${project.id}`)
    } catch (err) {
      console.error(err)
      setStep('date-picker')
    }
  }

  // ─── Screens ─────────────────────────────────────────────────────────────────

  if (step === 'requesting' || step === 'picking') {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
          <ImageIcon size={28} strokeWidth={1.5} className="text-primary" />
        </div>
        <p className="text-[16px] font-semibold text-foreground">Opening your photos…</p>
        <p className="text-[13px] text-muted-foreground text-center">
          Select the photos you want in your book
        </p>
      </div>
    )
  }

  if (step === 'analysing') {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[16px] font-medium text-foreground">Reading photo dates…</p>
      </div>
    )
  }

  if (step === 'creating') {
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

  if (step === 'denied') {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[18px] font-semibold text-foreground">Photos access needed</p>
        <p className="text-[14px] text-muted-foreground">
          Go to Settings → Tangible → Photos → Allow All Photos
        </p>
        <button onClick={() => navigate('/home')} className="mt-4 text-primary text-[15px]">
          Back to Home
        </button>
      </div>
    )
  }

  // ─── Date picker ─────────────────────────────────────────────────────────────

  const dates = allPhotos.map(p => p.date).filter(Boolean) as Date[]
  const minDate = dates.length ? fmt(new Date(Math.min(...dates.map(d => d.getTime())))) : undefined
  const maxDate = dates.length ? fmt(new Date(Math.max(...dates.map(d => d.getTime())))) : undefined

  const inRange = allPhotos.filter(p => {
    if (!dateFrom || !dateTo) return true
    const from = new Date(dateFrom)
    const to = new Date(dateTo); to.setHours(23, 59, 59)
    return !p.date || (p.date >= from && p.date <= to)
  }).length

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate('/home')}>
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-[17px] font-semibold text-foreground">Choose Date Range</h1>
      </header>

      <div className="flex-1 px-4 pt-6 space-y-5">
        <p className="text-[14px] text-muted-foreground">
          Your {allPhotos.length} selected photos span{' '}
          {minDate && maxDate
            ? `${new Date(minDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} – ${new Date(maxDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
            : 'various dates'}.
          Narrow it down to a specific period.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">From</label>
            <input
              ref={dateFromRef}
              type="date"
              value={dateFrom}
              min={minDate}
              max={maxDate}
              onChange={e => {
                setDateFrom(e.target.value)
                dateFromRef.current?.blur()
                setTimeout(() => dateToRef.current?.focus(), 100)
              }}
              className="w-full mt-1.5 h-12 px-4 bg-card border border-border rounded-xl text-foreground text-[15px] focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">To</label>
            <input
              ref={dateToRef}
              type="date"
              value={dateTo}
              min={minDate}
              max={maxDate}
              onChange={e => {
                setDateTo(e.target.value)
                dateToRef.current?.blur()
              }}
              className="w-full mt-1.5 h-12 px-4 bg-card border border-border rounded-xl text-foreground text-[15px] focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {dateFrom && dateTo && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <p className="text-[13px] text-foreground">
              <span className="font-semibold">{inRange} photos</span> in this date range
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-10 pt-4 border-t border-border">
        <button
          onClick={handleCreate}
          disabled={!dateFrom || !dateTo || inRange === 0}
          className="w-full bg-primary disabled:opacity-40 text-white rounded-[16px] py-4 text-[16px] font-semibold"
        >
          Create My Book · {inRange} photos
        </button>
      </div>

      {/* Web file fallback */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => e.target.files && processFiles(e.target.files)}
      />
    </div>
  )
}

export default CreateBook
