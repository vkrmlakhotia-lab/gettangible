import { useEffect } from "react";
import { Package, Truck, Mail } from "lucide-react";
import confetti from "canvas-confetti";

interface OrderConfirmationProps {
  title?: string;
  pageCount: number;
  total: number;
  onViewOrders: () => void;
  onBackHome: () => void;
}

const OrderConfirmation = ({ title, pageCount, total, onViewOrders, onBackHome }: OrderConfirmationProps) => {
  const orderNumber = `SN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`;

  useEffect(() => {
    const colors = ["#f8961e", "#43aa8b", "#f9c74f", "#90be6d", "#577590"];
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.45 }, colors });
    const end = Date.now() + 1800;
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-background flex items-center justify-center">
      <div className="max-w-md w-full h-full flex flex-col items-center justify-center px-6">
        {/* Animated success icon */}
        <div className="w-24 h-24 rounded-full bg-[hsl(var(--tangible-green))]/10 flex items-center justify-center mb-5 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--tangible-green))]/20 flex items-center justify-center">
            <svg className="w-9 h-9 text-[hsl(var(--tangible-green))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-1 animate-fade-in">Order Confirmed! 🎉</h2>
        <p className="text-sm text-muted-foreground text-center mb-6 animate-fade-in">
          Your photobook is being printed with care.
        </p>

        {/* Order summary card */}
        <div className="w-full rounded-2xl bg-card border border-border overflow-hidden mb-5 animate-fade-in">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Order #{orderNumber}</span>
            <span className="text-xs font-semibold text-[hsl(var(--tangible-green))] bg-[hsl(var(--tangible-green))]/10 px-2.5 py-0.5 rounded-full">Confirmed</span>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">{title || "My Photobook"}</p>
            <p className="text-xs text-muted-foreground">{pageCount} pages · Matte · Classic</p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Total paid</span>
              <span className="text-base font-bold text-[hsl(var(--tangible-orange))]">£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Timeline steps */}
        <div className="w-full flex items-center justify-between px-2 mb-8 animate-fade-in">
          {[
            { icon: Package, label: "Printing", active: true },
            { icon: Truck, label: "Delivery", active: false },
            { icon: Mail, label: "Arrives", active: false },
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center gap-1.5 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step.active
                  ? "bg-[hsl(var(--tangible-orange))]/10 text-[hsl(var(--tangible-orange))]"
                  : "bg-muted/50 text-muted-foreground"
              }`}>
                <step.icon className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[10px] font-medium ${step.active ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              {i < 2 && (
                <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-10px)] h-px bg-border" style={{ width: "60px" }} />
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mb-6">
          Estimated delivery: <span className="font-semibold text-foreground">5-7 working days</span>
          <br />
          <span className="text-[11px]">We'll email you tracking details shortly.</span>
        </p>

        {/* Actions */}
        <div className="w-full space-y-2.5">
          <button
            onClick={onViewOrders}
            className="w-full py-3.5 rounded-2xl bg-[hsl(var(--tangible-orange))] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Track My Order
          </button>
          <button
            onClick={onBackHome}
            className="w-full py-3.5 rounded-2xl border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
          >
            Create Another Book
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
