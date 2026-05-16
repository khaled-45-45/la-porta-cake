/**
 * Badge — small pill label used for category tags on cards.
 * @param {{ children: React.ReactNode; className?: string }} props
 */
export default function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-block bg-white/90 backdrop-blur-sm text-rose-500 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}
