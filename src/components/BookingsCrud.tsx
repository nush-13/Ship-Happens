import React, { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Search, Filter, Printer, Download, Eye, X, Check, AlertTriangle, Inbox
} from "lucide-react";
import { Shipment, Vehicle, Driver } from "../types";

interface BookingsCrudProps {
  onRefreshAll?: () => void;
}

export default function BookingsCrud({ onRefreshAll }: BookingsCrudProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    pickup: "",
    destination: "",
    weight: 5000,
    cargoType: "",
    priority: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    status: "BOOKED" as Shipment["status"],
    driverId: "",
    vehicleId: "",
    progress: 0
  });

  // Overload Warning Check
  const [overloadWarning, setOverloadWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Recalculate overload whenever vehicle or weight changes
  useEffect(() => {
    if (!formData.vehicleId || !formData.weight) {
      setOverloadWarning(null);
      return;
    }
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (selectedVehicle) {
      const capMatch = selectedVehicle.capacity.match(/\d+/);
      if (capMatch) {
        const capacityInKg = parseInt(capMatch[0]) * 1000;
        if (formData.weight > capacityInKg) {
          setOverloadWarning(
            `OVERLOAD DETECTED! Vehicle capacity is ${selectedVehicle.capacity} (${capacityInKg} kg), but manifest weight is ${formData.weight.toLocaleString()} kg.`
          );
          return;
        }
      }
    }
    setOverloadWarning(null);
  }, [formData.vehicleId, formData.weight, vehicles]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, vRes, dRes] = await Promise.all([
        fetch("/api/shipments"),
        fetch("/api/vehicles"),
        fetch("/api/drivers"),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      setShipments(await sRes.json());
      setVehicles(await vRes.json());
      setDrivers(await dRes.json());
    } catch (err) {
      console.error("Failed to fetch bookings data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingShipment(null);
    setFormData({
      customerName: "",
      pickup: "Ahmedabad Hub, GJ",
      destination: "Mumbai JNPT Port, MH",
      weight: 8000,
      cargoType: "Industrial Machinery Parts",
      priority: "MEDIUM",
      status: "BOOKED",
      driverId: "",
      vehicleId: "",
      progress: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ship: Shipment) => {
    setEditingShipment(ship);
    setFormData({
      customerName: ship.customerName,
      pickup: ship.pickup,
      destination: ship.destination,
      weight: ship.weight,
      cargoType: ship.cargoType,
      priority: ship.priority,
      status: ship.status,
      driverId: ship.driverId || "",
      vehicleId: ship.vehicleId || "",
      progress: ship.progress || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingShipment ? `/api/shipments/${editingShipment.id}` : "/api/shipments";
    const method = editingShipment ? "PUT" : "POST";

    const payload = {
      ...formData,
      driverName: drivers.find(d => d.id === formData.driverId)?.name || "",
      vehicleNumber: vehicles.find(v => v.id === formData.vehicleId)?.plateNumber || ""
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
        alert(editingShipment ? "Booking updated successfully." : "Booking created successfully.");
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Failed to process request"}`);
      }
    } catch (err) {
      console.error("Failed to submit booking", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete Booking ${id}?`)) return;
    try {
      const res = await fetch(`/api/shipments/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        if (onRefreshAll) onRefreshAll();
        alert("Booking deleted successfully.");
      }
    } catch (err) {
      console.error("Failed to delete booking", err);
    }
  };

  // Filter shipments
  const filteredShipments = shipments.filter(ship => {
    const matchesSearch = 
      ship.id.toLowerCase().includes(search.toLowerCase()) ||
      ship.customerName.toLowerCase().includes(search.toLowerCase()) ||
      ship.cargoType.toLowerCase().includes(search.toLowerCase()) ||
      (ship.driverName && ship.driverName.toLowerCase().includes(search.toLowerCase())) ||
      (ship.vehicleNumber && ship.vehicleNumber.toLowerCase().includes(search.toLowerCase())) ||
      ship.destination.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || ship.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || ship.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN_TRANSIT": return "bg-sky-50 text-sky-700 border-sky-200";
      case "DELAYED": return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40";
      case "CANCELLED": return "bg-slate-100 text-slate-500 border-slate-300";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const printDocument = (type: string, shipId: string) => {
    window.open(`/api/documents/print/${type}/${shipId}`, "_blank");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Bookings</h2>
          <p className="text-xs text-slate-500">Create, edit, and track active client bookings and shipments.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#ef233c]/10 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Add Booking
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search reference, customer, driver..."
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
            <option value="BOOKED">BOOKED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PICKED_UP">PICKED_UP</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="AT_HUB">AT_HUB</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="DELAYED">DELAYED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none focus:border-[#ef233c]"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 font-mono font-bold">
          Total: {filteredShipments.length} Bookings
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ef233c] animate-ping" /> Loading Bookings...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                <th className="py-3 px-2">ID</th>
                <th className="py-3 px-2">Consignee</th>
                <th className="py-3 px-2">Origin / Destination</th>
                <th className="py-3 px-2">Cargo details</th>
                <th className="py-3 px-2">Vehicle / Driver</th>
                <th className="py-3 px-2">Priority</th>
                <th className="py-3 px-2">Status / Prog.</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 max-w-sm mx-auto my-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6 text-slate-400" />
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">No Bookings Found</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 max-w-xs leading-relaxed">No shipment bookings found matching your current search or status filter criteria.</p>
                      <button 
                        type="button"
                        onClick={() => { setSearch(""); setStatusFilter("ALL"); setPriorityFilter("ALL"); }}
                        className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredShipments.map(ship => (
                  <tr key={ship.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-600 font-medium">
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-900">{ship.id}</td>
                    <td className="py-3.5 px-2">
                      <strong className="text-slate-800 block">{ship.customerName}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{ship.invoiceId}</span>
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="space-y-0.5">
                        <span className="block truncate max-w-[150px]"><span className="text-slate-400">From:</span> {ship.pickup}</span>
                        <span className="block truncate max-w-[150px]"><span className="text-slate-400">To:</span> {ship.destination}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <div>
                        <strong className="text-slate-700 block truncate max-w-[120px]">{ship.cargoType}</strong>
                        <span className="text-[10px] text-[#ef233c] font-bold">{ship.weight.toLocaleString()} kg</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      {ship.driverId ? (
                        <div className="space-y-0.5">
                          <span className="block font-semibold text-slate-700">{ship.driverName}</span>
                          <span className="block text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 w-fit">{ship.vehicleNumber}</span>
                        </div>
                      ) : (
                        <span className="text-rose-500 font-mono text-[10px] font-bold">UNASSIGNED</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        ship.priority === "HIGH" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                        ship.priority === "MEDIUM" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {ship.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="space-y-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(ship.status)}`}>
                          {ship.status}
                        </span>
                        <div className="flex items-center gap-1.5 w-24">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#ef233c]" style={{ width: `${ship.progress}%` }} />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-400">{ship.progress}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => printDocument("invoice", ship.id)}
                          title="Print Invoice"
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#ef233c]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => printDocument("receipt", ship.id)}
                          title="Lorry Receipt"
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#ef233c]"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ship)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ship.id)}
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
          <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-2xl overflow-hidden shadow-xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                {editingShipment ? `Edit Shipment ${editingShipment.id}` : `New Booking`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="e.g. Meridian Retail Pvt Ltd"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Cargo Description</label>
                  <input
                    type="text"
                    required
                    value={formData.cargoType}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargoType: e.target.value }))}
                    placeholder="e.g. Solar panels, medical goods"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Pickup Origin</label>
                  <input
                    type="text"
                    required
                    value={formData.pickup}
                    onChange={(e) => setFormData(prev => ({ ...prev, pickup: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Assign Vehicle</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  >
                    <option value="">No truck assigned (Hold booking)</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plateNumber} ({v.model} - Cap: {v.capacity})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Assign Driver</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  >
                    <option value="">No crew assigned (Hold booking)</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} (Safety: {d.safetyScore}%)</option>
                    ))}
                  </select>
                </div>

                {editingShipment && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                      >
                        <option value="BOOKED">BOOKED</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PICKED_UP">PICKED_UP</option>
                        <option value="IN_TRANSIT">IN_TRANSIT</option>
                        <option value="AT_HUB">AT_HUB</option>
                        <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="DELAYED">DELAYED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Progress ({formData.progress}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => setFormData(prev => ({ ...prev, progress: Number(e.target.value) }))}
                        className="w-full accent-[#ef233c]"
                      />
                    </div>
                  </>
                )}

                {/* Overload Alert Notification */}
                {overloadWarning && (
                  <div className="md:col-span-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <span className="font-mono text-[10px] font-black uppercase tracking-wider block">Safety Alert</span>
                      <p className="text-[11px] leading-tight mt-0.5">{overloadWarning}</p>
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
