import { useEffect } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useCartDrawer } from "../../hooks/useCartDrawer";
import { formatCurrency } from "../../utils/formatCurrency";

export default function CartSlideOver() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { isCartOpen, closeCart } = useCartDrawer();

  useEffect(() => {
    if (!isCartOpen) return;

    // Lock background scrolling
    document.body.style.overflow = "hidden";

    // Close on Escape key
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[60] transition-opacity cursor-pointer"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-zinc-800 transition-colors duration-300">
          <h2 id="cart-title" className="text-xl font-serif font-bold text-zinc-900 dark:text-stone-50 transition-colors duration-300">Your Cart</h2>
          <button 
            type="button" 
            onClick={closeCart}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-stone-50 transition-colors rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 dark:bg-zinc-950 rounded-full flex items-center justify-center text-stone-300 dark:text-zinc-700 mb-2 transition-colors duration-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">Your cart is currently empty.</p>
              <Link 
                to="/menu" 
                onClick={closeCart}
                className="text-rose-500 font-bold hover:text-rose-600 transition-colors cursor-pointer"
              >
                Explore our menu →
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  {/* Thumbnail */}
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-20 h-20 object-cover rounded-xl bg-stone-100 dark:bg-zinc-800 shrink-0 transition-colors duration-300"
                  />

                  {/* Details */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-stone-50 leading-snug line-clamp-2 transition-colors duration-300">
                        {item.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-stone-400 dark:text-zinc-500 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-medium transition-colors duration-300">
                      {formatCurrency(item.price)}
                    </p>

                    {/* Quantity & Subtotal */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3 bg-stone-50 dark:bg-zinc-950 rounded-full px-2 py-1 border border-stone-100 dark:border-zinc-800 transition-colors duration-300">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-zinc-900 dark:text-stone-50 w-4 text-center transition-colors duration-300">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-zinc-900 dark:text-stone-50 transition-colors duration-300">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 dark:border-zinc-800 p-6 bg-stone-50 dark:bg-zinc-950 shrink-0 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest transition-colors duration-300">Subtotal</span>
              <span className="text-xl font-extrabold text-zinc-900 dark:text-stone-50 transition-colors duration-300">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 text-center transition-colors duration-300">
              Taxes and pickup schedule calculated at checkout.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/checkout"
                onClick={closeCart}
                className="flex items-center justify-center w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl dark:hover:shadow-rose-900/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/menu"
                onClick={closeCart}
                className="flex items-center justify-center w-full py-4 border-2 border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-stone-50 hover:border-stone-300 dark:hover:border-zinc-600 rounded-full font-bold transition-all duration-300 cursor-pointer"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
        
      </div>
    </>
  );
}
