import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="bg-stone-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">

        {/* ——— Text Column (Left) ——— */}
        <div className="flex flex-col">
          <h1 className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 transition-colors duration-300">
            Artisan Cakes,{" "}
            <span className="text-rose-400 italic">Baked with Love.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl mb-8 leading-relaxed max-w-md transition-colors duration-300">
            Order your favorite premium cakes and desserts for pickup or
            delivery in Amman. Freshness in every bite.
          </p>

          <Link
            to="/menu"
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all inline-block w-fit hover:-translate-y-0.5 active:translate-y-0"
          >
            Explore Menu &amp; Order
          </Link>
        </div>

        {/* ——— Image Column (Right) ——— */}
        <div className="relative">
          {/* Decorative blob */}
          <div
            className="absolute inset-0 m-auto h-4/5 w-4/5 rounded-full bg-rose-100 dark:bg-rose-900/30 blur-3xl opacity-70 transition-colors duration-300"
            aria-hidden="true"
          />

          {/* Image container */}
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/5] md:aspect-auto md:h-[600px] w-full">
            <img
              src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=1089&q=80"
              alt="La Porta signature berry cake"
              className="object-cover h-full w-full transition-transform duration-700 hover:scale-105"
              loading="eager"
            />
          </div>

          {/* Floating price chip */}
          <div className="absolute bottom-6 left-4 sm:left-8 flex items-center gap-3 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-4 py-3 shadow-xl ring-1 ring-stone-100 dark:ring-zinc-800 transition-colors duration-300">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/20 text-lg transition-colors duration-300">
              🎂
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 transition-colors duration-300">
                Signature Cake
              </p>
              <p className="text-sm font-bold text-zinc-900 dark:text-stone-50 transition-colors duration-300">From 14.00 JOD</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
