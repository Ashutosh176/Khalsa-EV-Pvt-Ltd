"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/hero-scooter-1.png", alt: "Khalsa EV electric scooter parked at a night showroom with city skyline" },
  { src: "/hero-scooter-2.png", alt: "Khalsa EV electric scooter beside a lake at sunrise with city skyline" },
  { src: "/hero-scooter-3.png", alt: "Khalsa EV electric scooter on a hilltop terrace overlooking mountains at sunset" },
  { src: "/hero-scooter-4.png", alt: "Khalsa EV electric scooter on a terrace at dusk with city skyline" },
];

const AUTOPLAY_MS = 5500;
const TRANSITION_MS = 800;

// Right-to-left autoplay carousel for the Electric Scooters hero background
// (Section 60 follow-up). A clone of the first slide is appended after the
// last one so slide 4 -> slide 1 slides left like every other transition
// instead of snapping backwards - once that clone finishes sliding in, the
// track jumps (transition-free, imperceptible since the clone is identical)
// back to the real first slide so the loop is seamless indefinitely.
export function ScooterHeroCarousel() {
  const [index, setIndex] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const [paused, setPaused] = useState(false);

  const slideCount = SLIDES.length;
  // SLIDES is a fixed non-empty literal, so this first element always exists.
  const trackSlides = [...SLIDES, SLIDES[0]!];

  const goTo = useCallback((next: number) => {
    setWithTransition(true);
    setIndex(next);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => i + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused]);

  // Re-arms the transition one frame after a transition-free snap - doing
  // it synchronously with the snap would let React batch both style changes
  // into the same paint, animating the snap itself (visually sliding
  // backwards) instead of leaving it instant as intended.
  useEffect(() => {
    if (withTransition) return;
    const raf = requestAnimationFrame(() => setWithTransition(true));
    return () => cancelAnimationFrame(raf);
  }, [withTransition]);

  function handleTransitionEnd() {
    if (index === slideCount) {
      // Snap back to the real first slide with no transition - happens on
      // the frame right after the clone has fully slid into view, so it's
      // invisible to the viewer.
      setWithTransition(false);
      setIndex(0);
    }
  }

  function handleDotClick(target: number) {
    goTo(target);
  }

  const activeDot = index % slideCount;

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full"
        style={{
          width: `${trackSlides.length * 100}%`,
          transform: `translateX(-${(index * 100) / trackSlides.length}%)`,
          transition: withTransition ? `transform ${TRANSITION_MS}ms cubic-bezier(0.65, 0, 0.35, 1)` : "none",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {trackSlides.map((slide, i) => (
          <div key={`${slide.src}-${i}`} className="relative h-full shrink-0" style={{ width: `${100 / trackSlides.length}%` }}>
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i < slideCount}
              sizes="100vw"
              className="object-cover object-[68%_center] sm:object-[62%_center] lg:object-center"
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-3.5 z-20 flex justify-center gap-2 sm:bottom-5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === activeDot}
            onClick={() => handleDotClick(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeDot ? "w-5 bg-brand-green" : "w-1.5 bg-white/60 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
