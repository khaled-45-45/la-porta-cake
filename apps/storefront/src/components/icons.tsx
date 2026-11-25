// Line icons from the prototype. Decorative: the text next to them carries the meaning.

interface IconProps {
  className?: string;
}

/** The doorway mark of the La Porta logo. */
export function DoorwayMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 30 38"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 37V15a13 13 0 0 1 26 0v22" />
      <path d="M8 37V16a7 7 0 0 1 14 0v21" />
      <path d="M1 37h28" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3.5 20.5l1.3-3.8a8.5 8.5 0 1 1 3.1 3l-4.4.8z" />
      <path d="M9 9.2c.2 2.4 2.6 5 5.4 5.6l1.2-1.3-1.8-1-.9.6c-.9-.4-1.8-1.3-2.2-2.2l.6-.9-1-1.8L9 9.2z" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}
