import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <div className="max-w-xl space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold">Account</h3>
          <p className="mt-1 text-sm text-gray-500">
            Signed in as{" "}
            <span className="font-medium text-gray-900">{user?.email}</span>
          </p>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold">Supabase Project</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-gray-500">URL</dt>
              <dd className="break-all text-gray-700">
                {import.meta.env.VITE_SUPABASE_URL}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold">Platform</h3>
          <p className="mt-1 text-sm text-gray-500">
            Oscar Mkatoliki &mdash; Catholic faith companion for Tanzania.
            <br />
            Store categories: Music, Books, Rosaries, Statues, Candles, Apparel,
            Gifts, Children's, Jewelry, Sacramentals
          </p>
        </div>
      </div>
    </div>
  );
}
