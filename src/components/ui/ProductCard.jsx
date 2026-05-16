import { ShoppingCart, Minus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useCartDrawer } from "../../hooks/useCartDrawer";
import { formatCurrency } from "../../utils/formatCurrency";
import { categories } from "../../data/categories";
import Badge from "./Badge";

/** Resolve a human-readable category name from a categoryId slug */
function getCategoryName(categoryId) {
  const match = categories.find((c) => c.id === categoryId);
  return match ? match.name : null;
}

/**
 * ProductCard — reusable product card for HomePage and MenuPage.
 * @param {{ product: import('../../data/menuItems').MenuItem }} props
 */
export default function ProductCard({ product }) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { openCart } = useCartDrawer();

  const categoryName = getCategoryName(product.categoryId);

  const cartItem = items.find((i) => i.id === product.id);

  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.isAvailable) return;
    addItem(product);
  }

  function handleMinus(e) {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem.quantity <= 1) {
      removeItem(product.id);
    } else {
      updateQuantity(product.id, cartItem.quantity - 1);
    }
  }

  function handlePlus(e) {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, cartItem.quantity + 1);
  }

  function handleViewCart(e) {
    e.preventDefault();
    e.stopPropagation();
    openCart();
  }

  return (
    <article className="group bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-stone-100 dark:border-zinc-800 hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1">
      {/* ——— Image ——— */}
      <Link to={`/product/${product.id}`} className="relative overflow-hidden aspect-[4/3] bg-stone-100 dark:bg-zinc-800 block shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Unavailable overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-zinc-900/60 flex items-center justify-center">
            <span className="text-white text-sm font-semibold tracking-wide bg-zinc-800/80 px-3 py-1 rounded-full">
              Currently Unavailable
            </span>
          </div>
        )}

        {/* Category badge */}
        {categoryName && (
          <Badge className="absolute top-3 left-3">
            {categoryName}
          </Badge>
        )}
      </Link>

      {/* ——— Body ——— */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-zinc-900 dark:text-stone-50 hover:text-rose-500 transition-colors duration-200 font-serif font-bold text-lg leading-snug">
            {product.name}
          </h3>
        </Link>

        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price + CTA row */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3 mt-auto pt-3 border-t border-stone-100 dark:border-zinc-800">
          <span className="text-zinc-900 dark:text-stone-50 font-extrabold text-base">
            {formatCurrency(product.price)}
          </span>

          {cartItem ? (
            <div className="flex w-full items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-2 bg-stone-50 dark:bg-zinc-950 rounded-full px-2 py-1 border border-stone-100 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={handleMinus}
                  className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-zinc-900 dark:text-stone-50 w-4 text-center">
                  {cartItem.quantity}
                </span>
                <button
                  type="button"
                  onClick={handlePlus}
                  className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleViewCart}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow-rose-200 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                View Cart
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              aria-label={`Add ${product.name} to cart`}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 shadow-sm cursor-pointer
                ${
                  product.isAvailable
                    ? "bg-rose-500 hover:bg-rose-600 text-white hover:shadow-rose-200 dark:hover:shadow-rose-900/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    : "bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 cursor-not-allowed"
                }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
