const ITEMS: [string, string, string][] = [
  ["⚙️", "100% Genuine Parts", "Original & Authentic"],
  ["↩️", "7 Days Easy Returns", "No questions asked"],
  ["🚚", "Fast Delivery Across India", "Pan India Delivery"],
  ["🛡️", "Secure Payment", "100% Safe & Secure"],
];

export function TrustStrip() {
  return (
    <div className="flex flex-col gap-6 bg-brand-green-light px-4 py-4 sm:flex-row sm:gap-0 sm:px-7">
      {ITEMS.map(([icon, title, sub]) => (
        <div key={title} className="flex flex-1 items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <div>
            <div className="text-xs font-bold text-brand-ink">{title}</div>
            <div className="text-[10.8px] text-brand-sub">{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
