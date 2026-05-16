import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { ShoppingCart, ArrowLeft, Minus, Plus } from "lucide-react";
import { menuItems } from "../data/menuItems";
import { categories } from "../data/categories";
import { useCart } from "../hooks/useCart";
import { useCartDrawer } from "../hooks/useCartDrawer";
import { formatCurrency } from "../utils/formatCurrency";

function getCategoryName(categoryId) {
  const match = categories.find((c) => c.id === categoryId);
  return match ? match.name : null;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = menuItems.find((p) => p.id === id);

  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { openCart } = useCartDrawer();
  
  const cartItem = items?.find((i) => i.id === product?.id);

  useEffect(() => {
    // Scroll to top when loading the page
    window.scrollTo(0, 0);
  }, [id]); // Depend on ID to re-scroll if navigating between products

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center py-24 px-4 text-center transition-colors duration-300">
        <h1 className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-4xl md:text-5xl mb-4 transition-colors duration-300">
          Product Not Found
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-8 transition-colors duration-300">
          This cake might be out of season or the link is incorrect.
        </p>
        <Link
          to="/menu"
          className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all duration-300 hover:-translate-y-0.5"
        >
          Back to Menu
        </Link>
      </div>
    );
  }

  const categoryName = getCategoryName(product.categoryId);

  function handleAddToCart() {
    if (!product.isAvailable) return;
    addItem(product);
  }

  function handleMinus() {
    if (cartItem.quantity <= 1) {
      removeItem(product.id);
    } else {
      updateQuantity(product.id, cartItem.quantity - 1);
    }
  }

  function handlePlus() {
    updateQuantity(product.id, cartItem.quantity + 1);
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 py-12 md:py-24 px-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-rose-500 transition-colors font-medium mb-8 md:mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

        {/* Main Content Grid */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-stone-100 dark:border-zinc-800 overflow-hidden flex flex-col md:flex-row transition-colors duration-300">

          {/* Left: Image */}
          <div className="md:w-1/2 relative bg-stone-100 dark:bg-zinc-800 transition-colors duration-300">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover aspect-square md:aspect-auto md:absolute md:inset-0"
            />
            {!product.isAvailable && (
              <div className="absolute inset-0 bg-zinc-900/60 flex items-center justify-center">
                <span className="text-white text-lg font-bold tracking-wide bg-zinc-800/80 px-6 py-2 rounded-full shadow-lg">
                  Currently Unavailable
                </span>
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col">

            {/* Category */}
            {categoryName && (
              <span className="inline-block text-rose-500 text-xs font-bold uppercase tracking-widest mb-4">
                {categoryName}
              </span>
            )}

            {/* Title */}
            <h1
              className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mb-6 transition-colors duration-300"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-zinc-900 dark:text-stone-50 font-extrabold text-2xl mb-8 transition-colors duration-300">
              {formatCurrency(product.price)}
            </p>

            {/* Divider */}
            <hr className="border-stone-100 dark:border-zinc-800 mb-8 transition-colors duration-300" />

            {/* Description */}
            <div className="flex-1">
              <h3 className="text-zinc-900 dark:text-stone-50 font-bold mb-3 transition-colors duration-300">About this item</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg mb-10 transition-colors duration-300">
                {product.description}
              </p>
            </div>

            {/* Add to Cart CTA */}
            {cartItem ? (
              <div className="flex w-full items-center gap-4">
                <div className="flex items-center gap-4 bg-stone-50 dark:bg-zinc-950 rounded-full px-4 py-2 border border-stone-200 dark:border-zinc-800 shrink-0 transition-colors duration-300">
                  <button
                    type="button"
                    onClick={handleMinus}
                    className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-base font-bold text-zinc-900 dark:text-stone-50 w-6 text-center">
                    {cartItem.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handlePlus}
                    className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={openCart}
                  className="flex-1 flex items-center justify-center gap-3 py-4 rounded-full text-base font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                >
                  View Cart
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                className={`flex items-center justify-center gap-3 w-full py-4 rounded-full text-base font-bold transition-all duration-300 shadow-md cursor-pointer
                  ${
                    product.isAvailable
                      ? "bg-rose-500 hover:bg-rose-600 text-white hover:shadow-rose-200 dark:hover:shadow-rose-900/30 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                      : "bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 cursor-not-allowed"
                  }`}
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
