import { useEffect, useState } from "react";
import { api, getStoredToken } from "../lib/api";

type Restaurant = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  users: Array<{ id: number; name: string; email: string }>;
};

export default function SuperAdmin() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: "",
    adminName: "",
    adminEmail: "",
    adminPassword: ""
  });

  const loadData = async () => {
    try {
      const token = getStoredToken();
      if (!token) return;
      const res = await fetch(import.meta.env.VITE_API_URL + "/super-admin/restaurants", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRestaurants(data.restaurants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getStoredToken();
      const res = await fetch(import.meta.env.VITE_API_URL + "/super-admin/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurant: { name: formData.restaurantName, isActive: true },
          admin: { name: formData.adminName, email: formData.adminEmail, password: formData.adminPassword }
        })
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ restaurantName: "", adminName: "", adminEmail: "", adminPassword: "" });
        loadData();
      } else {
        alert("Failed to create restaurant");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = getStoredToken();
      await fetch(import.meta.env.VITE_API_URL + "/super-admin/restaurants/" + id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Platform Tenants</h1>
            <p className="mt-1 text-sm text-neutral-400">Manage all restaurants and their root admin accounts.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:shadow-orange-500/40"
          >
            + Onboard Restaurant
          </button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-orange-500/50"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-xl font-bold text-white">{restaurant.name}</h3>
                  <button
                    onClick={() => toggleStatus(restaurant.id, restaurant.isActive)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      restaurant.isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {restaurant.isActive ? "Active" : "Suspended"}
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Root Admin</p>
                    <p className="mt-1 text-sm text-neutral-300">
                      {restaurant.users[0]?.name} ({restaurant.users[0]?.email})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined</p>
                    <p className="mt-1 text-sm text-neutral-300">
                      {new Date(restaurant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Tenant ID</p>
                    <p className="mt-1 font-mono text-xs text-neutral-400">{restaurant.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-8 shadow-2xl">
              <h2 className="mb-6 text-2xl font-bold text-white">Onboard New Restaurant</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-400">Restaurant Name</label>
                  <input
                    required
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition-colors focus:border-orange-500"
                  />
                </div>
                <div className="pt-4 border-t border-white/10">
                  <h3 className="mb-4 text-sm font-semibold text-neutral-300">Root Admin Account</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-400">Admin Name</label>
                      <input
                        required
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition-colors focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-400">Admin Email</label>
                      <input
                        required
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition-colors focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-400">Admin Password</label>
                      <input
                        required
                        type="password"
                        minLength={8}
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition-colors focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl bg-white/5 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-orange-500 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-400"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
