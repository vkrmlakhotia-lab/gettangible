import { ChevronLeft } from "lucide-react";

interface OrderConfirmationProps {
  title?: string;
  pageCount: number;
  total: number;
  onViewOrders: () => void;
  onBackHome: () => void;
}

const OrderConfirmation = ({ title, pageCount, total, onViewOrders, onBackHome }: OrderConfirmationProps) => {
  const orderNumber = `SN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-40 bg-background flex items-center justify-center">
      <div className="max-w-md w-full h-full flex flex-col items-center justify-center px-6">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--tangible-green))]/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-[hsl(var(--tangible-green))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-1.5">Order Confirmed!</h2>
        <p className="text-sm text-muted-foreground text-center mb-1">We're printing your book now.</p>
        <p className="text-sm text-muted-foreground text-center mb-8">Estimated delivery: 5-7 working days</p>

        {/* Order summary card */}
        <div className="w-full p-4 rounded-xl bg-[hsl(var(--tangible-orange))]/5 border border-[hsl(var(--tangible-orange))]/15 mb-8 space-y-1.5">
          <p className="text-xs text-muted-foreground">Order #{orderNumber}</p>
          <p className="text-sm text-foreground">{title || "My Photobook"} · {pageCount} pages · Matte</p>
          <p className="text-sm font-semibold text-[hsl(var(--tangible-orange))]">£{total.toFixed(2)} · Standard delivery</p>
          <p className="text-xs text-muted-foreground mt-2">Tracking will be emailed to you</p>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2.5">
          <button
            onClick={onViewOrders}
            className="w-full py-3.5 rounded-2xl bg-[hsl(var(--tangible-orange))] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            View My Orders
          </button>
          <button
            onClick={onBackHome}
            className="w-full py-3.5 rounded-2xl border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
