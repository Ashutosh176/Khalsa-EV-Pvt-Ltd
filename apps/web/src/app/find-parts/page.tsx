import { Suspense } from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { FindPartsFinder } from "./FindPartsFinder";

export const metadata = {
  title: "Find Parts for Your Vehicle | Khalsa EV",
  description: "Select your vehicle brand, model, and variant to see compatible EV spare parts.",
};

export default function FindPartsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Vehicle compatibility finder</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-brand-ink sm:text-4xl">
          Find parts for your vehicle
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Select your vehicle brand, model, and variant to see every spare part we stock that fits it.
        </p>

        <Suspense fallback={null}>
          <FindPartsFinder />
        </Suspense>
      </div>

      <Footer />
    </main>
  );
}
