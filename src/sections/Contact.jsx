import { MapPin, Phone, Clock, Camera, MessageCircle, Store } from "lucide-react";

// ─── Contact data ─────────────────────────────────────────────────────────────
// TODO: Replace placeholder href values with real links before going live.

const INFO_CARDS = [
  {
    id: "location",
    icon: MapPin,
    title: "Our Location",
    lines: ["Sweifieh, Amman", "Jordan"],
    // TODO: Replace with real Google Maps link
    href: "#",
    linkLabel: "Open in Maps",
  },
  {
    id: "phone",
    icon: Phone,
    title: "Call or WhatsApp",
    lines: ["+962 7X XXX XXXX"],
    // TODO: Replace with real phone number
    href: "tel:+962700000000",
    linkLabel: "Call Us",
  },
  {
    id: "hours",
    icon: Clock,
    title: "Opening Hours",
    lines: [
      "Mon – Fri: 9:00 AM – 9:00 PM",
      "Sat – Sun: 10:00 AM – 10:00 PM",
    ],
    href: null,
    linkLabel: null,
  },
  {
    id: "social",
    icon: Camera,
    title: "Follow Along",
    lines: ["@laporta.cake"],
    // TODO: Replace with real Instagram URL
    href: "https://www.instagram.com/",
    linkLabel: "@laporta.cake",
  },
];

export default function Contact() {
  return (
    <section
      id="contact"
      className="bg-white dark:bg-zinc-950 transition-colors duration-300 py-16 md:py-24 px-4"
    >
      <div className="max-w-7xl mx-auto">

        {/* ——— Section header ——— */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-rose-500 text-xs font-bold uppercase tracking-widest mb-3">
            Come Find Us
          </span>

          <h2
            className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mb-4 transition-colors duration-300"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            Visit &amp; Pick Up
          </h2>

          <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed transition-colors duration-300">
            All orders are freshly prepared for in-store pickup. Place yours
            online, then come collect at our Amman boutique — we&apos;ll have
            it boxed and ready.
          </p>
        </div>

        {/* ——— Two-column layout ——— */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* ——— Left: Info cards ——— */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {INFO_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className="bg-stone-50 dark:bg-zinc-900/80 border border-stone-100 dark:border-zinc-800 rounded-3xl p-6 flex flex-col gap-3 hover:shadow-md dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer"
                >
                  {/* Icon */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 ring-1 ring-rose-100 dark:ring-rose-500/30 group-hover:bg-rose-500 group-hover:ring-rose-500 transition-colors duration-300">
                    <Icon className="h-5 w-5 text-rose-400 group-hover:text-white transition-colors duration-300" strokeWidth={1.75} />
                  </div>

                  {/* Title */}
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-400">
                    {card.title}
                  </p>

                  {/* Lines */}
                  <div className="flex flex-col gap-0.5">
                    {card.lines.map((line, i) => (
                      <span key={i} className="text-zinc-700 dark:text-zinc-300 text-sm font-medium leading-snug transition-colors duration-300">
                        {line}
                      </span>
                    ))}
                  </div>

                  {/* Optional link */}
                  {card.href && card.linkLabel && (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors duration-200 cursor-pointer"
                    >
                      {card.linkLabel}
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* ——— Right: Pickup promo + CTAs ——— */}
          <div className="flex flex-col justify-center gap-8">
            {/* Pickup blurb */}
            <div className="bg-rose-50 dark:bg-zinc-900/80 rounded-3xl p-8 border border-rose-100 dark:border-zinc-800 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500 shadow-md shadow-rose-300/40">
                  <Store className="h-5 w-5 text-white" strokeWidth={1.75} />
                </div>
                <p className="text-zinc-900 dark:text-stone-50 font-bold text-lg transition-colors duration-300">
                  Take-Away Boutique
                </p>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed transition-colors duration-300">
                La Porta Cake is a take-away bakery boutique. We do not offer
                dine-in seating. All orders are prepared fresh and packaged
                beautifully for you to enjoy anywhere you like. Pre-order online
                for a guaranteed pickup slot.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              {/* Primary — WhatsApp */}
              <a
                href="https://wa.me/962700000000" // TODO: Replace with real WhatsApp number
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-7 rounded-full shadow-lg hover:shadow-rose-200 dark:hover:shadow-rose-900/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2} />
                Order on WhatsApp
              </a>

              {/* Secondary — Directions */}
              <a
                href="#" // TODO: Replace with real Google Maps directions link
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border-2 border-rose-400 text-rose-500 hover:bg-rose-500 hover:text-white font-bold py-4 px-7 rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-200 dark:hover:shadow-rose-900/30 active:translate-y-0 cursor-pointer"
              >
                <MapPin className="h-5 w-5" strokeWidth={2} />
                Get Directions
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
