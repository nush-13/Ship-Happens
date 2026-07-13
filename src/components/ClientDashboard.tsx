import React, { useState, useEffect } from "react";
import { 
  Search, ShieldCheck, Clock, User, Truck, MapPin, 
  ChevronRight, Calendar, ArrowRightLeft, FileText, Download, 
  MessageSquare, HelpCircle, PhoneCall, AlertCircle, FileSpreadsheet, Sparkles, Printer,
  Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Shipment, User as UserType } from "../types";
import MapWidget from "./MapWidget";

interface ClientDashboardProps {
  user: UserType;
  onLogout: () => void;
  theme?: string;
  toggleTheme?: () => void;
}

export default function ClientDashboard({ user, onLogout, theme, toggleTheme }: ClientDashboardProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Support state
  const [issueText, setIssueText] = useState("");
  const [issueRaised, setIssueRaised] = useState(false);
  const [activeTab, setActiveTab] = useState<"tracking" | "history" | "boarding-pass">("tracking");

  // Document modal preview
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const [res] = await Promise.all([
        fetch("/api/shipments"),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      const data = await res.json();
      setShipments(data);
      if (data.length > 0) {
        // Set the active high-priority shipment as default focus
        const activeShipment = data.find((s: Shipment) => s.status === "IN_TRANSIT") || data[0];
        setSelectedShipment(activeShipment);
      }
    } catch (err) {
      console.error("Failed to fetch client shipments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const found = shipments.find(s => s.id.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    if (found) {
      setSelectedShipment(found);
      setActiveTab("tracking");
    } else {
      alert(`No shipment found matching ID: ${searchQuery}`);
    }
  };

  const filteredShipments = shipments.filter(s => {
    if (filter === "ALL") return true;
    return s.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN_TRANSIT": return "bg-[#ef233c]/10 text-[#ef233c] border-[#ef233c]/20";
      case "DELAYED": return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40";
      case "BOOKED": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const timelineMilestones = [
    { key: "BOOKED", label: "Booked" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "PICKED_UP", label: "Picked Up" },
    { key: "IN_TRANSIT", label: "In Transit" },
    { key: "AT_HUB", label: "At Hub" },
    { key: "OUT_FOR_DELIVERY", label: "Out For Delivery" },
    { key: "DELIVERED", label: "Delivered" }
  ];

  const getMilestoneIndex = (status: string) => {
    return timelineMilestones.findIndex(m => m.key === status);
  };

  const handlePrintDoc = (type: "invoice" | "receipt" | "pod" | "pass", id: string) => {
    const printUrl = `/api/documents/print/${type}/${id}`;
    window.open(printUrl, "_blank");
  };

  const raiseSupportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText) return;
    setIssueRaised(true);
    setTimeout(() => {
      setIssueRaised(false);
      setIssueText("");
      alert("Support Ticket logged with Dispatch Commander. Ref: HD-882193");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f6f5f0] text-slate-800 flex flex-col font-sans pb-12">
      {/* Client Dashboard Premium Top Navigation */}
      <nav className="border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
            <span className="font-mono text-[#ef233c] font-extrabold text-xl">T</span>
          </div>
          <div>
            <h2 className="text-md font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              Ship Happens <span className="text-[#ef233c] bg-[#ef233c]/10 px-2 py-0.5 rounded-lg text-xs border border-[#ef233c]/20">Client Portal</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{user.company}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-4 text-xs font-medium uppercase tracking-wider">
            <button 
              onClick={() => setActiveTab("tracking")} 
              className={`hover:text-[#ef233c] pb-1 border-b-2 transition-all cursor-pointer ${activeTab === "tracking" ? "text-[#ef233c] border-b-[#ef233c]" : "text-slate-500 border-b-transparent"}`}
            >
              Live Tracking
            </button>
            <button 
              onClick={() => setActiveTab("history")} 
              className={`hover:text-[#ef233c] pb-1 border-b-2 transition-all cursor-pointer ${activeTab === "history" ? "text-[#ef233c] border-b-[#ef233c]" : "text-slate-500 border-b-transparent"}`}
            >
              Shipment History
            </button>
            <button 
              onClick={() => setActiveTab("boarding-pass")} 
              className={`hover:text-[#ef233c] pb-1 border-b-2 transition-all cursor-pointer ${activeTab === "boarding-pass" ? "text-[#ef233c] border-b-[#ef233c]" : "text-slate-500 border-b-transparent"}`}
            >
              Boarding Pass
            </button>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center cursor-pointer"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-800">{user.name}</p>
              <button onClick={onLogout} className="text-[10px] text-rose-600 hover:text-rose-500 uppercase tracking-widest font-mono">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Shipment Selector & Search Console */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Shipment Search Console */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-mono font-bold text-[#ef233c] uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Track Shipment
            </h3>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Enter Shipment ID (e.g. TRK-90412)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-2xl py-3 pl-4 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ef233c] hover:bg-[#d90429] p-2 rounded-xl text-white transition-all shadow-md active:scale-95"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Active Shipments Tab List */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Shipments</h3>
              
              {/* Simple Filter Toggle */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase py-1 px-2.5 rounded-lg text-slate-600 focus:outline-none"
              >
                <option value="ALL">ALL STATUS</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="DELAYED">DELAYED</option>
              </select>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center text-slate-400">
                <AlertCircle className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs uppercase font-mono">No Shipments Found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredShipments.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedShipment(s); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      selectedShipment?.id === s.id 
                        ? "bg-[#ef233c]/5 border-[#ef233c]/30 shadow-sm" 
                        : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-100/40"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-extrabold text-slate-800">{s.id}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">Destination</span>
                        <span className="text-slate-700 font-medium">{s.destination.split(",")[0]}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">ETA Arrival</span>
                        <span className="text-[#ef233c] font-bold font-mono">{s.eta}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-mono">Cargo: <span className="text-slate-600 font-sans font-semibold">{s.cargoType}</span></span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#ef233c]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Dashboard View panels based on tabs */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {selectedShipment ? (
            <AnimatePresence mode="wait">
              {activeTab === "tracking" && (
                <motion.div
                  key="tracking-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* HERO SHIPMENT CARD (Premium Light) */}
                  <div className="relative bg-white border border-slate-200 rounded-[32px] p-6 shadow-md overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#ef233c]/2 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ef233c]/1 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-2xl font-black text-slate-800 font-mono tracking-tight">{selectedShipment.id}</h2>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(selectedShipment.status)}`}>
                            {selectedShipment.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Consignee Partner: <span className="text-slate-700 font-semibold">{selectedShipment.customerName}</span></p>
                      </div>

                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Live Arrival Counter</span>
                        <span className="text-xl font-mono font-extrabold text-[#ef233c]">{selectedShipment.eta}</span>
                      </div>
                    </div>

                    {/* Shipment Journey Widget (Airline inspired tracking strip) */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mb-6">
                      <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
                        <span>Origin</span>
                        <span className="text-[#ef233c] font-bold">In Transit</span>
                        <span>Destination</span>
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <div className="text-left">
                          <p className="text-lg font-extrabold text-slate-800">{selectedShipment.pickup.split(",")[0]}</p>
                          <span className="text-[10px] text-slate-400">{selectedShipment.pickup.split(",")[1] || "Gujarat"}</span>
                        </div>

                        <div className="flex-1 px-4 flex flex-col items-center justify-center relative">
                          <div className="w-full border-t-2 border-dashed border-[#ef233c]/20 relative">
                            {/* Animated truck crossing */}
                            <motion.div
                              animate={{ left: `${selectedShipment.progress}%` }}
                              className="absolute -top-3.5 -translate-x-1/2 w-7 h-7 rounded-full bg-white border border-[#ef233c] flex items-center justify-center shadow-sm"
                              style={{ left: `${selectedShipment.progress}%` }}
                            >
                              <Truck className="w-3.5 h-3.5 text-[#ef233c]" />
                            </motion.div>
                          </div>
                          <span className="text-[9px] text-[#ef233c] font-semibold uppercase font-mono tracking-wider mt-5">In Transit &bull; {selectedShipment.progress}% Progress</span>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-extrabold text-slate-800">{selectedShipment.destination.split(",")[0]}</p>
                          <span className="text-[10px] text-slate-400">{selectedShipment.destination.split(",")[1] || "Maharashtra"}</span>
                        </div>
                      </div>

                      {/* progress bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#ef233c] to-[#ef233c]/60 rounded-full transition-all duration-1000"
                          style={{ width: `${selectedShipment.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Driver, Vehicle, Cargo Quick Spec Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">ASSIGNED DRIVER</span>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#ef233c]" />
                          {selectedShipment.driverName || "Manoj Yadav"}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">VEHICLE ID</span>
                        <p className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          {selectedShipment.vehicleNumber || "MH-04-GP-8834"}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">CARGO MANIFEST</span>
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedShipment.cargoType}</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">TOTAL PAYLOAD</span>
                        <p className="text-xs font-bold text-[#ef233c] font-mono">{(selectedShipment.weight).toLocaleString("en-IN")} KG</p>
                      </div>
                    </div>
                  </div>

                  {/* LIVE SHIPMENT MAP */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono font-bold text-[#ef233c] tracking-widest uppercase px-1">Shipment Location</h3>
                    <MapWidget 
                      shipmentId={selectedShipment.id}
                      pickup={selectedShipment.pickup} 
                      destination={selectedShipment.destination} 
                      progress={selectedShipment.progress} 
                      status={selectedShipment.status} 
                    />
                  </div>

                  {/* ACTIVE TIMELINE WIDGET */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-xs font-mono font-bold text-[#ef233c] tracking-widest uppercase mb-6">Status Timeline</h3>
                    
                    {/* Linear Step Progression (Apple Watch Timeline inspired) */}
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2">
                      <div className="absolute top-2 left-4 md:left-0 md:top-4 w-0.5 md:w-full h-[90%] md:h-0.5 bg-slate-100 -z-10" />
                      
                      {timelineMilestones.map((milestone, idx) => {
                        const isCurrent = selectedShipment.status === milestone.key;
                        const isPast = getMilestoneIndex(selectedShipment.status) >= idx;

                        return (
                          <div key={milestone.key} className="flex md:flex-col items-center gap-3 md:gap-2 md:flex-1 relative z-10">
                            {/* Milestone Marker node */}
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                              isCurrent 
                                ? "bg-[#ef233c] border-[#ef233c]/40 shadow-md shadow-[#ef233c]/25 text-white scale-110" 
                                : isPast 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                                  : "bg-slate-50 border border-slate-200 text-slate-400"
                            }`}>
                              {isPast && !isCurrent ? (
                                <ShieldCheck className="w-4 h-4" />
                              ) : (
                                <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                              )}
                            </div>

                            {/* Label */}
                            <div className="text-left md:text-center">
                              <p className={`text-xs font-bold whitespace-nowrap ${isCurrent ? "text-[#ef233c]" : isPast ? "text-slate-700" : "text-slate-400"}`}>
                                {milestone.label}
                              </p>
                              <span className="text-[8px] text-slate-400 block leading-tight font-mono">
                                {isPast ? "Verified" : "Pending"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Expandable Shipment Activity Log */}
                    <div className="border-t border-slate-100 pt-5 mt-6">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight mb-3">Activity Log</h4>
                      <div className="space-y-3">
                        {selectedShipment.trackingHistory.slice().reverse().map((hist, hidx) => (
                          <div key={hidx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                            <span className="w-2 h-2 rounded-full bg-[#ef233c] mt-1.5 shrink-0" />
                            <div className="flex-1 text-xs">
                              <div className="flex justify-between items-center mb-0.5">
                                <strong className="text-slate-800">{hist.status} - <span className="text-[#ef233c] font-normal">{hist.location}</span></strong>
                                <span className="text-[9px] text-slate-400 font-mono">{new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-500 text-[11px]">{hist.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENT CENTER & RAISE SUPPORT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Documents Access Terminal */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                      <h3 className="text-xs font-mono font-bold text-[#ef233c] tracking-widest uppercase mb-4 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Document Center
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-4">
                        Download and print waybills, invoices, or delivery receipts for this shipment.
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">Consignment Invoice</p>
                              <span className="text-[9px] text-slate-400 font-mono">{selectedShipment.invoiceId}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handlePrintDoc("invoice", selectedShipment.id)} 
                              className="bg-white hover:bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-slate-700 transition-all flex items-center gap-1 text-[10px] font-mono font-bold shadow-sm"
                            >
                              <Printer className="w-3 h-3" /> PRINT
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">Lorry Waybill Receipt</p>
                              <span className="text-[9px] text-slate-400 font-mono">{selectedShipment.lorryReceiptId}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handlePrintDoc("receipt", selectedShipment.id)} 
                              className="bg-white hover:bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-slate-700 transition-all flex items-center gap-1 text-[10px] font-mono font-bold shadow-sm"
                            >
                              <Printer className="w-3 h-3" /> PRINT
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#ef233c]" />
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">Signed POD Certificate</p>
                              <span className="text-[9px] text-slate-400 font-mono">{selectedShipment.podId}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handlePrintDoc("pod", selectedShipment.id)} 
                              className="bg-white hover:bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-slate-700 transition-all flex items-center gap-1 text-[10px] font-mono font-bold shadow-sm"
                            >
                              <Printer className="w-3 h-3" /> PRINT
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Support & Dispatcher Chat Center */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                      <h3 className="text-xs font-mono font-bold text-[#ef233c] tracking-widest uppercase mb-4 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        Support & Assistance
                      </h3>
                      
                      <div className="flex gap-3 mb-4">
                        <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                          <PhoneCall className="w-5 h-5 text-emerald-600 mb-1" />
                          <strong className="text-xs text-slate-800">Call Dispatch</strong>
                          <span className="text-[10px] text-slate-500 mt-0.5">+91 91234 56789</span>
                        </div>
                        <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                          <HelpCircle className="w-5 h-5 text-[#ef233c] mb-1" />
                          <strong className="text-xs text-slate-800">Live Web Chat</strong>
                          <span className="text-[10px] text-[#ef233c] font-bold mt-0.5">LAUNCHED</span>
                        </div>
                      </div>

                      <form onSubmit={raiseSupportIssue} className="space-y-3">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">Submit an operational inquiry:</span>
                        <textarea
                          rows={2}
                          value={issueText}
                          onChange={(e) => setIssueText(e.target.value)}
                          placeholder="E.g. Cargo delivery address correction, or driver delayed inquiry..."
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c]/60 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!issueText}
                          className="w-full bg-[#ef233c]/10 text-[#ef233c] border border-[#ef233c]/20 font-bold py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-[#ef233c]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Submit Request
                        </button>
                      </form>
                    </div>

                  </div>
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Shipment History</h2>
                      <p className="text-xs text-slate-500">View all active and historical shipments.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400">
                          <th className="py-3 px-2">Shipment ID</th>
                          <th className="py-3 px-2">Departure</th>
                          <th className="py-3 px-2">Consignee</th>
                          <th className="py-3 px-2">ETA Arrival</th>
                          <th className="py-3 px-2">Priority</th>
                          <th className="py-3 px-2">Status</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipments.map((s) => (
                          <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-600">
                            <td className="py-4 px-2 font-mono font-bold text-slate-800">{s.id}</td>
                            <td className="py-4 px-2 font-mono">{s.departureTime.split("T")[0]}</td>
                            <td className="py-4 px-2 font-sans font-semibold">{s.customerName}</td>
                            <td className="py-4 px-2 font-mono text-[#ef233c]">{s.eta}</td>
                            <td className="py-4 px-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.priority === "HIGH" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                                {s.priority}
                              </span>
                            </td>
                            <td className="py-4 px-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(s.status)}`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <button 
                                onClick={() => { setSelectedShipment(s); setActiveTab("tracking"); }}
                                className="bg-[#ef233c]/10 text-[#ef233c] border border-[#ef233c]/20 px-2.5 py-1 rounded hover:bg-[#ef233c]/20 transition-all text-[10px] font-bold"
                              >
                                TRACK
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === "boarding-pass" && (
                <motion.div
                  key="boarding-pass-tab"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="text-center max-w-sm mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ef233c]/10 border border-[#ef233c]/20 rounded-full mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#ef233c] animate-pulse" />
                      <span className="text-[10px] font-bold font-mono text-[#ef233c] uppercase tracking-widest">Boarding Pass</span>
                    </div>
                    <h2 className="text-lg font-black text-slate-800 uppercase">Transit Pass</h2>
                    <p className="text-xs text-slate-500">
                      Show this boarding pass at warehouse gates and transit checkpoints to expedite entry and loading.
                    </p>
                  </div>

                  {/* DIGITAL BOARDING PASS CARD (Premium Apple Wallet style) */}
                  <div className="relative max-w-lg mx-auto bg-white border-2 border-slate-200 rounded-[32px] overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ef233c]/2 rounded-full blur-2xl pointer-events-none" />
                    
                    {/* Header */}
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-slate-700 tracking-widest uppercase">SHIP HAPPENS SHIPMENT</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#ef233c] bg-[#ef233c]/10 px-2 py-0.5 rounded-md border border-[#ef233c]/20">
                        {selectedShipment.id}
                      </span>
                    </div>

                    {/* Flight style airports code representation */}
                    <div className="px-6 py-6 border-b border-dashed border-slate-200 flex justify-between items-center">
                      <div className="text-left">
                        <h1 className="text-4xl font-black text-[#ef233c] font-mono tracking-tighter">SRT</h1>
                        <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider mt-1">{selectedShipment.pickup.split(",")[0]}</p>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
                        <div className="w-full border-t border-slate-200 absolute top-1/2 -translate-y-1/2"></div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center relative z-10">
                          🚚
                        </div>
                        <span className="text-[9px] text-[#ef233c] font-bold font-mono mt-9 uppercase">Progress: {selectedShipment.progress}%</span>
                      </div>

                      <div className="text-right">
                        <h1 className="text-4xl font-black text-[#ef233c] font-mono tracking-tighter">BOM</h1>
                        <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider mt-1">{selectedShipment.destination.split(",")[0]}</p>
                      </div>
                    </div>

                    {/* Core Boarding Pass Details */}
                    <div className="px-6 py-5 grid grid-cols-2 gap-y-4 gap-x-6 text-xs border-b border-dashed border-slate-200">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">CUSTOMER RECIPIENT</span>
                        <strong className="text-slate-800 font-sans text-sm">{selectedShipment.customerName}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">ASSIGNED DRIVER</span>
                        <strong className="text-slate-800 font-sans text-sm">{selectedShipment.driverName || "Rajesh Yadav"}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">TRUCK PLATE</span>
                        <strong className="text-emerald-600 font-mono text-sm">{selectedShipment.vehicleNumber || "MH-04-GP-8834"}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">CARGO CATEGORY</span>
                        <strong className="text-slate-800 font-sans text-sm">{selectedShipment.cargoType}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">DEPARTURE</span>
                        <strong className="text-slate-800 font-mono text-sm">{selectedShipment.departureTime}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">ESTIMATED ETA</span>
                        <strong className="text-[#ef233c] font-mono text-sm">{selectedShipment.eta}</strong>
                      </div>
                    </div>

                    {/* Barcode / QR Scan Bottom */}
                    <div className="px-6 py-6 bg-slate-50 flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <span className="text-[9px] font-mono text-slate-400 block mb-2 uppercase">PASS SECURITY SIGNATURE</span>
                        {/* Mock airline ticket barcode */}
                        <div className="h-10 w-full bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-around px-2 overflow-hidden">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <div 
                              key={i} 
                              style={{ width: `${Math.random() > 0.5 ? 2 : 5}px` }} 
                              className="h-full bg-slate-400 opacity-60" 
                            />
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-2xl shrink-0 border border-slate-200">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ShipHappens-Pass-${selectedShipment.id}`} 
                          alt="Shipment Boarding QR"
                          className="w-16 h-16"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-center gap-3">
                    <button 
                       onClick={() => handlePrintDoc("pass", selectedShipment.id)}
                       className="bg-[#ef233c] hover:bg-[#d90429] text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-[#ef233c]/20"
                    >
                      <Printer className="w-4 h-4" /> Print Boarding Pass
                    </button>
                    <button 
                      onClick={() => handlePrintDoc("invoice", selectedShipment.id)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Download Official Invoice
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center text-slate-400 shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-2" />
              <h2 className="text-slate-800 font-bold text-lg uppercase">Select Shipment</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Select a shipment from the list to view live details and status.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
