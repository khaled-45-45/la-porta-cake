import { useState } from "react";
import { menuItems } from "../data/menuItems";
import { categories } from "../data/categories";
import ProductCard from "../components/ui/ProductCard";

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredItems =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.categoryId === activeCategory);

  return (
    <div className="bg-stone-50 dark:bg-zinc-950 min-h-screen py-16 md:py-24 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* ——— Header ——— */}
        <div className="text-center mb-12 md:mb-16">
          <h1
            className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-4 transition-colors duration-300"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            Our Menu
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed transition-colors duration-300">
            Explore our handcrafted cakes and bakery favorites, prepared for
            pickup or delivery.
          </p>
        </div>

        {/* ——— Category Filters ——— */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12 md:mb-16">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
              activeCategory === "all"
                ? "bg-zinc-900 dark:bg-rose-500 text-white dark:text-white border-zinc-900 dark:border-rose-500 shadow-md cursor-pointer"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-stone-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-500 hover:text-rose-500 hover:shadow-sm cursor-pointer"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                activeCategory === cat.id
                  ? "bg-zinc-900 dark:bg-rose-500 text-white dark:text-white border-zinc-900 dark:border-rose-500 shadow-md cursor-pointer"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-stone-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-500 hover:text-rose-500 hover:shadow-sm cursor-pointer"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ——— Product Grid ——— */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredItems.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* ——— Empty State ——— */
          <div className="text-center py-24 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-stone-100 dark:border-zinc-800 shadow-sm max-w-2xl mx-auto flex flex-col items-center transition-colors duration-300">
            <span className="text-5xl mb-5" role="img" aria-label="Cupcake">
              🧁
            </span>
            <h3 
              className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-2xl mb-3 transition-colors duration-300"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              Nothing Here Yet
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed max-w-sm mb-6 transition-colors duration-300">
              We couldn&apos;t find any products in this category at the moment. 
              Our bakers are always testing new recipes!
            </p>
            <button
              onClick={() => setActiveCategory("all")}
              className="text-rose-500 font-bold hover:text-rose-600 transition-colors inline-flex items-center gap-2 border-b-2 border-rose-200 hover:border-rose-500 pb-0.5 cursor-pointer"
            >
              View All Cakes <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
