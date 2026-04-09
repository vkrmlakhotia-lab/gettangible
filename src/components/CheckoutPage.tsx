import { useState } from "react";
import { ChevronLeft, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutPageProps {
  coverUrl?: string;
  title?: string;
  pageCount: number;
  onBack: () => void;
  onComplete: () => void;
}

const CheckoutPage = ({ coverUrl, title, pageCount, onBack, onComplete }: CheckoutPageProps) => {
  const [name, setName] = useState("Vik Lakhotia");
  const [address, setAddress] = useState("12 Notting Hill Gate, London, W11 3JE");
  const [editingAddress, setEditingAddress] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const bookPrice = 24.0;
  const deliveryPrice = 3.99;
  const discount = promoApplied ? 0.0 : 0.0;
  const total = bookPrice + deliveryPrice - discount;

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setPromoApplied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-background flex items-center justify-center">
      <div className="max-w-md w-full h-full flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border/40">
          <button onClick={onBack} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground flex-1 text-center pr-5">Checkout</h1>
        </div>

        <div className="flex-1 px-5 py-5 space-y-5">
          {/* Order item */}
          <div className="flex items-center gap-3 p-3 border border-border rounded-xl">
            <div className="w-12 h-16 rounded-md overflow-hidden bg-muted/20 flex-shrink-0">
              {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{title || "My Photobook"}</p>
              <p className="text-xs text-muted-foreground">{pageCount} pages · Matte · Classic</p>
              <p className="text-sm font-semibold text-[hsl(var(--tangible-orange))] mt-0.5">£{bookPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Delivery address */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--tangible-orange))] mb-2">Delivery Address</h3>
            {editingAddress ? (
              <div className="space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-border text-sm bg-card text-foreground outline-none focus:border-[hsl(var(--tangible-teal))]"
                  placeholder="Full name"
                />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full py-2.5 px-3 rounded-xl border border-border text-sm bg-card text-foreground outline-none focus:border-[hsl(var(--tangible-teal))] resize-none"
                  placeholder="Address"
                />
                <button
                  onClick={() => setEditingAddress(false)}
                  className="text-xs text-[hsl(var(--tangible-teal))] font-medium"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between p-3 border border-border rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{address}</p>
                </div>
                <button
                  onClick={() => setEditingAddress(true)}
                  className="text-xs text-[hsl(var(--tangible-teal))] font-medium flex-shrink-0"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--tangible-orange))] mb-2">Order Summary</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">Photo book ({pageCount}pp)</span>
                <span className="text-foreground font-medium">£{bookPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground">Standard delivery (5-7 days)</span>
                <span className="text-foreground font-medium">£{deliveryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground">Discount code</span>
                <span className="text-foreground font-medium">- £{discount.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2.5 flex justify-between text-sm">
                <span className="font-semibold text-[hsl(var(--tangible-orange))]">Total</span>
                <span className="font-semibold text-foreground">£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Promo code */}
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 py-2.5 px-3 rounded-xl border border-border text-sm bg-card text-foreground outline-none focus:border-[hsl(var(--tangible-teal))] placeholder:text-muted-foreground"
              placeholder="Promo code"
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Payment buttons */}
        <div className="px-5 pb-6 pt-2 space-y-2.5 border-t border-border/40">
          <button
            onClick={onComplete}
            className="w-full py-3.5 rounded-2xl bg-[hsl(var(--tangible-orange))] text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Pay with Apple Pay £{total.toFixed(2)}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            Secured by Stripe
          </div>

          <div className="text-center text-xs text-muted-foreground">or pay with card</div>

          <button
            onClick={onComplete}
            className="w-full py-3.5 rounded-2xl border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
          >
            Enter card details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
