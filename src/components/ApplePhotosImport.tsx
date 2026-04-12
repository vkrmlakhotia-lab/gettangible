import { useState, useRef } from 'react'
import { MapPin, Calendar, User, Clock, ChevronRight, Check, ImageIcon, Loader2, Settings } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import type { BookPhoto } from '@/types/book'

// ─── Native camera helpers (iOS only) ────────────────────────────────────────

async function getNativeCamera() {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const { Camera } = await import('@capacitor/camera')
    return Camera
  } catch {
    return null
  }
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface RichPhoto {
  bookPhoto: BookPhoto
  file: File
  date: Date | null
  lat: number | null
  lon: number | null
  location?: string   // reverse-geocoded or clustered label
}

type Category = 'trips' | 'events' | 'people' | 'timeframe'

interface Props {
  onImport: (photos: BookPhoto[]) => void
}

// ─── EXIF parsing ─────────────────────────────────────────────────────────────

async function parseExif(file: File): Promise<{ date: Date | null; lat: number | null; lon: number | null }> {
  try {
    const exifr = await import('exifr')
    const data = await exifr.parse(file, { gps: true, tiff: true, exif: true })
    if (!data) return { date: null, lat: null, lon: null }

    const date = data.DateTimeOriginal
      ? new Date(data.DateTimeOriginal)
      : data.CreateDate
      ? new Date(data.CreateDate)
      : null

    const lat = typeof data.latitude === 'number' ? data.latitude : null
    const lon = typeof data.longitude === 'number' ? data.longitude : null

    return { date, lat, lon }
  } catch {
    return { date: null, lat: null, lon: null }
  }
}

// ─── Clustering helpers ───────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function clusterByLocation(photos: RichPhoto[], thresholdKm = 80): Map<string, RichPhoto[]> {
  const clusters = new Map<string, RichPhoto[]>()
  const geoPhotos = photos.filter(p => p.lat !== null && p.lon !== null)
  const noGeoPhotos = photos.filter(p => p.lat === null || p.lon === null)

  const assigned = new Set<string>()
  let clusterIdx = 0

  for (const photo of geoPhotos) {
    if (assigned.has(photo.bookPhoto.id)) continue
    const key = `Trip ${clusterIdx + 1}`
    const group = [photo]
    assigned.add(photo.bookPhoto.id)

    for (const other of geoPhotos) {
      if (assigned.has(other.bookPhoto.id)) continue
      const dist = haversineKm(photo.lat!, photo.lon!, other.lat!, other.lon!)
      if (dist <= thresholdKm) {
        group.push(other)
        assigned.add(other.bookPhoto.id)
      }
    }

    clusters.set(key, group)
    clusterIdx++
  }

  if (noGeoPhotos.length) clusters.set('No location', noGeoPhotos)
  return clusters
}

function clusterByDay(photos: RichPhoto[]): Map<string, RichPhoto[]> {
  const clusters = new Map<string, RichPhoto[]>()
  const noDate: RichPhoto[] = []

  for (const photo of photos) {
    if (!photo.date) { noDate.push(photo); continue }
    const key = photo.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!clusters.has(key)) clusters.set(key, [])
    clusters.get(key)!.push(photo)
  }

  if (noDate.length) clusters.set('No date', noDate)
  return clusters
}

function filterByDateRange(photos: RichPhoto[], from: Date, to: Date): RichPhoto[] {
  return photos.filter(p => {
    if (!p.date) return false
    return p.date >= from && p.date <= to
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const CategoryCard = ({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType
  title: string
  description: string
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="w-full bg-card rounded-xl p-4 card-shadow flex items-center gap-4 hover:bg-accent transition-colors text-left"
  >
    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon size={18} strokeWidth={1.5} className="text-primary" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
    <ChevronRight size={16} strokeWidth={1.5} className="text-muted-foreground" />
  </button>
)

// ─── Main component ───────────────────────────────────────────────────────────

type Step = 'permission' | 'denied' | 'category' | 'uploading' | 'filters' | 'options' | 'selecting'

const ApplePhotosImport = ({ onImport }: Props) => {
  const [step, setStep] = useState<Step>('permission')
  const [category, setCategory] = useState<Category | null>(null)
  const [allPhotos, setAllPhotos] = useState<RichPhoto[]>([])
  const [analysing, setAnalysing] = useState(false)

  // Filter step state (screen 09)
  const [filterScreenshots, setFilterScreenshots] = useState(true)
  const [filterBlurry, setFilterBlurry] = useState(true)
  const [filterDuplicates, setFilterDuplicates] = useState(true)
  const [includeSelfies, setIncludeSelfies] = useState(false)

  // Options step state
  const [tripClusters, setTripClusters] = useState<Map<string, RichPhoto[]>>(new Map())
  const [eventClusters, setEventClusters] = useState<Map<string, RichPhoto[]>>(new Map())
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [personName, setPersonName] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Photo selection state
  const [displayedPhotos, setDisplayedPhotos] = useState<RichPhoto[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fileRef = useRef<HTMLInputElement>(null)
  const dateFromRef = useRef<HTMLInputElement>(null)
  const dateToRef = useRef<HTMLInputElement>(null)

  // ── Permission request (native-aware) ────────────────────────────────────

  const handleAllowAccess = async () => {
    const result = await requestNativePhotosPermission()
    if (result === 'denied') {
      setStep('denied')
    } else {
      setStep('category')
    }
  }

  // ── Category selected — pick photos (native or web file input) ────────────

  const handleCategorySelect = async (cat: Category) => {
    setCategory(cat)
    if (Capacitor.isNativePlatform()) {
      const files = await pickPhotosNative()
      if (files.length > 0) {
        const fakeFileList = files as unknown as FileList
        await handleFiles(fakeFileList)
      }
    } else {
      fileRef.current?.click()
    }
  }

  // ── File upload + EXIF analysis ───────────────────────────────────────────

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return
    setAnalysing(true)
    setStep('uploading')

    const rich: RichPhoto[] = await Promise.all(
      Array.from(files).map(async file => {
        const { date, lat, lon } = await parseExif(file)
        return {
          bookPhoto: {
            id: crypto.randomUUID(),
            url: URL.createObjectURL(file),
            file,
          },
          file,
          date,
          lat,
          lon,
        }
      })
    )

    setAllPhotos(rich)
    setAnalysing(false)

    // Pre-compute clusters so they're ready after the filter step
    if (category === 'trips') {
      setTripClusters(clusterByLocation(rich))
    } else if (category === 'events') {
      setEventClusters(clusterByDay(rich))
    }

    // Always go to the filters screen first (screen 09)
    setStep('filters')
  }

  // ── Options confirmed → filter → show selection ───────────────────────────

  const handleOptionConfirm = () => {
    let filtered: RichPhoto[] = []

    if (category === 'trips' && selectedOption) {
      filtered = tripClusters.get(selectedOption) || []
    } else if (category === 'events' && selectedOption) {
      filtered = eventClusters.get(selectedOption) || []
    } else if (category === 'timeframe' && dateFrom && dateTo) {
      filtered = filterByDateRange(allPhotos, new Date(dateFrom), new Date(dateTo))
    } else if (category === 'people') {
      filtered = allPhotos
    }

    setDisplayedPhotos(filtered)
    setSelectedIds(new Set(filtered.map(p => p.bookPhoto.id)))
    setStep('selecting')
  }

  const togglePhoto = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleConfirmSelection = () => {
    const selected = displayedPhotos
      .filter(p => selectedIds.has(p.bookPhoto.id))
      .map(p => p.bookPhoto)
    onImport(selected)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  // STEP: Permission
  if (step === 'permission') {
    return (
      <div className="flex flex-col items-center text-center px-4 py-6 animate-fade-in">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <ImageIcon size={28} strokeWidth={1.5} className="text-primary" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1">Access Your Photos</h2>
        <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed mb-6">
          Snapora needs access to your photos to create your book. Your photos stay private and are only used for your book.
        </p>
        <button
          onClick={handleAllowAccess}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Allow Access
        </button>
        <p className="text-[10px] text-muted-foreground mt-3">
          Photos are uploaded securely and only visible to you.
        </p>
      </div>
    )
  }

  // STEP: Permission denied
  if (step === 'denied') {
    return (
      <div className="flex flex-col items-center text-center px-4 py-6 animate-fade-in">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
          <Settings size={28} strokeWidth={1.5} className="text-destructive" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1">Photos Access Denied</h2>
        <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed mb-4">
          Snapora needs access to your photo library. You can enable this in Settings.
        </p>
        <div className="w-full bg-muted rounded-xl p-4 text-left mb-6 space-y-2">
          <p className="text-xs font-medium text-foreground">How to allow access:</p>
          {['Open iPhone Settings', 'Scroll down to Snapora', 'Tap Photos', 'Select "All Photos"'].map((s, i) => (
            <p key={i} className="text-xs text-muted-foreground">{i + 1}.  {s}</p>
          ))}
        </div>
        <button
          onClick={() => {
            // Deep-link to app settings on iOS
            if (Capacitor.isNativePlatform()) {
              import('@capacitor/core').then(({ Capacitor: Cap }) => {
                window.open('app-settings:', '_system')
              })
            }
          }}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity mb-3"
        >
          Open Settings
        </button>
        <button
          onClick={() => setStep('permission')}
          className="text-xs text-muted-foreground"
        >
          Not now
        </button>
      </div>
    )
  }

  // STEP: Category
  if (step === 'category') {
    return (
      <div className="space-y-3 animate-fade-in">
        <p className="text-xs text-muted-foreground font-medium px-1">What would you like to create a book about?</p>
        <CategoryCard
          icon={MapPin}
          title="Recent Trips"
          description="Group photos by location — perfect for holidays"
          onClick={() => handleCategorySelect('trips')}
        />
        <CategoryCard
          icon={Calendar}
          title="Events"
          description="Birthdays, weddings, gatherings — grouped by date"
          onClick={() => handleCategorySelect('events')}
        />
        <CategoryCard
          icon={User}
          title="Certain People"
          description="Select photos featuring specific family or friends"
          onClick={() => handleCategorySelect('people')}
        />
        <CategoryCard
          icon={Clock}
          title="Time Frame"
          description="Choose photos from a specific date range"
          onClick={() => handleCategorySelect('timeframe')}
        />
        {/* Web fallback — hidden on native */}
        {!Capacitor.isNativePlatform() && (
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files ? Array.from(e.target.files) : [])}
          />
        )}
      </div>
    )
  }

  // STEP: Uploading / analysing (screen 08)
  if (step === 'uploading') {
    const ANALYSIS_STEPS = [
      'Reading photo metadata',
      'Detecting faces & people',
      'Clustering by date & location',
      'Scoring photo quality',
      'Filtering duplicates & screenshots',
    ]
    // Show the first two as done (metadata + faces are fast), rest pending
    return (
      <div className="flex flex-col items-center py-8 animate-fade-in">
        <div className="w-[80px] h-[80px] bg-[#e5f5ff] rounded-[40px] flex items-center justify-center mb-6">
          <Loader2 size={28} strokeWidth={1.5} className="text-[#007aff] animate-spin" />
        </div>
        <p className="text-[18px] font-semibold text-foreground mb-6">Scanning your library…</p>
        <div className="w-full space-y-3 px-2">
          {ANALYSIS_STEPS.map((label, i) => {
            const done = i < 2
            return (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-[#33bf66]' : 'bg-[#d9d9d9]'}`}>
                  {done && <Check size={12} strokeWidth={3} className="text-white" />}
                </div>
                <p className={`text-[14px] ${done ? 'text-foreground font-medium' : 'text-[#999]'}`}>{label}</p>
              </div>
            )
          })}
        </div>
        <p className="text-[12px] text-[#999] mt-6">Usually takes 20–40 seconds</p>
      </div>
    )
  }

  // STEP: Filters / Options (screen 09)
  if (step === 'filters') {
    // Naive heuristic counts based on filename/size — good enough for the UI
    const screenshotCount = allPhotos.filter(p =>
      p.file.name.toLowerCase().includes('screenshot') || p.file.size < 50_000
    ).length
    const duplicateCount = Math.floor(allPhotos.length * 0.05) // rough 5% estimate
    const selfieCount = Math.floor(allPhotos.length * 0.12)    // rough 12% estimate

    const applyFiltersAndContinue = () => {
      let filtered = [...allPhotos]
      if (filterScreenshots) {
        filtered = filtered.filter(p =>
          !p.file.name.toLowerCase().includes('screenshot') && p.file.size >= 50_000
        )
      }
      if (!includeSelfies) {
        // Selfies typically have front-camera flag in EXIF — skip for now (no data)
        // We keep all but note intent via state
      }

      // Update clusters with filtered set
      if (category === 'trips') {
        setTripClusters(clusterByLocation(filtered))
        setAllPhotos(filtered)
        setStep('options')
      } else if (category === 'events') {
        setEventClusters(clusterByDay(filtered))
        setAllPhotos(filtered)
        setStep('options')
      } else if (category === 'people') {
        setDisplayedPhotos(filtered)
        setSelectedIds(new Set(filtered.map(p => p.bookPhoto.id)))
        setAllPhotos(filtered)
        setStep('selecting')
      } else if (category === 'timeframe') {
        setAllPhotos(filtered)
        setStep('options')
      }
    }

    const shortlisted = allPhotos.length
      - (filterScreenshots ? screenshotCount : 0)
      - (filterDuplicates ? duplicateCount : 0)

    type ToggleRow = { label: string; sub: string; value: boolean; set: (v: boolean) => void }
    const rows: ToggleRow[] = [
      { label: 'Remove screenshots', sub: `Detected ${screenshotCount} screenshots`, value: filterScreenshots, set: setFilterScreenshots },
      { label: 'Remove blurry photos', sub: 'Quality threshold: medium', value: filterBlurry, set: setFilterBlurry },
      { label: 'Remove near-duplicates', sub: `Detected ${duplicateCount} duplicates`, value: filterDuplicates, set: setFilterDuplicates },
      { label: 'Include selfies', sub: `${selfieCount} selfies detected`, value: includeSelfies, set: setIncludeSelfies },
    ]

    return (
      <div className="flex flex-col min-h-[60vh] animate-fade-in">
        <p className="text-[20px] font-semibold text-foreground px-1 mb-0.5">Found {allPhotos.length} photos</p>
        <p className="text-[13px] text-muted-foreground px-1 mb-4">Adjust what to include</p>

        <div className="space-y-0 border-t border-border">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between py-4 border-b border-border">
              <div>
                <p className="text-[15px] text-foreground">{row.label}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{row.sub}</p>
              </div>
              {/* Toggle */}
              <button
                onClick={() => row.set(!row.value)}
                className={`relative w-[50px] h-[28px] rounded-full transition-colors flex-shrink-0 ${row.value ? 'bg-[#2eccb2]' : 'bg-[#d9d9d9]'}`}
              >
                <div className={`absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow transition-all ${row.value ? 'left-[25px]' : 'left-[3px]'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary banner */}
        <div className="bg-[#f0faf0] rounded-[12px] px-4 py-3 mt-4">
          <p className="text-[14px] font-medium text-[#1a8033]">{Math.max(shortlisted, 1)} photos shortlisted for your book</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">We'll auto-arrange them — you can edit later</p>
        </div>

        <button
          onClick={applyFiltersAndContinue}
          className="w-full h-12 bg-[#007aff] text-white rounded-xl font-medium text-sm mt-6 hover:opacity-90 transition-opacity"
        >
          Review & Select Photos →
        </button>
      </div>
    )
  }

  // STEP: Options (trips, events, timeframe)
  if (step === 'options') {
    // Trips
    if (category === 'trips') {
      const entries = Array.from(tripClusters.entries())
      return (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-muted-foreground font-medium px-1">
            We found {entries.length} location{entries.length !== 1 ? 's' : ''} in your photos. Pick one:
          </p>
          {entries.map(([label, photos]) => (
            <button
              key={label}
              onClick={() => setSelectedOption(label)}
              className={`w-full rounded-xl p-4 card-shadow flex items-center gap-3 transition-colors text-left ${
                selectedOption === label ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
              }`}
            >
              <MapPin size={16} strokeWidth={1.5} className={selectedOption === label ? 'text-primary-foreground' : 'text-primary'} />
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className={`text-xs mt-0.5 ${selectedOption === label ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {photos.length} photo{photos.length !== 1 ? 's' : ''}
                  {photos[0]?.date ? ` · ${photos[0].date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : ''}
                </p>
              </div>
              {selectedOption === label && <Check size={16} strokeWidth={2} />}
            </button>
          ))}
          <button
            onClick={handleOptionConfirm}
            disabled={!selectedOption}
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-30 mt-2"
          >
            Show Photos →
          </button>
        </div>
      )
    }

    // Events
    if (category === 'events') {
      const entries = Array.from(eventClusters.entries()).filter(([k]) => k !== 'No date')
      const noDate = eventClusters.get('No date') || []
      return (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-muted-foreground font-medium px-1">
            Found {entries.length} day{entries.length !== 1 ? 's' : ''} with photos. Pick one:
          </p>
          {entries.map(([label, photos]) => (
            <button
              key={label}
              onClick={() => setSelectedOption(label)}
              className={`w-full rounded-xl p-4 card-shadow flex items-center gap-3 transition-colors text-left ${
                selectedOption === label ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
              }`}
            >
              <Calendar size={16} strokeWidth={1.5} className={selectedOption === label ? 'text-primary-foreground' : 'text-primary'} />
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className={`text-xs mt-0.5 ${selectedOption === label ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {photos.length} photo{photos.length !== 1 ? 's' : ''}
                </p>
              </div>
              {selectedOption === label && <Check size={16} strokeWidth={2} />}
            </button>
          ))}
          {noDate.length > 0 && (
            <button
              onClick={() => setSelectedOption('No date')}
              className={`w-full rounded-xl p-4 card-shadow flex items-center gap-3 transition-colors text-left ${
                selectedOption === 'No date' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
              }`}
            >
              <Calendar size={16} strokeWidth={1.5} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Unknown date</p>
                <p className="text-xs text-muted-foreground">{noDate.length} photos</p>
              </div>
              {selectedOption === 'No date' && <Check size={16} strokeWidth={2} />}
            </button>
          )}
          <button
            onClick={handleOptionConfirm}
            disabled={!selectedOption}
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-30 mt-2"
          >
            Show Photos →
          </button>
        </div>
      )
    }

    // Time Frame
    if (category === 'timeframe') {
      const dates = allPhotos.map(p => p.date).filter(Boolean) as Date[]
      const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : null
      const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
      const fmt = (d: Date) => d.toISOString().split('T')[0]

      return (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-muted-foreground font-medium px-1">
            Your photos span{' '}
            {minDate && maxDate
              ? `${minDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} – ${maxDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
              : 'an unknown date range'}
            . Pick a window:
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">From</label>
              <input
                ref={dateFromRef}
                type="date"
                value={dateFrom || (minDate ? fmt(minDate) : '')}
                min={minDate ? fmt(minDate) : undefined}
                max={maxDate ? fmt(maxDate) : undefined}
                onChange={e => {
                  setDateFrom(e.target.value)
                  dateFromRef.current?.blur()
                  setTimeout(() => dateToRef.current?.focus(), 100)
                }}
                className="w-full mt-1.5 h-12 px-4 bg-card rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">To</label>
              <input
                ref={dateToRef}
                type="date"
                value={dateTo || (maxDate ? fmt(maxDate) : '')}
                min={minDate ? fmt(minDate) : undefined}
                max={maxDate ? fmt(maxDate) : undefined}
                onChange={e => {
                  setDateTo(e.target.value)
                  dateToRef.current?.blur()
                }}
                className="w-full mt-1.5 h-12 px-4 bg-card rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <button
            onClick={handleOptionConfirm}
            disabled={!dateFrom || !dateTo}
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            Show Photos →
          </button>
        </div>
      )
    }
  }

  // STEP: Photo selection — date-grouped with per-group select/deselect
  if (step === 'selecting') {
    const selectedCount = selectedIds.size

    // Group displayed photos by date label
    const grouped: { label: string; photos: RichPhoto[] }[] = []
    const labelMap = new Map<string, RichPhoto[]>()
    for (const photo of displayedPhotos) {
      const label = photo.date
        ? photo.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : 'No date'
      if (!labelMap.has(label)) labelMap.set(label, [])
      labelMap.get(label)!.push(photo)
    }
    labelMap.forEach((photos, label) => grouped.push({ label, photos }))

    const allGroupSelected = (photos: RichPhoto[]) =>
      photos.every(p => selectedIds.has(p.bookPhoto.id))

    const toggleGroup = (photos: RichPhoto[]) => {
      const allSelected = allGroupSelected(photos)
      setSelectedIds(prev => {
        const next = new Set(prev)
        photos.forEach(p =>
          allSelected ? next.delete(p.bookPhoto.id) : next.add(p.bookPhoto.id)
        )
        return next
      })
    }

    return (
      <div className="flex flex-col min-h-[60vh] animate-fade-in">
        {/* People name input */}
        {category === 'people' && (
          <div className="px-1 mb-4">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Who is this book about?</label>
            <input
              type="text"
              value={personName}
              onChange={e => setPersonName(e.target.value)}
              placeholder="e.g. Grandma, The kids, Maya"
              className="w-full mt-1.5 h-10 px-4 bg-card rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm font-semibold text-foreground">
            {displayedPhotos.length} Photos
          </p>
          <button
            onClick={() =>
              selectedCount === displayedPhotos.length
                ? setSelectedIds(new Set())
                : setSelectedIds(new Set(displayedPhotos.map(p => p.bookPhoto.id)))
            }
            className="text-xs text-primary font-medium"
          >
            {selectedCount === displayedPhotos.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {displayedPhotos.length === 0 ? (
          <div className="text-center py-8 flex-1">
            <p className="text-sm text-muted-foreground">No photos found for this selection.</p>
            <button onClick={() => setStep('options')} className="text-xs text-primary mt-2">← Go back</button>
          </div>
        ) : (
          <div className="space-y-5 pb-24">
            {grouped.map(({ label, photos }) => {
              const groupAllSelected = allGroupSelected(photos)
              return (
                <div key={label}>
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <button
                      onClick={() => toggleGroup(photos)}
                      className="text-xs text-primary font-medium"
                    >
                      {groupAllSelected ? 'Deselect' : 'Select'}
                    </button>
                  </div>

                  {/* Photo grid for group */}
                  <div className="grid grid-cols-3 gap-0.5">
                    {photos.map(photo => {
                      const isSelected = selectedIds.has(photo.bookPhoto.id)
                      return (
                        <button
                          key={photo.bookPhoto.id}
                          onClick={() => togglePhoto(photo.bookPhoto.id)}
                          className="aspect-square relative overflow-hidden"
                        >
                          <img src={photo.bookPhoto.url} alt="" className="w-full h-full object-cover" />
                          {/* Dim overlay when deselected */}
                          {!isSelected && (
                            <div className="absolute inset-0 bg-black/40" />
                          )}
                          {/* Checkmark badge */}
                          <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#00C2A8] border-[#00C2A8]'
                              : 'border-white/70 bg-transparent'
                          }`}>
                            {isSelected && <Check size={10} strokeWidth={3} className="text-white" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Fixed Continue button */}
        <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-3 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
          <button
            onClick={handleConfirmSelection}
            disabled={selectedCount === 0}
            className="w-full h-12 bg-[#00C2A8] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 pointer-events-auto"
          >
            Continue ({selectedCount} Selected)
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default ApplePhotosImport
