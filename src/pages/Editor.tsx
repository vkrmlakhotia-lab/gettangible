import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBooks } from '@/context/BookContext'
import PageRenderer from '@/components/PageRenderer'
import { ChevronLeft, ShoppingBag } from 'lucide-react'

const Editor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, setCurrentProject, currentProject } = useBooks()

  useEffect(() => {
    if (id) setCurrentProject(id)
  }, [id, projects])

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading book…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-b border-border flex items-center justify-between px-4 pt-14 pb-3">
        <button onClick={() => navigate('/home')} className="flex items-center gap-1 text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[14px]">Home</span>
        </button>
        <h1 className="text-[16px] font-semibold text-foreground truncate max-w-[180px]">
          {currentProject.title}
        </h1>
        <button
          onClick={() => navigate(`/checkout/${currentProject.id}`)}
          className="flex items-center gap-1.5 bg-primary text-white rounded-full px-3 py-1.5 text-[13px] font-medium"
        >
          <ShoppingBag className="w-4 h-4" />
          Order
        </button>
      </header>

      {/* Pages */}
      <div className="pt-[100px] px-4 space-y-4">
        {currentProject.pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-[15px]">No pages yet</p>
          </div>
        ) : (
          currentProject.pages.map((page, i) => (
            <div key={page.id} className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
              <div className="text-[11px] text-muted-foreground px-3 py-1.5 border-b border-border/50">
                Page {i + 1}
              </div>
              <div className="aspect-[3/4] w-full">
                <PageRenderer page={page} title={currentProject.title} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Editor
