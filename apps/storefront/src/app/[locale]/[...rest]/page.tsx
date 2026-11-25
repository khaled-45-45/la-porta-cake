import { notFound } from 'next/navigation';

// Any unknown path under /ar or /en shows the localized "page not found".
export default function UnknownPage() {
  notFound();
}
