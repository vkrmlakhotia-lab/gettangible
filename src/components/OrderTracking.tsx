import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTrackingProps {
  coverUrl?: string;
  title?: string;
  total: number;
  onBack: () => void;
}

interface TrackingStep {
  label: string;
  date: string;
  status: "done" | "active" | "pending";
}

const OrderTracking = ({ coverUrl, title, total, onBack }: OrderTrackingProps) => {
  const orderNumber = `SN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`;

  const steps: TrackingStep[] = [
    { label: "Order Confirmed", date: "1 Apr 2026, 09:32", status: "done" },
    { label: "Printing", date: "Estimated 2-3 Apr", status: "done" },
    { label: "Dispatched", date: "Expected 3 Apr", status: "active" },
    { label: "Out for Delivery", date: "Expected 7 Apr", status: "pending" },
    { label: "Delivered", date: "Expected 7 Apr", status: "pending" },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-background flex items-center justify-center">
      <div className="max-w-md w-full h-full flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border/40">
          <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground flex-1 text-center pr-5">Order Tracking</h1>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6">
          {/* Order item */}
          <div className="flex items-center gap-3 p-3 border border-border rounded-xl">
            <div className="w-12 h-16 rounded-md overflow-hidden bg-muted/20 flex-shrink-0">
              {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{title || "My Photobook"}</p>
              <p className="text-xs text-muted-foreground">Order #{orderNumber}</p>
              <p className="text-sm font-semibold text-[hsl(var(--tangible-orange))] mt-0.5">£{total.toFixed(2)}</p>
            </div>
          </div>

          {/* Status timeline */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-4">Delivery Status</h3>
            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={step.label} className="flex gap-3">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                        step.status === "done" && "bg-[hsl(var(--tangible-green))]",
                        step.status === "active" && "bg-[hsl(var(--tangible-orange))]",
                        step.status === "pending" && "border-2 border-border bg-card"
                      )}
                    >
                      {step.status === "done" && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={cn(
                        "w-0.5 h-10 flex-shrink-0",
                        step.status === "done" ? "bg-[hsl(var(--tangible-green))]/40" : "bg-border"
                      )} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-6">
                    <p className={cn(
                      "text-sm font-medium",
                      step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking number */}
          <div className="p-3 rounded-xl bg-[hsl(var(--tangible-orange))]/5 border border-[hsl(var(--tangible-orange))]/15 space-y-1">
            <p className="text-xs text-muted-foreground">Tracking Number</p>
            <p className="text-sm font-medium text-[hsl(var(--tangible-orange))]">DPD: 1Z999AA10123456784</p>
          </div>

          <button
            onClick={() => window.open("https://www.dpd.co.uk/tracking", "_blank")}
            className="w-full py-3.5 rounded-2xl bg-[hsl(var(--tangible-orange))] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Track with DPD
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
