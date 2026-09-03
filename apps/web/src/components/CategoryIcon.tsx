// Emoji glyphs matching the approved Figma reference's category icon
// language. Keyed by our real seeded category names (which differ
// slightly in wording from the mockup's placeholder taxonomy).
const ICONS: Record<string, string> = {
  batteries: "🔋",
  motors: "⚙️",
  controllers: "🎛️",
  chargers: "🔌",
  brakes: "🛑",
  suspension: "🔩",
  tyres: "🛞",
  lights: "💡",
  "electrical components": "⚡",
  "body parts": "🪖",
  accessories: "🎒",
  "electric scooters": "🛵",
};

const DEFAULT_ICON = "🔧";

export function categoryIcon(name: string): string {
  return ICONS[name.trim().toLowerCase()] ?? DEFAULT_ICON;
}

export function CategoryIcon({ name, className = "text-xl" }: { name: string; className?: string }) {
  return <span className={className}>{categoryIcon(name)}</span>;
}
