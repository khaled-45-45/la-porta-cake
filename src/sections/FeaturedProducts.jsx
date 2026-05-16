import { menuItems } from "../data/menuItems";
import ProductCard from "../components/ui/ProductCard";
import { Link } from "react-router-dom";

/* Show only items explicitly marked as featured */
const FEATURED = menuItems.filter((item) => item.featured);

export default function FeaturedProducts() {
  return (
    <section id="menu" className="bg-white dark:bg-zinc-950 transition-colors duration-300 py-16 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">

        {/* ——— Section header ——— */}
        <div className="text-center mb-12 md:mb-16">
          {/* Eyebrow */}
          <span className="inline-block text-rose-500 text-xs font-bold uppercase tracking-widest mb-3">
            From Our Kitchen
          </span>

          <h2
            className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mb-4 transition-colors duration-300"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            Featured Cakes
          </h2>

          <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed transition-colors duration-300">
            A handpicked selection of our most-loved bakery creations — crafted
            fresh, every single day.
          </p>
        </div>

        {/* ——— Product grid ——— */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {FEATURED.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* ——— CTA ——— */}
        <div className="mt-12 md:mt-16 text-center">
          <Link
            to="/menu"
            className="inline-block border-2 border-rose-400 text-rose-500 hover:bg-rose-500 hover:text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-200 dark:hover:shadow-rose-900/30 cursor-pointer"
          >
            View Full Menu
          </Link>
        </div>

      </div>
    </section>
  );
}
