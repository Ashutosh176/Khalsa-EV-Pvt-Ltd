import { Button, SectionHeading, StatCard } from "@khalsa-ev/ui";

const metrics = [
  { label: "Revenue", value: "₹18.4L", trend: "+12.4%" },
  { label: "Orders", value: "1,248", trend: "+8.1%" },
  { label: "Customers", value: "9,420", trend: "+15.2%" },
  { label: "Returns", value: "2.1%", trend: "-0.4%" },
];

const recentOrders = [
  { id: "KEV-1048", customer: "Saurabh Goyal", item: "Battery Pack", status: "Paid", value: "₹14,999" },
  { id: "KEV-1042", customer: "Aditi Sharma", item: "Controller Kit", status: "Packed", value: "₹8,999" },
  { id: "KEV-1038", customer: "Mohit Yadav", item: "Brake Set", status: "Shipped", value: "₹3,199" },
  { id: "KEV-1034", customer: "Pooja Nair", item: "LED Headlamp", status: "Refund", value: "₹2,699" },
];

const lowStock = [
  "Ather 450X battery terminal kit",
  "Smart controller 72V relay harness",
  "Front brake pad set for e-scooters",
];

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-lg font-black text-white">K</div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Khalsa EV</div>
              <div className="text-sm text-slate-500">Admin panel</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            <a href="#overview">Overview</a>
            <a href="#orders">Orders</a>
            <a href="#inventory">Inventory</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="secondary">Export</Button>
            <Button>New order</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Operations dashboard"
          title="Business overview"
          description="Track sales, inventory, and order health across your EV spare-parts store."
        />

        <div id="overview" className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <section id="orders" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-900">Recent orders</h3>
              <Button variant="ghost">View all</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Item</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-semibold text-slate-800">{order.id}</td>
                      <td className="py-3 text-slate-600">{order.customer}</td>
                      <td className="py-3 text-slate-600">{order.item}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800">{order.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside id="inventory" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Low stock alerts</h3>
            <div className="mt-5 space-y-3">
              {lowStock.map((item) => (
                <div key={item} className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-100 p-4">
              <div className="text-sm text-slate-500">Inventory health</div>
              <div className="mt-2 text-3xl font-black text-slate-900">94%</div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div className="h-full w-[94%] rounded-full bg-brand-green" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
