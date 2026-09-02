import { Button, ProductCard, SectionHeading } from "@khalsa-ev/ui";

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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-lg font-black text-white">K</div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Khalsa EV</div>
              <div className="text-sm text-slate-500">Genuine spare parts</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 lg:flex">
            <a href="#shop">Shop</a>
            <a href="#categories">Categories</a>
            <a href="#fitment">Vehicle fitment</a>
            <a href="#offers">Offers</a>
            <a href="#support">Support</a>
          </nav>

          <div className="flex items-center gap-2">
            <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Search</button>
            <Button variant="secondary">Wishlist</Button>
            <Button>Cart (3)</Button>
          </div>
        </div>
      </header>

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
            <Button>Shop now</Button>
            <Button variant="secondary">Find my fitment</Button>
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
                <Button className="w-full">Check compatibility</Button>
              </div>
            </div>
          </div>
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

      <footer id="support" className="bg-brand-charcoal py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-lg font-black text-white">K</div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Khalsa EV</div>
                <div className="text-sm text-slate-300">Genuine spare parts</div>
              </div>
            </div>
            <p className="mt-5 max-w-xs text-slate-300">
              Premium electric vehicle spare parts and accessories designed for reliability, safety, and performance.
            </p>
          </div>

          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Company</div>
            <ul className="mt-4 space-y-2 text-slate-300">
              <li>About</li>
              <li>Contact</li>
              <li>Support</li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Services</div>
            <ul className="mt-4 space-y-2 text-slate-300">
              <li>Returns</li>
              <li>Warranty</li>
              <li>Bulk orders</li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Reach us</div>
            <ul className="mt-4 space-y-2 text-slate-300">
              <li>+91 18001210259</li>
              <li>info@khalsaev.com</li>
              <li>Muzaffarnagar, UP</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
