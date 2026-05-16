import { useState } from "react";
import { useCart } from "../../hooks/useCart";
import { useCartDrawer } from "../../hooks/useCartDrawer";
import ThemeToggle from "../ui/ThemeToggle";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Menu", to: "/menu" },
  { label: "How it Works", to: "/#how-it-works" },
  { label: "Contact", to: "/#contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { totalItems } = useCart();
  const { openCart } = useCartDrawer();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* ——— Logo ——— */}
        <Link to="/" className="flex items-center gap-1 select-none cursor-pointer">
          <span className="text-xl font-extrabold tracking-widest text-rose-400">
            LA&nbsp;PORTA
          </span>
          <span className="text-xl font-light tracking-widest text-zinc-900 dark:text-stone-50">
            CAKE
          </span>
        </Link>

        {/* ——— Desktop Links ——— */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                className="text-sm font-medium text-zinc-600 dark:text-stone-300 transition-colors duration-200 hover:text-rose-400 cursor-pointer"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ——— Right section: Cart + Mobile toggle ——— */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {/* Cart icon with badge */}
          <button
            type="button"
            onClick={openCart}
            className="relative text-zinc-600 dark:text-stone-300 transition-colors duration-200 hover:text-rose-400 cursor-pointer"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden text-zinc-600 dark:text-stone-300 transition-colors duration-200 hover:text-rose-400 cursor-pointer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* ——— Mobile Dropdown ——— */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-1 px-4 pb-4">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 dark:text-stone-300 transition-colors duration-200 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-rose-400 cursor-pointer"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
