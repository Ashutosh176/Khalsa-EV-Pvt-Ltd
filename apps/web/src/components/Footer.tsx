export function Footer() {
  return (
    <footer id="support" className="bg-brand-charcoal py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-lg font-black text-white">
              K
            </div>
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
            <li>Toll Free: 18001210259</li>
            <li>infor@khalsaev.com</li>
            <li>Plot no. 130/1 and 130/2, Pachenda Road, Village Mustafabad, Muzaffarnagar, UP - 251001</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
