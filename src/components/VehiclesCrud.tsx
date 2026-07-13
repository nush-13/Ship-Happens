import React, { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Search, Filter, X, Check, Truck, AlertTriangle, Settings, Inbox
} from "lucide-react";
import { Vehicle } from "../types";

interface VehiclesCrudProps {
  onRefreshAll?: () => void;
}

export default function VehiclesCrud({ onRefreshAll }: VehiclesCrudProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    plateNumber: "",
    model: "",
    status: "ACTIVE" as Vehicle["status"],
    fuelLevel: 80,
    batteryLevel: 95,
    engineHealth: 90,
    tyreHealth: 85,
    maintenanceOverdue: false,
    fuelEfficiency: 4.5,
    capacity: "15 Tons",
    lastServiceDate: "",
    odometer: 120000
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res] = await Promise.all([
        fetch("/api/vehicles"),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      setVehicles(await res.json());
    } catch (err) {
      console.error("Failed to fetch vehicles CRUD data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setFormData({
      plateNumber: "MH-04-XX-0000",
      model: "Tata Signa 4825.TK",
      status: "ACTIVE",
      fuelLevel: 100,
      batteryLevel: 100,
      engineHealth: 100,
      tyreHealth: 100,
      maintenanceOverdue: false,
      fuelEfficiency: 4.2,
      capacity: "18 Tons",
      lastServiceDate: new Date().toISOString().split('T')[0],
      odometer: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      plateNumber: v.plateNumber,
      model: v.model,
      status: v.status,
      fuelLevel: v.fuelLevel,
      batteryLevel: v.batteryLevel,
      engineHealth: v.engineHealth,
      tyreHealth: v.tyreHealth,
      maintenanceOverdue: v.maintenanceOverdue,
      fuelEfficiency: v.fuelEfficiency,
      capacity: v.capacity,
      lastServiceDate: v.lastServiceDate,
      odometer: v.odometer
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : "/api/vehicles";
    const method = editingVehicle ? "PUT" : "POST";

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
        alert(editingVehicle ? "Vehicle updated successfully." : "Vehicle registered successfully.");
      } else {
        alert("Failed to submit vehicle.");
      }
    } catch (err) {
      console.error("Failed to submit vehicle", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to retire Vehicle ${id}?`)) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        if (onRefreshAll) onRefreshAll();
        alert("Vehicle retired successfully.");
      }
    } catch (err) {
      console.error("Failed to delete vehicle", err);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.capacity.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Vehicles</h2>
          <p className="text-xs text-slate-500">Monitor diagnostics, weight capacities, and maintenance status of fleet vehicles.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#ef233c]/10 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Plate Number, Model, Capacity..."
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
            <option value="ACTIVE">ACTIVE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 font-mono font-bold">
          Total Vehicles: {filteredVehicles.length}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ef233c] animate-ping" /> Loading vehicles...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                <th className="py-3 px-2">Plate Number</th>
                <th className="py-3 px-2">Model</th>
                <th className="py-3 px-2">Capacity</th>
                <th className="py-3 px-2">Engine Health</th>
                <th className="py-3 px-2">Fuel Efficiency</th>
                <th className="py-3 px-2">Odometer</th>
                <th className="py-3 px-2">Maintenance Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 max-w-sm mx-auto my-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Truck className="w-6 h-6 text-slate-400" />
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">No Vehicles Found</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 max-w-xs leading-relaxed">No logistics vehicles found matching your current search or status filter criteria.</p>
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
                filteredVehicles.map(v => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-600 font-medium">
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-900">{v.plateNumber}</td>
                    <td className="py-3.5 px-2 text-slate-800 font-bold">{v.model}</td>
                    <td className="py-3.5 px-2 font-mono text-indigo-600 font-bold">{v.capacity}</td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className={`h-full ${v.engineHealth > 80 ? 'bg-emerald-500' : v.engineHealth > 50 ? 'bg-amber-500' : 'bg-rose-600'}`} style={{ width: `${v.engineHealth}%` }} />
                        </div>
                        <span className="font-mono font-bold text-slate-500">{v.engineHealth}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-mono">{v.fuelEfficiency} Km/L</td>
                    <td className="py-3.5 px-2 font-mono text-slate-500">{v.odometer.toLocaleString()} Km</td>
                    <td className="py-3.5 px-2">
                      {v.maintenanceOverdue ? (
                        <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">OVERDUE</span>
                      ) : (
                        <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">OK</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
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
          <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-lg overflow-hidden shadow-xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                {editingVehicle ? `Edit Vehicle ${editingVehicle.plateNumber}` : "Add Vehicle"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 grid grid-cols-2 gap-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Plate Number</label>
                  <input
                    type="text"
                    required
                    value={formData.plateNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Model</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Payload Limit</label>
                  <input
                    type="text"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Fuel Efficiency (Km/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.fuelEfficiency}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelEfficiency: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Odometer (Km)</label>
                  <input
                    type="number"
                    required
                    value={formData.odometer}
                    onChange={(e) => setFormData(prev => ({ ...prev, odometer: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Last Service Date</label>
                  <input
                    type="date"
                    required
                    value={formData.lastServiceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastServiceDate: e.target.value }))}
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
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>

                <div className="flex items-center mt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={formData.maintenanceOverdue}
                      onChange={(e) => setFormData(prev => ({ ...prev, maintenanceOverdue: e.target.checked }))}
                      className="w-4 h-4 accent-[#ef233c]"
                    />
                    <span>Maintenance Overdue</span>
                  </label>
                </div>

                <div className="col-span-2 border-t border-slate-100 pt-3">
                  <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Sensors & Diagnostics</span>
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                      <span>Engine Health: {formData.engineHealth}%</span>
                      <input type="range" value={formData.engineHealth} onChange={(e) => setFormData(prev => ({ ...prev, engineHealth: Number(e.target.value) }))} className="w-full accent-[#ef233c]" />
                    </div>
                    <div>
                      <span>Tyre Health: {formData.tyreHealth}%</span>
                      <input type="range" value={formData.tyreHealth} onChange={(e) => setFormData(prev => ({ ...prev, tyreHealth: Number(e.target.value) }))} className="w-full accent-[#ef233c]" />
                    </div>
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
