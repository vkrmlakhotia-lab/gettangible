import { Switch } from "@/components/ui/switch";
import { Filter } from "@/pages/Index";

interface PhotoFiltersProps {
  filters: Filter[];
  onToggle: (id: string) => void;
}

const PhotoFilters = ({ filters, onToggle }: PhotoFiltersProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {filters.map((filter) => (
        <div
          key={filter.id}
          className="flex items-center justify-between transition-all duration-200 hover:bg-muted/30 rounded-lg px-1 -mx-1 py-0.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">{filter.label}</span>
            {filter.count > 0 && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 transition-transform duration-200">
                {filter.count} detected
              </span>
            )}
          </div>
          <Switch
            checked={filter.enabled}
            onCheckedChange={() => onToggle(filter.id)}
            className="data-[state=checked]:bg-tangible-teal transition-all duration-200"
          />
        </div>
      ))}
    </div>
  );
};

export default PhotoFilters;
