import React, { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Search, Filter, X, Check, FileText, Printer, Eye
} from "lucide-react";
import { LorryReceipt, Shipment } from "../types";

interface LorryReceiptsCrudProps {
  onRefreshAll?: () => void;
}

export default function LorryReceiptsCrud({ onRefreshAll }: LorryReceiptsCrudProps) {
  const [receipts, setReceipts] = useState<LorryReceipt[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<LorryReceipt | null>(null);
  const [formData, setFormData] = useState({
    shipmentId: "",
    consignor: "",
    consignee: "",
    vehiclePlate: "",
    driverName: "",
    cargoType: "",
    weight: 12000,
    date: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lrRes, sRes] = await Promise.all([
        fetch("/api/lorry-receipts"),
        fetch("/api/shipments"),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      setReceipts(await lrRes.json());
      setShipments(await sRes.json());
    } catch (err) {
      console.error("Failed to fetch lorry receipts CRUD data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingReceipt(null);
    setFormData({
      shipmentId: shipments[0]?.id || "",
      consignor: "Meridian Retail Ltd. / Surat Hub",
      consignee: "Meridian Logistics Terminal, Mumbai, MH",
      vehiclePlate: "MH-04-GP-8834",
      driverName: "Rajesh Yadav",
      cargoType: "Premium Cotton Textile Rolls",
      weight: 12500,
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lr: LorryReceipt) => {
    setEditingReceipt(lr);
    setFormData({
      shipmentId: lr.shipmentId,
      consignor: lr.consignor,
      consignee: lr.consignee,
      vehiclePlate: lr.vehiclePlate,
      driverName: lr.driverName,
      cargoType: lr.cargoType,
      weight: lr.weight,
      date: lr.date
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingReceipt ? `/api/lorry-receipts/${editingReceipt.id}` : "/api/lorry-receipts";
    const method = editingReceipt ? "PUT" : "POST";

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
        alert(editingReceipt ? "Lorry Receipt updated." : "Lorry Receipt generated.");
      } else {
        alert("Failed to submit receipt.");
      }
    } catch (err) {
      console.error("Failed to submit receipt", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to invalidate Lorry Receipt ${id}?`)) return;
    try {
      const res = await fetch(`/api/lorry-receipts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        if (onRefreshAll) onRefreshAll();
        alert("Lorry Receipt invalidated successfully.");
      }
    } catch (err) {
      console.error("Failed to delete receipt", err);
    }
  };

  const printDocument = (shipmentId: string) => {
    window.open(`/api/documents/print/receipt/${shipmentId}`, "_blank");
  };

  const filteredReceipts = receipts.filter(lr => {
    return lr.id.toLowerCase().includes(search.toLowerCase()) ||
           lr.shipmentId.toLowerCase().includes(search.toLowerCase()) ||
           lr.consignor.toLowerCase().includes(search.toLowerCase()) ||
           lr.consignee.toLowerCase().includes(search.toLowerCase()) ||
           lr.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
           lr.driverName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Lorry Receipts</h2>
          <p className="text-xs text-slate-500">Official consignment notes and motor transit receipts for shipments.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#ef233c]/10 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Issue Receipt
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Receipt ID, Consignor, Consignee, Truck plate, Driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] rounded-xl py-2 pl-10 pr-4 text-slate-800 outline-none"
          />
        </div>

        <div className="flex items-center justify-end text-slate-400 font-mono font-bold">
          Total Receipts: {filteredReceipts.length}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ef233c] animate-ping" /> Loading Receipts...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                <th className="py-3 px-2">LR Number</th>
                <th className="py-3 px-2">Shipment Ref</th>
                <th className="py-3 px-2">Shipper (Consignor)</th>
                <th className="py-3 px-2">Consignee</th>
                <th className="py-3 px-2">Vehicle / Driver</th>
                <th className="py-3 px-2">Date Issued</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 max-w-sm mx-auto my-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">No Receipts Found</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 max-w-xs leading-relaxed">No registered lorry receipts (Bilty) found matching your search query.</p>
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
                filteredReceipts.map(lr => (
                  <tr key={lr.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-600 font-medium">
                    <td className="py-3.5 px-2 font-mono font-bold text-[#ef233c]">{lr.id}</td>
                    <td className="py-3.5 px-2 font-mono text-slate-900 font-bold">{lr.shipmentId}</td>
                    <td className="py-3.5 px-2 font-bold text-slate-800">{lr.consignor}</td>
                    <td className="py-3.5 px-2">{lr.consignee}</td>
                    <td className="py-3.5 px-2">
                      <div className="space-y-0.5">
                        <strong className="text-slate-700 block">{lr.driverName}</strong>
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100 font-bold">{lr.vehiclePlate}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-mono text-slate-500">{lr.date}</td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => printDocument(lr.shipmentId)}
                          title="Preview Legal Copy"
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#ef233c]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(lr)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(lr.id)}
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
                {editingReceipt ? `Edit Lorry Receipt ${editingReceipt.id}` : "Issue Lorry Receipt"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Shipment</label>
                  <select
                    required
                    value={formData.shipmentId}
                    onChange={(e) => {
                      const match = shipments.find(s => s.id === e.target.value);
                      if (match) {
                        setFormData(prev => ({
                          ...prev,
                          shipmentId: match.id,
                          consignee: match.customerName,
                          vehiclePlate: match.vehicleNumber || "MH-04-GP-8834",
                          driverName: match.driverName || "Rajesh Yadav",
                          cargoType: match.cargoType,
                          weight: match.weight
                        }));
                      } else {
                        setFormData(prev => ({ ...prev, shipmentId: e.target.value }));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  >
                    {shipments.map(s => (
                      <option key={s.id} value={s.id}>{s.id} ({s.customerName})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Shipper (Consignor)</label>
                    <input
                      type="text"
                      required
                      value={formData.consignor}
                      onChange={(e) => setFormData(prev => ({ ...prev, consignor: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Consignee</label>
                    <input
                      type="text"
                      required
                      value={formData.consignee}
                      onChange={(e) => setFormData(prev => ({ ...prev, consignee: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Vehicle Plate</label>
                    <input
                      type="text"
                      required
                      value={formData.vehiclePlate}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Driver Name</label>
                    <input
                      type="text"
                      required
                      value={formData.driverName}
                      onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Cargo Description</label>
                    <input
                      type="text"
                      required
                      value={formData.cargoType}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargoType: e.target.value }))}
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
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                  />
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
