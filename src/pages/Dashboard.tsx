import { useEffect, useState } from "react";
import { supabase, formatTZS } from "../lib/supabase";
import { FiBox, FiShoppingCart, FiHeart, FiDollarSign } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  products: number;
  categories: number;
  orders: number;
  donations: number;
  revenue: number;
}

const CARDS = [
  {
    key: "products" as const,
    label: "Products",
    icon: FiBox,
    color: "bg-violet-500",
  },
  {
    key: "orders" as const,
    label: "Orders",
    icon: FiShoppingCart,
    color: "bg-emerald-500",
  },
  {
    key: "donations" as const,
    label: "Donations",
    icon: FiHeart,
    color: "bg-rose-500",
  },
  {
    key: "revenue" as const,
    label: "Revenue",
    icon: FiDollarSign,
    color: "bg-amber-500",
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    categories: 0,
    orders: 0,
    donations: 0,
    revenue: 0,
  });
  const [recentProducts, setRecentProducts] = useState<
    { name: string; price: number }[]
  >([]);

  useEffect(() => {
    (async () => {
      const [prodRes, catRes, orderRes, donationRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, base_price", { count: "exact", head: false }),
        supabase
          .from("categories")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("id, total_amount", { count: "exact", head: false }),
        supabase
          .from("donations")
          .select("id, amount", { count: "exact", head: false }),
      ]);

      const products = prodRes.count ?? 0;
      const categories = catRes.count ?? 0;
      const orders = orderRes.count ?? 0;
      const donations = donationRes.count ?? 0;
      const allProducts = prodRes.data ?? [];
      const allOrders = orderRes.data ?? [];

      const totalRevenue = allOrders.reduce(
        (s, o) =>
          s + (((o as Record<string, unknown>).total_amount as number) ?? 0),
        0,
      );

      setStats({
        products,
        categories,
        orders,
        donations,
        revenue: totalRevenue,
      });

      setRecentProducts(
        allProducts.slice(0, 8).map((p) => ({
          name: ((p as Record<string, unknown>).name as string) ?? "?",
          price: ((p as Record<string, unknown>).base_price as number) ?? 0,
        })),
      );
    })();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <div
            key={c.key}
            className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.color} text-white`}
            >
              <c.icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold">
                {c.key === "revenue"
                  ? formatTZS(stats[c.key])
                  : stats[c.key].toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Product Prices Overview</h3>
        {recentProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recentProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip
                formatter={(v: number) => formatTZS(v)}
                contentStyle={{ borderRadius: 12 }}
              />
              <Bar dataKey="price" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400">No product data yet.</p>
        )}
      </div>
    </div>
  );
}
