import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    let timeoutId;

    if (hash) {
      // Small timeout ensures the DOM has updated before scrolling
      timeoutId = setTimeout(() => {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 0);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname, hash]);

  return null;
}
