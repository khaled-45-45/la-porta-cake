import { ClipboardList, ShoppingBag, Store } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: ClipboardList,
    label: "Step 1",
    title: "Choose Your Cake",
    description:
      "Browse our handcrafted selection of cakes, tartlets, and cold sweets. Pick your favourites and customise your order — all from our menu.",
  },
  {
    id: 2,
    icon: ShoppingBag,
    label: "Step 2",
    title: "Place Your Order",
    description:
      "Add items to your cart, choose pickup or delivery, and send your order details through WhatsApp.",
  },
  {
    id: 3,
    icon: Store,
    label: "Step 3",
    title: "Confirm & Receive",
    description:
      "We confirm timing, fulfillment details, and any minimum non-refundable deposit before preparing your boxed treats.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-stone-50 dark:bg-zinc-950 transition-colors duration-300 py-16 md:py-24 px-4"
    >
      <div className="max-w-7xl mx-auto">

        {/* ——— Section header ——— */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-rose-500 text-xs font-bold uppercase tracking-widest mb-3">
            Simple &amp; Seamless
          </span>

          <h2
            className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mb-4 transition-colors duration-300"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            How It Works
          </h2>

          <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed transition-colors duration-300">
            Order your favourites online for scheduled pickup or local delivery
            — it really is that easy.
          </p>
        </div>

        {/* ——— Steps grid ——— */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10 relative">

          {/* Connector line — visible on md+ only */}
          <div
            className="hidden md:block absolute top-[72px] left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-rose-100 dark:bg-zinc-800 transition-colors duration-300"
            aria-hidden="true"
          />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="relative flex flex-col items-center text-center bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-stone-100 dark:border-zinc-800 hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Icon circle */}
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 ring-1 ring-rose-100 dark:ring-rose-500/30 transition-colors duration-300 group-hover:bg-rose-500 group-hover:ring-rose-500">
                    <Icon
                      className="h-9 w-9 text-rose-400 transition-colors duration-300 group-hover:text-white"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Step number badge */}
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-extrabold text-white shadow-md shadow-rose-300/40 dark:shadow-none ring-2 ring-white dark:ring-zinc-900 transition-colors duration-300">
                    {step.id}
                  </span>
                </div>

                {/* Label */}
                <span className="text-rose-400 text-xs font-bold uppercase tracking-widest mb-1">
                  {step.label}
                </span>

                {/* Title */}
                <h3 className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-xl mb-3 transition-colors duration-300"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed transition-colors duration-300">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
