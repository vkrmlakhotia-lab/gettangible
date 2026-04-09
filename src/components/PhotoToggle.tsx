import { cn } from "@/lib/utils";

interface PhotoToggleProps {
  activeTab: "shortlisted" | "preview";
  onTabChange: (tab: "shortlisted" | "preview") => void;
}

const PhotoToggle = ({ activeTab, onTabChange }: PhotoToggleProps) => {
  return (
    <div className="flex items-center rounded-full bg-muted p-1 w-full max-w-xs mx-auto">
      <button
        onClick={() => onTabChange("shortlisted")}
        className={cn(
          "flex-1 rounded-full py-2.5 px-4 text-sm font-medium transition-all duration-200",
          activeTab === "shortlisted"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Shortlisted photos
      </button>
      <button
        onClick={() => onTabChange("preview")}
        className={cn(
          "flex-1 rounded-full py-2.5 px-4 text-sm font-medium transition-all duration-200",
          activeTab === "preview"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Preview
      </button>
    </div>
  );
};

export default PhotoToggle;
