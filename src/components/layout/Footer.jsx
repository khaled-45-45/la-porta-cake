import { MapPin, Camera, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Menu", to: "/menu" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Contact", to: "/#contact" },
];

// TODO: Replace with real social URLs before going live.
const SOCIAL_LINKS = [
  {
    id: "instagram",
    icon: Camera,
    label: "Instagram",
    href: "https://www.instagram.com/",
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp",
    href: "https://wa.me/962700000000",
  },
];

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
            <Link to="/" className="flex items-center gap-1 select-none w-fit cursor-pointer">
              <span className="text-xl font-extrabold tracking-widest text-[#C98790]">
                LA&nbsp;PORTA
              </span>
              <span className="text-xl font-light tracking-widest text-stone-900 dark:text-white">
                CAKE
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-xs">
              Handcrafted cakes &amp; pastries, baked fresh every morning in
              Amman, Jordan. Order online — collect in&nbsp;store.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-2">
              {SOCIAL_LINKS.map(({ id, icon: Icon, label, href }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-stone-500 dark:bg-white/10 dark:text-stone-300 hover:bg-[#C98790] hover:text-white transition-all duration-300 cursor-pointer"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ))}
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
              Pickup Info
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

              <a
                href="#" // TODO: Replace with real Google Maps link
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#C98790] hover:text-[#D89AA3] transition-colors duration-200 cursor-pointer"
              >
                Get Directions →
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* ——— Bottom bar ——— */}
      <div className="border-t border-rose-200/50 dark:border-rose-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <p>© {year} La Porta Cake. All rights reserved.</p>
          <p>Take-away boutique · Amman, Jordan · Pickup only</p>
        </div>
      </div>

    </footer>
  );
}
