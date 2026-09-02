import { AdminShell } from "../../../components/AdminShell";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Add product</h1>
        <p className="mt-1 text-slate-500">Create a new spare part or accessory listing.</p>

        <div className="mt-6">
          <ProductForm mode="create" />
        </div>
      </div>
    </AdminShell>
  );
}
