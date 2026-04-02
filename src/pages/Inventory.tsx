import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FiAlertTriangle } from "react-icons/fi";

interface InventoryRow {
  product_id: string;
  quantity: number;
  reserved: number;
  low_stock_alert: number;
  is_unlimited: boolean;
  product: { name: string; sku: string } | null;
  primary_image: string;
}

export default function Inventory() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("product_inventory")
      .select("*, product:products(name, sku, product_media(url, is_primary))")
      .order("quantity", { ascending: true });

    const mapped = (data ?? []).map((r: Record<string, unknown>) => {
      const product = r.product as {
        name: string;
        sku: string;
        product_media: { url: string; is_primary: boolean }[];
      } | null;
      const media = product?.product_media ?? [];
      const primary = media.find((m) => m.is_primary) ?? media[0];
      return {
        ...r,
        product: product ? { name: product.name, sku: product.sku } : null,
        primary_image: primary?.url ?? "",
      } as unknown as InventoryRow;
    });
    setRows(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateQty(productId: string, field: string, val: number) {
    await supabase
      .from("product_inventory")
      .update({ [field]: val })
      .eq("product_id", productId);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Inventory</h2>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3 text-right">Reserved</th>
              <th className="px-4 py-3 text-right">Low Stock Alert</th>
              <th className="px-4 py-3 text-center">Unlimited</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  No inventory data.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const lowStock = r.quantity <= (r.low_stock_alert ?? 5);
                return (
                  <tr
                    key={r.product_id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.primary_image ?? ""}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover bg-gray-100"
                        />
                        <span className="font-medium">
                          {r.product?.name ?? r.product_id.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.product?.sku ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        defaultValue={r.quantity}
                        onBlur={(e) =>
                          updateQty(
                            r.product_id,
                            "quantity",
                            Number(e.target.value),
                          )
                        }
                        className="w-20 rounded border border-border px-2 py-1 text-right text-sm focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {r.reserved}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        defaultValue={r.low_stock_alert ?? 5}
                        onBlur={(e) =>
                          updateQty(
                            r.product_id,
                            "low_stock_alert",
                            Number(e.target.value),
                          )
                        }
                        className="w-20 rounded border border-border px-2 py-1 text-right text-sm focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.is_unlimited ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {r.is_unlimited ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lowStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <FiAlertTriangle size={12} /> Low
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
