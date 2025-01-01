import { useRef, useEffect, useState } from "react";

export function useIntersectionObserver<T extends HTMLElement>({
  threshold = 0,
  rootMargin = "0px",
}) {
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [elementRef, threshold, rootMargin]);

  return { elementRef, isVisible };
}
