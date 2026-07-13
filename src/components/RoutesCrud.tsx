import React, { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Search, Filter, X, Check, Navigation, MapPin, Compass
} from "lucide-react";
import { Route } from "../types";

interface RoutesCrudProps {
  onRefreshAll?: () => void;
}

export default function RoutesCrud({ onRefreshAll }: RoutesCrudProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    distance: 280,
    duration: "5h 30m",
    stopsText: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res] = await Promise.all([
        fetch("/api/routes"),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      setRoutes(await res.json());
    } catch (err) {
      console.error("Failed to fetch routes CRUD data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRoute(null);
    setFormData({
      name: "Ahmedabad Hub ↔ Mumbai JNPT Corridor",
      distance: 520,
      duration: "9h 15m",
      stopsText: "Vadodara, Surat Bypass, Vapi, Vasai Checkpost"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: Route) => {
    setEditingRoute(r);
    setFormData({
      name: r.name,
      distance: r.distance,
      duration: r.duration,
      stopsText: r.stops ? r.stops.join(", ") : ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingRoute ? `/api/routes/${editingRoute.id}` : "/api/routes";
    const method = editingRoute ? "PUT" : "POST";

    const payload = {
      name: formData.name,
      distance: Number(formData.distance),
      duration: formData.duration,
      stops: formData.stopsText.split(",").map(s => s.trim()).filter(Boolean)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        if (onRefreshAll) onRefreshAll();
        alert(editingRoute ? "Route updated successfully." : "Route registered successfully.");
      } else {
        alert("Failed to submit route.");
      }
    } catch (err) {
      console.error("Failed to submit route", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete Corridor ${id}?`)) return;
    try {
      const res = await fetch(`/api/routes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        if (onRefreshAll) onRefreshAll();
        alert("Route corridor deleted successfully.");
      }
    } catch (err) {
      console.error("Failed to delete route", err);
    }
  };

  const filteredRoutes = routes.filter(r => {
    return r.name.toLowerCase().includes(search.toLowerCase()) ||
           r.duration.toLowerCase().includes(search.toLowerCase()) ||
           (r.stops && r.stops.some(s => s.toLowerCase().includes(search.toLowerCase())));
  });

  return (
    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Routes</h2>
          <p className="text-xs text-slate-500">Manage shipping routes, stops, and durations.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#ef233c]/10 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Add Corridor
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Route Loops, Intermediate Stops, Milestones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] rounded-xl py-2 pl-10 pr-4 text-slate-800 outline-none"
          />
        </div>

        <div className="flex items-center justify-end text-slate-400 font-mono font-bold">
          Total Routes: {filteredRoutes.length}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ef233c] animate-ping" /> Loading routes...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                <th className="py-3 px-2">Route ID</th>
                <th className="py-3 px-2">Route Name</th>
                <th className="py-3 px-2">Distance</th>
                <th className="py-3 px-2">Duration</th>
                <th className="py-3 px-2">Stops</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 max-w-sm mx-auto my-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Compass className="w-6 h-6 text-slate-400 animate-spin-slow" />
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">No Routes Found</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 max-w-xs leading-relaxed">No registered corridor routes found matching your search query.</p>
                      <button 
                        type="button"
                        onClick={() => { setSearch(""); }}
                        className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm cursor-pointer"
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoutes.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-600 font-medium">
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-900">{r.id}</td>
                    <td className="py-3.5 px-2 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-[#ef233c]" />
                        {r.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-mono text-indigo-600 font-extrabold">{r.distance} Km</td>
                    <td className="py-3.5 px-2 font-mono">{r.duration}</td>
                    <td className="py-3.5 px-2">
                      <div className="flex flex-wrap gap-1">
                        {r.stops && r.stops.map((stop, i) => (
                          <span key={i} className="bg-slate-50 border border-slate-200 text-slate-500 px-1.5 py-0.2 rounded font-mono text-[9px] font-semibold">{stop}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-md overflow-hidden shadow-xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                {editingRoute ? `Edit Route ${editingRoute.id}` : "Add Route"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Route Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Surat Terminal ↔ Pune Central loop"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Distance (Km)</label>
                    <input
                      type="number"
                      required
                      value={formData.distance}
                      onChange={(e) => setFormData(prev => ({ ...prev, distance: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Duration</label>
                    <input
                      type="text"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g. 7h 45m"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Stops (Comma separated)</label>
                  <input
                    type="text"
                    required
                    value={formData.stopsText}
                    onChange={(e) => setFormData(prev => ({ ...prev, stopsText: e.target.value }))}
                    placeholder="e.g. Anand, Bharuch, Navsari Hub, Vasai"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Specify route stops separated by commas.</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 py-2 px-4 rounded-xl text-xs uppercase font-mono tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ef233c] hover:bg-[#d90429] text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#ef233c]/15 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
