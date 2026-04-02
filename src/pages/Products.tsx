import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, formatTZS } from "../lib/supabase";
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";

interface Product {
  id: string;
  name: string;
  sku: string;
  base_price: number;
  sale_price: number | null;
  is_active: boolean;
  is_featured: boolean;
  primary_image: string;
  category: { name: string } | null;
  brand: { name: string } | null;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, sku, base_price, sale_price, is_active, is_featured, category:categories(name), brand:brands(name), product_media(url, is_primary)",
      )
      .order("created_at", { ascending: false });

    const mapped = (data ?? []).map((p: Record<string, unknown>) => {
      const media =
        (p.product_media as { url: string; is_primary: boolean }[]) ?? [];
      const primary = media.find((m) => m.is_primary) ?? media[0];
      return {
        ...p,
        primary_image: primary?.url ?? "",
      } as unknown as Product;
    });
    setProducts(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(id: string, current: boolean) {
    await supabase
      .from("products")
      .update({ is_active: !current })
      .eq("id", id);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p)),
    );
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Products</h2>
        <Link
          to="/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition"
        >
          <FiPlus size={16} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-center">Featured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  No products found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.primary_image}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover bg-gray-100"
                      />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.category?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.brand?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatTZS(p.base_price)}
                    {p.sale_price && (
                      <span className="ml-1 text-xs text-emerald-600">
                        Sale: {formatTZS(p.sale_price)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(p.id, p.is_active)}
                      className={`inline-block h-5 w-10 rounded-full transition ${
                        p.is_active ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition ${
                          p.is_active ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.is_featured && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        ★
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Link
                        to={`/products/${p.id}/edit`}
                        className="rounded-lg p-2 text-gray-400 hover:bg-muted hover:text-primary transition"
                      >
                        <FiEdit2 size={16} />
                      </Link>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
