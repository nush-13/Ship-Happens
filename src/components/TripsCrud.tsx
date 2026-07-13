import React, { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Search, Filter, X, Check, Clock, ShieldAlert, DollarSign, Inbox
} from "lucide-react";
import { Trip, Vehicle, Driver, Route } from "../types";

interface TripsCrudProps {
  onRefreshAll?: () => void;
}

export default function TripsCrud({ onRefreshAll }: TripsCrudProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState({
    vehicleId: "",
    driverId: "",
    routeId: "",
    status: "SCHEDULED" as Trip["status"],
    startTime: "",
    endTime: "",
    cost: 15000,
    fuelConsumed: undefined as number | undefined
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, vRes, dRes, rRes] = await Promise.all([
        fetch("/api/trips"),
        fetch("/api/vehicles"),
        fetch("/api/drivers"),
        fetch("/api/routes"),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      setTrips(await tRes.json());
      setVehicles(await vRes.json());
      setDrivers(await dRes.json());
      setRoutes(await rRes.json());
    } catch (err) {
      console.error("Failed to fetch trips CRUD data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTrip(null);
    setFormData({
      vehicleId: vehicles[0]?.id || "",
      driverId: drivers[0]?.id || "",
      routeId: routes[0]?.id || "",
      status: "SCHEDULED",
      startTime: new Date().toISOString().slice(0, 16),
      endTime: "",
      cost: 18000,
      fuelConsumed: undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      routeId: trip.routeId,
      status: trip.status,
      startTime: new Date(trip.startTime).toISOString().slice(0, 16),
      endTime: trip.endTime ? new Date(trip.endTime).toISOString().slice(0, 16) : "",
      cost: trip.cost,
      fuelConsumed: trip.fuelConsumed
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTrip ? `/api/trips/${editingTrip.id}` : "/api/trips";
    const method = editingTrip ? "PUT" : "POST";

    const payload = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : ""
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
        alert(editingTrip ? "Trip updated successfully." : "Trip created successfully.");
      } else {
        alert("Failed to submit trip.");
      }
    } catch (err) {
      console.error("Failed to submit trip", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete Trip ${id}?`)) return;
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        if (onRefreshAll) onRefreshAll();
        alert("Trip deleted successfully.");
      }
    } catch (err) {
      console.error("Failed to delete trip", err);
    }
  };

  const getVehicleNumber = (vId: string) => {
    return vehicles.find(v => v.id === vId)?.plateNumber || vId;
  };

  const getDriverName = (dId: string) => {
    return drivers.find(d => d.id === dId)?.name || dId;
  };

  const getRouteName = (rId: string) => {
    return routes.find(r => r.id === rId)?.name || rId;
  };

  const filteredTrips = trips.filter(trip => {
    const vNum = getVehicleNumber(trip.vehicleId).toLowerCase();
    const dName = getDriverName(trip.driverId).toLowerCase();
    const rName = getRouteName(trip.routeId).toLowerCase();

    const matchesSearch = 
      trip.id.toLowerCase().includes(search.toLowerCase()) ||
      vNum.includes(search.toLowerCase()) ||
      dName.includes(search.toLowerCase()) ||
      rName.includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ACTIVE": return "bg-rose-50 text-rose-600 border border-rose-100";
      case "DELAYED": return "bg-amber-50 text-amber-700 border border-amber-200";
      default: return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Trips</h2>
          <p className="text-xs text-slate-500">Manage and schedule trips across all fleet routes.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#ef233c]/10 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Schedule Trip
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Trip ID, Truck, Driver, Route..."
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
            <option value="ALL">All Trip Statuses</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DELAYED">DELAYED</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 font-mono font-bold">
          Active Trips: {filteredTrips.length}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ef233c] animate-ping" /> Loading Journeys...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                <th className="py-3 px-2">Trip ID</th>
                <th className="py-3 px-2">Assigned Route</th>
                <th className="py-3 px-2">Assigned Fleet Truck</th>
                <th className="py-3 px-2">Assigned Driver Crew</th>
                <th className="py-3 px-2">Scheduled Departure</th>
                <th className="py-3 px-2">Transit Cost</th>
                <th className="py-3 px-2">Trip Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 max-w-sm mx-auto my-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6 text-slate-400" />
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">No Active Trips</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 max-w-xs leading-relaxed">No active or scheduled trip records found matching your current filters.</p>
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
                filteredTrips.map(trip => (
                  <tr key={trip.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-600 font-medium">
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-900">{trip.id}</td>
                    <td className="py-3.5 px-2 text-slate-800 font-bold">{getRouteName(trip.routeId)}</td>
                    <td className="py-3.5 px-2 font-mono text-emerald-600 font-bold">{getVehicleNumber(trip.vehicleId)}</td>
                    <td className="py-3.5 px-2">{getDriverName(trip.driverId)}</td>
                    <td className="py-3.5 px-2 font-mono text-[10px] text-slate-500">
                      {new Date(trip.startTime).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3.5 px-2 font-mono text-emerald-600 font-bold">₹{trip.cost.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusClass(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(trip)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(trip.id)}
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
                {editingTrip ? `Edit Trip ${editingTrip.id}` : "Schedule Trip"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Route</label>
                  <select
                    required
                    value={formData.routeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, routeId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.distance} km)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Vehicle</label>
                    <select
                      required
                      value={formData.vehicleId}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plateNumber} ({v.model})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Driver</label>
                    <select
                      required
                      value={formData.driverId}
                      onChange={(e) => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    >
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} (Safety: {d.safetyScore}%)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Departure Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Trip Cost (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {editingTrip && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Trip Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                      >
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="DELAYED">DELAYED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Fuel Consumed (L)</label>
                      <input
                        type="number"
                        value={formData.fuelConsumed || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, fuelConsumed: e.target.value ? Number(e.target.value) : undefined }))}
                        placeholder="e.g. 120"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
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
