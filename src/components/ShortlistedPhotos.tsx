import { useMemo } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PhotoFilters from "./PhotoFilters";
import { Photo } from "@/data/samplePhotos";
import { Filter } from "@/pages/Index";

interface ShortlistedPhotosProps {
  photos: Photo[];
  filters: Filter[];
  onToggleFilter: (id: string) => void;
  onRemove: (id: string) => void;
  onAddPhotos: () => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const SortablePhoto = ({ photo, onRemove }: { photo: Photo; onRemove: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square rounded-lg overflow-hidden group transition-all duration-200">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-black/40 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab z-10"
      >
        <GripVertical className="w-3 h-3" />
      </div>
      <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" loading="lazy" />
      <button
        onClick={() => onRemove(photo.id)}
        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500 z-10"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const ShortlistedPhotos = ({
  photos,
  filters,
  onToggleFilter,
  onRemove,
  onAddPhotos,
  onReorder,
}: ShortlistedPhotosProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Photo[]>();
    photos.forEach((p) => {
      const existing = map.get(p.date) || [];
      existing.push(p);
      map.set(p.date, existing);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [photos]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PhotoFilters filters={filters} onToggle={onToggleFilter} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
          {grouped.map(([date, datePhotos]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-foreground mb-2">{formatDate(date)}</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {datePhotos.map((photo) => (
                  <SortablePhoto key={photo.id} photo={photo} onRemove={onRemove} />
                ))}
              </div>
            </div>
          ))}
        </SortableContext>
      </DndContext>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex items-center justify-between">
        <span className="text-sm text-foreground font-medium">
          {photos.length} photos shortlisted
        </span>
        <button
          onClick={onAddPhotos}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add photos
        </button>
      </div>
    </div>
  );
};

export default ShortlistedPhotos;
