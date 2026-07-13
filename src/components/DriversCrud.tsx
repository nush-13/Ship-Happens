import React, { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Search, Filter, X, Check, User, ShieldCheck, AlertTriangle, Inbox
} from "lucide-react";
import { Driver } from "../types";

interface DriversCrudProps {
  onRefreshAll?: () => void;
}

export default function DriversCrud({ onRefreshAll }: DriversCrudProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseExpiryDate: "",
    safetyScore: 92,
    status: "AVAILABLE" as Driver["status"]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res] = await Promise.all([
        fetch("/api/drivers"),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      setDrivers(await res.json());
    } catch (err) {
      console.error("Failed to fetch drivers CRUD data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingDriver(null);
    setFormData({
      name: "Satish Sharma",
      email: "satish.sharma@transitops.com",
      phone: "+91 77777 66666",
      licenseNumber: "DL-14202100495",
      licenseExpiryDate: "2029-05-14",
      safetyScore: 95,
      status: "AVAILABLE"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setFormData({
      name: d.name,
      email: d.email,
      phone: d.phone,
      licenseNumber: d.licenseNumber,
      licenseExpiryDate: d.licenseExpiryDate,
      safetyScore: d.safetyScore,
      status: d.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingDriver ? `/api/drivers/${editingDriver.id}` : "/api/drivers";
    const method = editingDriver ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        if (onRefreshAll) onRefreshAll();
        alert(editingDriver ? "Driver updated successfully." : "Driver registered successfully.");
      } else {
        alert("Failed to submit driver.");
      }
    } catch (err) {
      console.error("Failed to submit driver", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete Driver ${id}?`)) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        if (onRefreshAll) onRefreshAll();
        alert("Driver removed successfully.");
      }
    } catch (err) {
      console.error("Failed to delete driver", err);
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Drivers</h2>
          <p className="text-xs text-slate-500">Manage driver information, licensing, and safety records.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#ef233c]/10 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Driver Name, License, Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none focus:border-[#ef233c]"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ON_TRIP">ON_TRIP</option>
            <option value="OFF_DUTY">OFF_DUTY</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 font-mono font-bold">
          Total Drivers: {filteredDrivers.length}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ef233c] animate-ping" /> Loading drivers...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                <th className="py-3 px-2">Driver Name</th>
                <th className="py-3 px-2">Email</th>
                <th className="py-3 px-2">Phone</th>
                <th className="py-3 px-2">License Number</th>
                <th className="py-3 px-2">License Expiry</th>
                <th className="py-3 px-2">Safety Score</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 max-w-sm mx-auto my-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">No Drivers Found</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 max-w-xs leading-relaxed">No registered fleet drivers found matching your current search or status filters.</p>
                      <button 
                        type="button"
                        onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
                        className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map(d => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-600 font-medium font-sans">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-[#ef233c] font-black font-mono text-[10px]">
                          {d.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <strong className="text-slate-800">{d.name}</strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-mono text-slate-500">{d.email}</td>
                    <td className="py-3.5 px-2 font-mono">{d.phone}</td>
                    <td className="py-3.5 px-2 font-mono text-slate-700">{d.licenseNumber}</td>
                    <td className="py-3.5 px-2 font-mono text-slate-500">{d.licenseExpiryDate}</td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-black ${d.safetyScore > 90 ? 'text-emerald-600' : d.safetyScore > 75 ? 'text-amber-500' : 'text-rose-600'}`}>
                          {d.safetyScore}%
                        </span>
                        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${d.safetyScore > 90 ? 'bg-emerald-500' : d.safetyScore > 75 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${d.safetyScore}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        d.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        d.status === "ON_TRIP" ? "bg-[#ef233c]/10 text-[#ef233c] border border-[#ef233c]/20" :
                        "bg-slate-100 text-slate-500 border-slate-300"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
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
                {editingDriver ? `Edit Driver ${editingDriver.name}` : "Add Driver"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">License Number</label>
                    <input
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">License Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={formData.licenseExpiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, licenseExpiryDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Safety Score (%)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={formData.safetyScore}
                      onChange={(e) => setFormData(prev => ({ ...prev, safetyScore: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="ON_TRIP">ON_TRIP</option>
                      <option value="OFF_DUTY">OFF_DUTY</option>
                    </select>
                  </div>
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
