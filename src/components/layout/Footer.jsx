import { MapPin, Camera, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Menu", to: "/menu" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Contact", to: "/#contact" },
];

const SOCIAL_LINKS = [
  {
    id: "instagram",
    icon: Camera,
    label: "Instagram",
    href: null,
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp",
    href: null,
  },
];

const logoSrc = "/favicon.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--footer-bg)] text-stone-700 dark:text-stone-200 border-t border-rose-200/50 dark:border-rose-800/30">

      {/* ——— Main footer body ——— */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">

          {/* ——— Brand column ——— */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Wordmark */}
            <Link to="/" className="flex items-center gap-3 select-none w-fit cursor-pointer">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff7ef] p-0.5 shadow-sm ring-1 ring-[#C98790]/35 dark:bg-[#f7e8df] dark:ring-[#E0A0AA]/50">
                <img
                  src={logoSrc}
                  alt="La Porta Cake logo"
                  className="h-full w-full rounded-full object-contain"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-serif text-sm font-bold uppercase tracking-[0.26em] text-stone-900 dark:text-white">
                  LA PORTA
                </span>
                <span className="mt-1.5 font-serif text-xs font-bold uppercase tracking-[0.32em] text-[#C98790] dark:text-[#E0A0AA]">
                  CAKE
                </span>
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-xs">
              Handcrafted cakes &amp; pastries, baked fresh every morning in
              Amman, Jordan. Order online for pickup or delivery.
            </p>

            {/* Social icons */}
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map(({ id, icon: Icon, label, href }) =>
                  href ? (
                    <a
                      key={id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-stone-500 transition-all duration-300 hover:bg-[#C98790] hover:text-white dark:bg-white/10 dark:text-stone-300 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </a>
                  ) : (
                    <span
                      key={id}
                      aria-label={`${label} details will be added before launch`}
                      aria-disabled="true"
                      title={`${label} details will be added before launch`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-stone-400 dark:bg-white/10 dark:text-stone-500 cursor-not-allowed"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  )
                )}
              </div>
              <p className="text-xs leading-relaxed text-stone-400 dark:text-stone-500">
                Social and WhatsApp details will be added before launch.
              </p>
            </div>
          </div>

          {/* ——— Quick links ——— */}
          <div className="flex flex-col gap-4">
            <p className="text-stone-900 dark:text-white text-xs font-bold uppercase tracking-widest">
              Quick Links
            </p>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-stone-500 dark:text-stone-400 text-sm hover:text-[#C98790] transition-colors duration-200 cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ——— Pickup info ——— */}
          <div className="flex flex-col gap-4">
            <p className="text-stone-900 dark:text-white text-xs font-bold uppercase tracking-widest">
              Visit &amp; Delivery Info
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#C98790] mt-0.5 shrink-0" strokeWidth={1.75} />
                <span className="text-stone-500 dark:text-stone-400 text-sm leading-snug">
                  Sweifieh, Amman<br />Jordan
                </span>
              </div>

              <div className="text-stone-500 dark:text-stone-400 text-sm leading-snug pl-6">
                <p className="font-medium text-stone-800 dark:text-stone-200 mb-0.5">Hours</p>
                <p>Mon – Fri: 9 AM – 9 PM</p>
                <p>Sat – Sun: 10 AM – 10 PM</p>
              </div>

              <span
                aria-disabled="true"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-stone-400 dark:text-stone-500 cursor-not-allowed"
              >
                Directions coming soon
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ——— Bottom bar ——— */}
      <div className="border-t border-rose-200/50 dark:border-rose-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <p>© {year} La Porta Cake. All rights reserved.</p>
          <p>Bakery boutique · Amman, Jordan · Pickup &amp; delivery</p>
        </div>
      </div>

    </footer>
  );
}
