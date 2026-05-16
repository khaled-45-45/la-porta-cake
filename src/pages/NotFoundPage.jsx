import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center py-24 px-4 text-center transition-colors duration-300">
      <h1 className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-5xl md:text-6xl mb-6 transition-colors duration-300">
        Page Not Found
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md mx-auto mb-10 leading-relaxed transition-colors duration-300">
        We&apos;re sorry, but the page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl dark:hover:shadow-rose-900/30 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
      >
        Return to Home
      </Link>
    </div>
  );
}
