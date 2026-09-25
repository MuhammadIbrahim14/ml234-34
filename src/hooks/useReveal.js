import { useEffect } from "react";

/** Instant visibility — no scroll-wait. */
export default function useReveal() {
  useEffect(() => {
    document.querySelectorAll(".ml .reveal").forEach((el) => el.classList.add("in"));
  }, []);
}
