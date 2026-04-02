import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from "react-icons/fi";

interface Brand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  image_url: string;
}

export default function Brands() {
  const [rows, setRows] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", image_url: "" });
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("brands")
      .select("*")
      .order("sort_order");
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleAdd() {
    if (!form.name.trim()) return;
    await supabase.from("brands").insert({
      name: form.name,
      slug: form.slug || slugify(form.name),
      image_url: form.image_url,
      is_active: true,
      sort_order: rows.length + 1,
    });
    setForm({ name: "", slug: "", image_url: "" });
    setAdding(false);
    load();
  }

  async function handleUpdate(id: string) {
    await supabase
      .from("brands")
      .update({
        name: form.name,
        slug: form.slug,
        image_url: form.image_url,
      })
      .eq("id", id);
    setEditId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this brand?")) return;
    await supabase.from("brands").delete().eq("id", id);
    load();
  }

  async function toggleActive(id: string, val: boolean) {
    await supabase.from("brands").update({ is_active: !val }).eq("id", id);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !val } : r)),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Brands</h2>
        <button
          onClick={() => {
            setAdding(true);
            setForm({ name: "", slug: "", image_url: "" });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition"
        >
          <FiPlus size={16} /> Add Brand
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-center">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="border-b border-border bg-primary/5">
                <td className="px-4 py-2">
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Brand name"
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="slug"
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </td>
                <td />
                <td />
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={handleAdd}
                    className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                  >
                    <FiCheck size={18} />
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded ml-1"
                  >
                    <FiX size={18} />
                  </button>
                </td>
              </tr>
            )}
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  No brands yet.
                </td>
              </tr>
            ) : (
              rows.map((r) =>
                editId === r.id ? (
                  <tr
                    key={r.id}
                    className="border-b border-border bg-primary/5"
                  >
                    <td className="px-4 py-2">
                      <input
                        autoFocus
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full rounded border border-border px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={form.slug}
                        onChange={(e) =>
                          setForm({ ...form, slug: e.target.value })
                        }
                        className="w-full rounded border border-border px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td />
                    <td />
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleUpdate(r.id)}
                        className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                      >
                        <FiCheck size={18} />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded ml-1"
                      >
                        <FiX size={18} />
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.slug}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(r.id, r.is_active)}
                        className={`inline-block h-5 w-10 rounded-full transition ${r.is_active ? "bg-emerald-500" : "bg-gray-300"}`}
                      >
                        <span
                          className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition ${r.is_active ? "translate-x-5" : "translate-x-1"}`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {r.sort_order}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditId(r.id);
                          setForm({
                            name: r.name,
                            slug: r.slug,
                            image_url: r.image_url,
                          });
                        }}
                        className="rounded-lg p-2 text-gray-400 hover:bg-muted hover:text-primary transition"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
