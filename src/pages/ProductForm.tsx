import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface Category {
  id: string;
  name: string;
}
interface Brand {
  id: string;
  name: string;
}

const EMPTY = {
  name: "",
  slug: "",
  sku: "",
  short_desc: "",
  description: "",
  base_price: 0,
  sale_price: null as number | null,
  currency: "TZS",
  weight_grams: null as number | null,
  tags: "[]",
  is_active: true,
  is_featured: false,
  category_id: "",
  brand_id: "",
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const [catRes, brandRes] = await Promise.all([
        supabase.from("categories").select("id, name").order("sort_order"),
        supabase.from("brands").select("id, name").order("sort_order"),
      ]);
      setCategories(catRes.data ?? []);
      setBrands(brandRes.data ?? []);

      if (isEdit) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setForm({
            name: data.name ?? "",
            slug: data.slug ?? "",
            sku: data.sku ?? "",
            short_desc: data.short_desc ?? "",
            description: data.description ?? "",
            base_price: data.base_price ?? 0,
            sale_price: data.sale_price,
            currency: data.currency ?? "TZS",
            weight_grams: data.weight_grams,
            tags: JSON.stringify(data.tags ?? []),
            is_active: data.is_active ?? true,
            is_featured: data.is_featured ?? false,
            category_id: data.category_id ?? "",
            brand_id: data.brand_id ?? "",
          });
        }
      }
    })();
  }, [id, isEdit]);

  function set(key: string, val: unknown) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      sku: form.sku,
      short_desc: form.short_desc,
      description: form.description,
      base_price: Number(form.base_price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      currency: form.currency,
      weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
      tags: JSON.parse(form.tags || "[]"),
      is_active: form.is_active,
      is_featured: form.is_featured,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
    };

    let err;
    if (isEdit) {
      ({ error: err } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id));
    } else {
      ({ error: err } = await supabase.from("products").insert(payload));
    }

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate("/products");
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold">
        {isEdit ? "Edit Product" : "New Product"}
      </h2>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl bg-white p-6 shadow-sm"
      >
        {/* Name + SKU */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!isEdit) set("slug", slugify(e.target.value));
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">SKU</label>
            <input
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1 block text-sm font-medium">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Category + Brand */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              className={inputClass}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Brand</label>
            <select
              value={form.brand_id}
              onChange={(e) => set("brand_id", e.target.value)}
              className={inputClass}
            >
              <option value="">— None —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price + Old price */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Base Price (TZS)
            </label>
            <input
              type="number"
              required
              min={0}
              value={form.base_price}
              onChange={(e) => set("base_price", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sale Price</label>
            <input
              type="number"
              min={0}
              value={form.sale_price ?? ""}
              onChange={(e) =>
                set(
                  "sale_price",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Weight (grams)
            </label>
            <input
              type="number"
              min={0}
              value={form.weight_grams ?? ""}
              onChange={(e) =>
                set(
                  "weight_grams",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className={inputClass}
            />
          </div>
        </div>

        {/* Short description */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Short Description
          </label>
          <input
            value={form.short_desc}
            onChange={(e) => set("short_desc", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Tags JSON */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Tags (JSON array)
          </label>
          <input
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder='["Best Seller","New"]'
            className={inputClass}
          />
        </div>

        {/* Toggles */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => set("is_featured", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Featured
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {saving ? "Saving…" : isEdit ? "Update Product" : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
