import Link from "next/link";
import { Button, ProductCard, SectionHeading } from "@khalsa-ev/ui";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

const categories = [
  { name: "Batteries & Packs", icon: "🔋" },
  { name: "Controllers", icon: "⚙️" },
  { name: "Brake Parts", icon: "🛞" },
  { name: "Lighting", icon: "💡" },
  { name: "Accessories", icon: "🧰" },
  { name: "Charging", icon: "🔌" },
];

const products = [
  { name: "Li-Ion Battery Pack 60V", price: 14999, originalPrice: 17999, badge: "Best Seller", rating: 4.9, reviewCount: 328, imageLabel: "🔋" },
  { name: "Smart Motor Controller", price: 8999, originalPrice: 10999, badge: "New", rating: 4.8, reviewCount: 214, imageLabel: "⚙️" },
  { name: "Brake Disc Set", price: 3199, originalPrice: 3999, badge: "Top Rated", rating: 4.7, reviewCount: 182, imageLabel: "🛞" },
  { name: "LED Headlamp Kit", price: 2699, originalPrice: 3499, badge: "Hot", rating: 4.9, reviewCount: 240, imageLabel: "💡" },
];

const features = [
  { title: "Vehicle-specific fitment", text: "Match parts to your exact EV model in seconds with compatibility filters." },
  { title: "Genuine quality", text: "Every product is selected for safety, reliability, and long-term performance." },
  { title: "Quick dispatch", text: "Fast order processing and reliable shipping for every spare part purchase." },
];

const testimonials = [
  { quote: "The part fit perfectly and the ordering experience was smooth from start to finish.", author: "Arjun S., Delhi" },
  { quote: "Clear compatibility checks saved me time and took the guesswork out of my battery upgrade.", author: "Raman P., Chandigarh" },
];

const offers = [
  { title: "Flat 10% off batteries", text: "On all Li-Ion and LFP battery packs this week.", code: "BATTERY10" },
  { title: "Free shipping over ₹2,999", text: "Applies automatically at checkout on eligible orders.", code: "FREESHIP" },
  { title: "Bundle & save on brake kits", text: "Buy a brake disc set with pads and save 8%.", code: "BRAKEBUNDLE" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <span className="w-fit rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-green">
            Trusted EV essentials
          </span>
          <h1 className="mt-6 max-w-xl text-5xl font-black tracking-tight text-brand-ink sm:text-6xl">
            Power every ride with genuine EV parts.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-slate-600">
            Upgrade batteries, controllers, brakes, lighting, and accessories with reliable compatibility guidance built for Indian EV riders.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/products">
              <Button>Shop now</Button>
            </Link>
            <Link href="/find-parts">
              <Button variant="secondary">Find my fitment</Button>
            </Link>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-black text-brand-ink">50k+</div>
              <div className="text-sm text-slate-600">happy riders</div>
            </div>
            <div>
              <div className="text-3xl font-black text-brand-ink">2,400+</div>
              <div className="text-sm text-slate-600">parts stocked</div>
            </div>
            <div>
              <div className="text-3xl font-black text-brand-ink">4.8/5</div>
              <div className="text-sm text-slate-600">average rating</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/40">
          <div className="rounded-[1.5rem] bg-[radial-gradient(circle_at_top,_#ecfdf5,_#eff7f1_40%,_#f7f7f7_100%)] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-green">
                EV fitment
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">LIVE</span>
            </div>

            <div className="mt-6 h-52 rounded-[1.5rem] bg-[linear-gradient(135deg,_#dff2d4,_#eff8eb)] p-5">
              <div className="flex h-full items-end justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Compatible model</div>
                  <div className="mt-3 text-3xl font-black text-brand-ink">Ather 450X</div>
                </div>
                <div className="text-7xl">⚡</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                "Battery pack compatible",
                "Controller matching kit",
                "Brake assembly ready",
              ].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <span>{item}</span>
                  <span className="font-bold text-brand-green">✓</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 text-center sm:grid-cols-4 sm:px-6 lg:px-8">
          {['2-day dispatch', 'Secure checkout', 'Local support', '1-year warranty'].map((metric) => (
            <div key={metric} className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{metric}</div>
          ))}
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Popular categories"
          title="Explore parts for every EV need"
          description="Browse the essentials riders trust when upgrading, repairing, and maintaining their electric vehicles."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.name} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-2xl">{category.icon}</div>
                <div className="text-lg font-bold text-brand-ink">{category.name}</div>
              </div>
              <span className="text-xl text-slate-400">→</span>
            </div>
          ))}
        </div>
      </section>

      <section id="shop" className="bg-slate-100/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Featured products"
              title="Top performance essentials"
              description="From battery upgrades to critical safety components, our best sellers are built for everyday reliability."
            />
            <Button variant="ghost" className="hidden md:inline-flex">View all products</Button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.name} {...product} />
            ))}
          </div>
        </div>
      </section>

      <section id="fitment" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-brand-charcoal p-8 text-white lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Smart fitment</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Find the right part for your EV in minutes.</h2>
              <p className="mt-4 max-w-xl text-slate-300">
                Enter your EV model, battery type, and usage pattern to see recommended replacements and compatible accessories.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5 text-brand-ink">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Select vehicle</div>
                  <div className="mt-2 text-lg font-bold">Ather 450X</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Compatible parts</div>
                  <div className="mt-2 text-lg font-bold">8 matches found</div>
                </div>
                <Link href="/find-parts">
                  <Button className="w-full">Check compatibility</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="offers" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Offers & promotions"
          title="Current deals for EV owners"
          description="Seasonal offers and bundle discounts, applied automatically or with a code at checkout."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {offers.map((offer) => (
            <div key={offer.title} className="rounded-3xl border border-dashed border-brand-green/40 bg-brand-green/5 p-7">
              <h3 className="text-lg font-bold text-brand-ink">{offer.title}</h3>
              <p className="mt-3 text-slate-600">{offer.text}</p>
              <div className="mt-5 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-green ring-1 ring-brand-green/30">
                {offer.code}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why Khalsa EV"
            title="Built for better parts buying"
            description="We combine product quality, technical guidance, and service support to make EV maintenance simple and dependable."
            align="center"
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-2xl">✓</div>
                <h3 className="mt-5 text-xl font-bold text-brand-ink">{feature.title}</h3>
                <p className="mt-3 text-slate-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Customer stories"
            title="Loved by EV owners across India"
            description="From battery upgrades to replacement parts, riders trust Khalsa EV for reliability and transparent support."
            align="center"
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {testimonials.map((item) => (
              <div key={item.author} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="text-3xl text-brand-green">“</div>
                <p className="mt-3 text-lg text-slate-700">{item.quote}</p>
                <div className="mt-5 font-bold text-brand-ink">{item.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
