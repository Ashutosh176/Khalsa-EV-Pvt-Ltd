import type { ReactNode } from "react";

const ICONS: Record<string, ReactNode> = {
  batteries: (
    <>
      <rect x="4" y="7" width="14" height="11" rx="1.5" />
      <path d="M18 10h1.5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H18" />
      <path d="M8 10.5v4M11 10.5v4" />
    </>
  ),
  motors: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.8 5.8l1.8 1.8M16.4 16.4l1.8 1.8M5.8 18.2l1.8-1.8M16.4 7.6l1.8-1.8" />
    </>
  ),
  controllers: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9.5h8M8 12.5h5M8 15.5h3" />
    </>
  ),
  chargers: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M13 8l-3 4h3l-3 4" />
    </>
  ),
  brakes: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.75" />
      <path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20" />
    </>
  ),
  suspension: (
    <>
      <path d="M8 3v4M16 17v4" />
      <path d="M8 7l8 2M8 9l8-2M8 11l8 2M8 13l8-2M8 15l8 2M8 17l8-2" />
    </>
  ),
  tyres: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" />
    </>
  ),
  lights: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.45.9 1.15.9 1.9V16h5.4v-.3c0-.75.3-1.45.9-1.9A6 6 0 0 0 12 3Z" />
    </>
  ),
  "electrical components": (
    <>
      <path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z" />
    </>
  ),
  "body parts": (
    <>
      <path d="M4 16c0-5 3.5-9 8-9s8 4 8 9" />
      <path d="M4 16h16v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2Z" />
      <circle cx="8" cy="17.5" r="1.2" />
      <circle cx="16" cy="17.5" r="1.2" />
    </>
  ),
  accessories: (
    <>
      <path d="M10.5 6.5a2.5 2.5 0 1 1 3.9 2.06L21 15.15V21h-5.85L8.44 13.4A2.5 2.5 0 1 1 6.5 9.5" />
    </>
  ),
  "electric scooters": (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M6 18h6l1-9h4M13 9h3.5M9 5h3l1 4" />
    </>
  ),
  default: (
    <>
      <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L14.7 9.7 12 7l2.7-2.7Z" />
    </>
  ),
};

export function CategoryIcon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  const path = ICONS[name.trim().toLowerCase()] ?? ICONS.default;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {path}
    </svg>
  );
}
