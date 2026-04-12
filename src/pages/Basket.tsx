import { useNavigate } from 'react-router-dom'
import { useBooks } from '@/context/BookContext'
import { ShoppingBag, ChevronRight } from 'lucide-react'

const Basket = () => {
  const navigate = useNavigate()
  const { projects } = useBooks()

  const completedBooks = projects.filter(p => p.status === 'completed' || p.status === 'draft')

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center justify-center px-6 pt-14 pb-4 border-b border-border">
        <h1 className="text-[17px] font-semibold text-foreground">Basket</h1>
      </header>

      {completedBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-[16px] font-medium text-foreground">Your basket is empty</p>
          <p className="text-[13px] text-muted-foreground text-center">
            Create a book and tap Order to add it here
          </p>
          <button
            onClick={() => navigate('/create')}
            className="mt-2 bg-primary text-white rounded-[16px] px-6 py-3 text-[15px] font-medium"
          >
            Create a Book
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3">
          {completedBooks.map(project => (
            <div
              key={project.id}
              className="bg-card border border-border rounded-[14px] px-4 py-3 flex items-center justify-between"
              onClick={() => navigate(`/checkout/${project.id}`)}
            >
              <div>
                <p className="text-[15px] font-medium text-foreground">{project.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {project.pages.length} pages
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Basket
