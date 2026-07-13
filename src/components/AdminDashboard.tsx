import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, DollarSign, Activity, AlertTriangle, Truck, 
  MapPin, ShieldCheck, Flame, Compass, HelpCircle, 
  RefreshCw, TrendingUp, TrendingDown, Users, FileText,
  ChevronDown, ChevronUp, Bell, Search, HeartPulse,
  Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Vehicle, Driver, Shipment, Expense, MaintenanceRecord } from "../types";
import MapWidget from "./MapWidget";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
  theme?: string;
  toggleTheme?: () => void;
}

interface SectionCardProps {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  collapsedPreview: React.ReactNode;
}

function SectionCard({
  id,
  title,
  description,
  icon,
  badge,
  isExpanded,
  onToggle,
  children,
  collapsedPreview,
}: SectionCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex justify-between items-center bg-white hover:bg-slate-50/50 transition-all"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h2>
              {badge && <div>{badge}</div>}
            </div>
            {description && <p className="text-xs text-slate-500 truncate max-w-xl">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          {!isExpanded && <div className="hidden sm:block">{collapsedPreview}</div>}
          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 border-t border-slate-100 bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboard({ user, onLogout, theme, toggleTheme }: AdminDashboardProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    operations: true,
    map: true,
    alerts: true,
    health: false,
    revenue: false,
    maintenance: false,
    renewals: false,
  });

  // Active sub-tab under Operations Summary
  const [activeOpsTab, setActiveOpsTab] = useState<'active' | 'delayed' | 'fleet' | 'revenue' | 'alerts'>('active');

  // License renewals expiry filter toggle
  const [expiryDaysFilter, setExpiryDaysFilter] = useState<7 | 30 | 60>(30);

  // Selected Active Shipment ID for the Live Fleet Map
  const [selectedMapShipmentId, setSelectedMapShipmentId] = useState<string>("");

  // Search filter for vehicles in Fleet Health
  const [vehicleSearch, setVehicleSearch] = useState("");

  useEffect(() => {
    fetchAdminAnalytics();
  }, []);

  const fetchAdminAnalytics = async () => {
    try {
      const [vRes, dRes, sRes, eRes, mRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/drivers"),
        fetch("/api/shipments"),
        fetch("/api/expenses"),
        fetch("/api/maintenance"),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      const vData = await vRes.json();
      const dData = await dRes.json();
      const sData = await sRes.json();
      const eData = await eRes.json();
      const mData = await mRes.json();

      setVehicles(vData);
      setDrivers(dData);
      setShipments(sData);
      setExpenses(eData);
      setMaintenance(mData);

      // Auto-select first active/delayed shipment for Map Widget
      const firstActive = sData.find((s: Shipment) => 
        ['IN_TRANSIT', 'DELAYED', 'PICKED_UP', 'AT_HUB', 'OUT_FOR_DELIVERY'].includes(s.status)
      );
      if (firstActive) {
        setSelectedMapShipmentId(firstActive.id);
      } else if (sData.length > 0) {
        setSelectedMapShipmentId(sData[0].id);
      }
    } catch (err) {
      console.error("Failed to load admin analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleKpiClick = (tab: 'active' | 'delayed' | 'fleet' | 'revenue' | 'alerts') => {
    setActiveOpsTab(tab);
    setExpandedSections(prev => ({
      ...prev,
      operations: true
    }));
  };

  // ----------------------------------------------------
  // INTELLIGENT ANALYTICAL DERIVATIONS & BUSINESS METRICS
  // ----------------------------------------------------

  // 1. Calculate overall Fleet Health Score out of 100
  const calculateFleetHealth = () => {
    if (vehicles.length === 0) return 100;
    const maintenanceDeduction = vehicles.filter(v => v.maintenanceOverdue).length * 15;
    const avgEngineHealth = vehicles.reduce((sum, v) => sum + v.engineHealth, 0) / vehicles.length;
    const avgTyreHealth = vehicles.reduce((sum, v) => sum + v.tyreHealth, 0) / vehicles.length;
    
    let baseScore = (avgEngineHealth + avgTyreHealth) / 2;
    baseScore -= maintenanceDeduction;
    return Math.min(100, Math.max(40, Math.round(baseScore)));
  };

  // 2. Money Leak Detector Metrics
  const getMoneyLeakMetrics = () => {
    const fuelExpenses = expenses.filter(e => e.category === "FUEL");
    let highestFuelVehicle = "MH-04-GP-8834 (Tata Signa)";
    let maxFuelAmount = 8400;

    let highestMaintVehicle = "DL-01-AA-4439 (Mahindra Blazo)";
    let maxMaintAmount = 42000;

    let leastEfficientRoute = "Delhi NCR ↔ Jaipur Express (Toll overload)";

    return {
      fuelLeak: { name: highestFuelVehicle, cost: maxFuelAmount },
      maintLeak: { name: highestMaintVehicle, cost: maxMaintAmount },
      routeLeak: leastEfficientRoute
    };
  };

  // 3. Driver license expiry filter logic
  const getExpiringDrivers = () => {
    const today = new Date("2026-07-11"); // Constant project timeline anchor
    return drivers.filter(d => {
      const expDate = new Date(d.licenseExpiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= expiryDaysFilter;
    });
  };

  const leaks = getMoneyLeakMetrics();
  const fleetHealth = calculateFleetHealth();
  const expiringDrivers = getExpiringDrivers();

  // Dynamic status derivations
  const activeShipmentsList = shipments.filter(s => 
    ['IN_TRANSIT', 'PICKED_UP', 'AT_HUB', 'OUT_FOR_DELIVERY', 'CONFIRMED'].includes(s.status)
  );
  const delayedShipmentsList = shipments.filter(s => s.status === 'DELAYED');

  // Available vehicles
  const busyVehIds = activeShipmentsList.map(s => s.vehicleId).filter(Boolean);
  const availableVehiclesList = vehicles.filter(v => v.status === 'ACTIVE' && !busyVehIds.includes(v.id));

  // Available drivers
  const busyDriverIds = activeShipmentsList.map(s => s.driverId).filter(Boolean);
  const availableDriversList = drivers.filter(d => d.status === 'AVAILABLE' && !busyDriverIds.includes(d.id));

  // Financial calculations
  const totalInvoicedToday = shipments
    .filter(s => s.status !== 'CANCELLED')
    .reduce((sum, s) => sum + (s.weight * 14.5), 0);
  const totalCostToday = expenses.reduce((sum, e) => sum + e.amount, 0) + maintenance.reduce((sum, m) => sum + m.cost, 0);
  const netProfit = Math.max(0, totalInvoicedToday - totalCostToday);

  // Critical alerts list compilation
  const criticalOverdueVehicles = vehicles.filter(v => v.maintenanceOverdue);
  const criticalLowFuelVehicles = vehicles.filter(v => v.fuelLevel < 15);
  const criticalLowHealthVehicles = vehicles.filter(v => v.engineHealth < 70 || v.tyreHealth < 60);
  const criticalExpiringLicenses = drivers.filter(d => {
    const today = new Date("2026-07-11");
    const expDate = new Date(d.licenseExpiryDate);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  });

  const totalCriticalAlertsCount = 
    criticalOverdueVehicles.length + 
    criticalLowFuelVehicles.length + 
    delayedShipmentsList.length + 
    criticalExpiringLicenses.length;

  return (
    <div className="min-h-screen bg-[#f6f5f0] text-slate-800 font-sans pb-16 transition-all">
      
      {/* Navigation Banner */}
      <nav className="border-b border-slate-200 bg-white/90 sticky top-0 z-30 px-6 py-4 flex justify-between items-center backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#ef233c]" />
          </div>
          <div>
            <h2 className="text-md font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              Ship Happens <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg text-[10px] border border-purple-200 uppercase font-mono font-bold">Admin</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{user?.name || "Malhotra"}</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}
          <div className="hidden md:flex bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 items-center gap-4 text-xs">
            <span className="text-slate-500">System Status: <span className="text-emerald-600 font-bold font-mono">Operational</span></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-700 font-bold block">{user?.name || "Admin"}</span>
            <button 
              onClick={onLogout} 
              className="text-[10px] text-rose-600 font-mono block hover:text-rose-500 uppercase tracking-widest font-bold cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 mt-6">

        {/* TODAY'S OVERVIEW CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Overview</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5 md:gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span><strong className="text-slate-800 font-semibold">{activeShipmentsList.length}</strong> Active Trips</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span><strong className="text-slate-800 font-semibold">{delayedShipmentsList.length}</strong> Delayed {delayedShipmentsList.length === 1 ? "Trip" : "Trips"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span><strong className="text-slate-800 font-semibold">{criticalOverdueVehicles.length}</strong> Maintenance Alerts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span><strong className="text-slate-800 font-semibold">₹{(totalInvoicedToday / 100000).toFixed(2)}L</strong> Revenue Today</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* TOP COMMAND SUB-HEADER: Operations KPI Overview with direct linkages */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          
          <button
            type="button"
            onClick={() => handleKpiClick('active')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group shadow-sm ${
              activeOpsTab === 'active' && expandedSections.operations
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className={`text-[9px] font-mono uppercase tracking-wider font-bold block mb-1 ${
              activeOpsTab === 'active' && expandedSections.operations ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              Active Trips
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono">{activeShipmentsList.length}</span>
              <span className="text-[10px] opacity-75 font-mono">En Route</span>
            </div>
            <div className="mt-2 text-[10px] opacity-80 truncate">Click to inspect corridors</div>
          </button>

          <button
            type="button"
            onClick={() => handleKpiClick('delayed')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group shadow-sm ${
              activeOpsTab === 'delayed' && expandedSections.operations
                ? 'bg-[#ef233c] text-white border-[#ef233c]' 
                : 'bg-white text-slate-800 border-slate-200 hover:border-[#ef233c]/30'
            }`}
          >
            <span className={`text-[9px] font-mono uppercase tracking-wider font-bold block mb-1 ${
              activeOpsTab === 'delayed' && expandedSections.operations ? 'text-white' : 'text-rose-600'
            }`}>
              Delayed Trips
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono">{delayedShipmentsList.length}</span>
              <span className="text-[10px] opacity-75 font-mono">Stalled</span>
            </div>
            <div className="mt-2 text-[10px] opacity-80 truncate">Urgent re-routing needed</div>
          </button>

          <button
            type="button"
            onClick={() => handleKpiClick('fleet')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group shadow-sm ${
              activeOpsTab === 'fleet' && expandedSections.operations
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className={`text-[9px] font-mono uppercase tracking-wider font-bold block mb-1 ${
              activeOpsTab === 'fleet' && expandedSections.operations ? 'text-indigo-400' : 'text-slate-400'
            }`}>
              Fleet Available
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono">{availableVehiclesList.length}</span>
              <span className="text-[10px] opacity-75 font-mono">/ {vehicles.length} Trucks</span>
            </div>
            <div className="mt-2 text-[10px] opacity-80 truncate">Ready for dispatch</div>
          </button>

          <button
            type="button"
            onClick={() => handleKpiClick('revenue')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group shadow-sm ${
              activeOpsTab === 'revenue' && expandedSections.operations
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className={`text-[9px] font-mono uppercase tracking-wider font-bold block mb-1 ${
              activeOpsTab === 'revenue' && expandedSections.operations ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              Revenue Today
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono">₹{(totalInvoicedToday / 100000).toFixed(2)}L</span>
              <span className="text-[9px] opacity-75 font-mono">gross</span>
            </div>
            <div className="mt-2 text-[10px] opacity-80 truncate">Operating efficiency</div>
          </button>

          <button
            type="button"
            onClick={() => handleKpiClick('alerts')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group shadow-sm col-span-2 md:col-span-1 ${
              activeOpsTab === 'alerts' && expandedSections.operations
                ? 'bg-rose-950 text-rose-100 border-rose-950' 
                : 'bg-white text-slate-800 border-slate-200 hover:border-rose-600/30'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[9px] font-mono uppercase tracking-wider font-bold block ${
                activeOpsTab === 'alerts' && expandedSections.operations ? 'text-rose-400' : 'text-rose-600'
              }`}>
                Alerts
              </span>
              {totalCriticalAlertsCount > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-rose-600">{totalCriticalAlertsCount}</span>
              <span className="text-[10px] opacity-75 font-mono">Warnings</span>
            </div>
            <div className="mt-2 text-[10px] opacity-80 truncate">Issues needing resolution</div>
          </button>

        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-450 font-mono text-xs tracking-wider flex items-center justify-center gap-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#ef233c] animate-ping" /> Loading logistics dashboard...
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* SECTION 1: TODAY'S OPERATIONS SUMMARY (DETAIL TAB BOXES) */}
            <SectionCard
              id="operations"
              title="Today's Operations Summary"
              description="Overview of active shipments, fleet, and revenue."
              icon={<Activity className="w-5 h-5 text-[#ef233c]" />}
              badge={null}
              isExpanded={expandedSections.operations}
              onToggle={() => toggleSection("operations")}
              collapsedPreview={
                <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                  <span>Trips: <strong className="text-slate-800">{activeShipmentsList.length} Active</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Delayed: <strong className="text-rose-600">{delayedShipmentsList.length}</strong></span>
                </div>
              }
            >
              {/* Dynamic Answer to "How is today's transport operation performing?" */}
              <div className="bg-[#f6f5f0] border border-slate-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-left">
                  <h3 className="text-sm font-bold text-slate-800">
                    How is today's transport operation performing?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {delayedShipmentsList.length > 0 ? (
                      <span>
                        We have <strong className="text-slate-850 font-semibold">{activeShipmentsList.length} active trips</strong> en route, with <strong className="text-rose-600 font-semibold">{delayedShipmentsList.length} delayed routes</strong> that require attention.
                      </span>
                    ) : (
                      <span>
                        All <strong className="text-emerald-600 font-semibold">{activeShipmentsList.length} active trips</strong> are running on schedule.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shrink-0 shadow-sm font-mono font-bold">
                  {delayedShipmentsList.length > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-rose-750">{Math.round(((activeShipmentsList.length - delayedShipmentsList.length) / (activeShipmentsList.length || 1)) * 100)}% ON-TIME</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-750">100% ON-TIME</span>
                    </>
                  )}
                </div>
              </div>

              {/* Inside Operations Section: Sub-tabs based on header click */}
              <div className="bg-slate-100/80 border border-slate-200/60 rounded-xl p-1.5 flex flex-wrap gap-1 mb-5">
                {(['active', 'delayed', 'fleet', 'revenue', 'alerts'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveOpsTab(tab)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                      activeOpsTab === tab
                        ? 'bg-[#ef233c] text-white shadow-sm shadow-[#ef233c]/10'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/40'
                    }`}
                  >
                    {tab === 'active' && `Active Trips (${activeShipmentsList.length})`}
                    {tab === 'delayed' && `Delayed Trips (${delayedShipmentsList.length})`}
                    {tab === 'fleet' && `Fleet Available (${availableVehiclesList.length})`}
                    {tab === 'revenue' && `Revenue Today`}
                    {tab === 'alerts' && `Alerts (${totalCriticalAlertsCount})`}
                  </button>
                ))}
              </div>

              {/* Sub-tab Content Panels with progressive disclosure detail lists */}
              <AnimatePresence mode="wait">
                {activeOpsTab === 'active' && (
                  <motion.div
                    key="active-trips"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {activeShipmentsList.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 max-w-sm mx-auto my-4 shadow-sm">
                        <Truck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <h4 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">No Active Shipments</h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">All corridors are currently idle. No active en-route dispatches detected.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase tracking-wider">
                              <th className="py-2.5 px-3">Shipment ID</th>
                              <th className="py-2.5 px-3">Consignee</th>
                              <th className="py-2.5 px-3">Route Path</th>
                              <th className="py-2.5 px-3">Vehicle / Driver</th>
                              <th className="py-2.5 px-3">Transit Progress</th>
                              <th className="py-2.5 px-3 text-right">ETA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeShipmentsList.map(s => (
                              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                                <td className="py-3 px-3 font-mono font-bold text-[#ef233c]">{s.id}</td>
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-slate-800">{s.customerName}</div>
                                  <div className="text-[10px] text-slate-400">{s.cargoType}</div>
                                </td>
                                <td className="py-3 px-3 text-slate-600">
                                  <div className="flex items-center gap-1 font-mono text-[10px]">
                                    <span className="truncate max-w-[80px] block">{s.pickup.split(",")[0]}</span>
                                    <span>&rarr;</span>
                                    <span className="truncate max-w-[80px] block font-bold text-slate-700">{s.destination.split(",")[0]}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-slate-600">
                                  <div className="font-semibold">{s.vehicleNumber || 'N/A'}</div>
                                  <div className="text-[10px] text-slate-400">{s.driverName || 'No Driver assigned'}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${s.progress}%` }} />
                                    </div>
                                    <span className="font-mono font-bold text-slate-700">{s.progress}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-slate-700">{s.eta}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeOpsTab === 'delayed' && (
                  <motion.div
                    key="delayed-trips"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {delayedShipmentsList.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 font-mono text-xs uppercase border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        Operation fully on-schedule. No delayed corridors.
                      </div>
                    ) : (
                      <div className="space-y-3 text-xs">
                        {delayedShipmentsList.map(s => (
                          <div key={s.id} className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-rose-600" />
                              </div>
                              <div>
                                <span className="font-mono text-[10px] font-bold text-rose-600 block uppercase">Delayed Dispatch</span>
                                <strong className="text-slate-800 text-sm font-black">{s.id} &bull; {s.customerName}</strong>
                                <p className="text-slate-500 mt-1">Stuck on route <strong>{s.pickup.split(",")[0]} &rarr; {s.destination.split(",")[0]}</strong>. Driver: {s.driverName || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-2 shrink-0">
                              <span className="text-[10px] bg-rose-100 text-rose-700 font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">{s.eta}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Progress: {s.progress}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeOpsTab === 'fleet' && (
                  <motion.div
                    key="fleet-available"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {/* Available Trucks */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl text-left">
                      <h4 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-[#ef233c]" /> Available Trucks ({availableVehiclesList.length})
                      </h4>
                      {availableVehiclesList.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/10">
                          <Truck className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">All trucks active</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {availableVehiclesList.map(v => (
                            <div key={v.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                              <div>
                                <strong className="text-slate-800 font-mono block">{v.plateNumber}</strong>
                                <span className="text-[10px] text-slate-500">{v.model} &bull; Cap: {v.capacity}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono px-2 py-0.5 rounded-md font-bold uppercase">
                                  Ready
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Fuel: {v.fuelLevel}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Available Crew */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl text-left">
                      <h4 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-700" /> Available Drivers ({availableDriversList.length})
                      </h4>
                      {availableDriversList.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/10">
                          <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">All drivers in-transit</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {availableDriversList.map(d => (
                            <div key={d.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                              <div>
                                <strong className="text-slate-800 block">{d.name}</strong>
                                <span className="text-[10px] text-slate-500">License: {d.licenseNumber}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono px-2 py-0.5 rounded-md font-bold uppercase">
                                  Standby
                                </span>
                                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Rating: {d.safetyScore}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeOpsTab === 'revenue' && (
                  <motion.div
                    key="revenue-ledger"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-left text-xs"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                        <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest font-bold block mb-1">Gross Invoiced Volume</span>
                        <div className="text-2xl font-black font-mono text-emerald-800">₹{totalInvoicedToday.toLocaleString("en-IN")}</div>
                        <p className="text-[10px] text-slate-500 mt-2">Aggregated weight tariff calculated across {shipments.length} logged freight movements.</p>
                      </div>
                      
                      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                        <span className="text-[9px] font-mono text-rose-600 uppercase tracking-widest font-bold block mb-1">Aggregated Cost Overhead</span>
                        <div className="text-2xl font-black font-mono text-rose-800">₹{totalCostToday.toLocaleString("en-IN")}</div>
                        <p className="text-[10px] text-slate-500 mt-2">Combined costs representing logged fuel expenses, highway tolls, and overhauls.</p>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white">
                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold block mb-1">Estimated Net margins</span>
                        <div className="text-2xl font-black font-mono text-emerald-400">₹{netProfit.toLocaleString("en-IN")}</div>
                        <p className="text-[10px] text-slate-400 mt-2">Profitable margin after deducting operating and repair costs.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeOpsTab === 'alerts' && (
                  <motion.div
                    key="alerts-events"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {totalCriticalAlertsCount === 0 ? (
                      <p className="text-slate-400 font-mono text-center py-6 text-xs uppercase">No warning events logged.</p>
                    ) : (
                      <div className="space-y-2 text-xs text-left">
                        {criticalOverdueVehicles.map(v => (
                          <div key={v.id} className="p-3 bg-rose-50 border border-rose-200/60 rounded-xl flex justify-between items-center">
                            <div>
                              <strong className="text-rose-900 font-mono">{v.plateNumber}</strong>
                              <span className="text-slate-500 text-[11px] block">Mandatory maintenance service is critical overdue.</span>
                            </div>
                            <span className="text-[10px] text-rose-700 font-mono font-bold bg-rose-100 px-2 py-0.5 rounded-md">OVERDUE</span>
                          </div>
                        ))}

                        {criticalLowFuelVehicles.map(v => (
                          <div key={v.id} className="p-3 bg-rose-50 border border-rose-200/60 rounded-xl flex justify-between items-center">
                            <div>
                              <strong className="text-rose-900 font-mono">{v.plateNumber}</strong>
                              <span className="text-slate-500 text-[11px] block">Fuel reserve under critical threshold: <strong>{v.fuelLevel}%</strong> remaining.</span>
                            </div>
                            <span className="text-[10px] text-rose-700 font-mono font-bold bg-rose-100 px-2 py-0.5 rounded-md">LOW_FUEL</span>
                          </div>
                        ))}

                        {delayedShipmentsList.map(s => (
                          <div key={s.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center">
                            <div>
                              <strong className="text-amber-900 font-mono">{s.id}</strong>
                              <span className="text-slate-500 text-[11px] block">Route is delayed due to traffic congestion.</span>
                            </div>
                            <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-100 px-2 py-0.5 rounded-md">DELAYED</span>
                          </div>
                        ))}

                        {criticalExpiringLicenses.map(d => (
                          <div key={d.id} className="p-3 bg-rose-50 border border-rose-200/60 rounded-xl flex justify-between items-center">
                            <div>
                              <strong className="text-rose-900">{d.name}</strong>
                              <span className="text-slate-500 text-[11px] block">Commercial HGV license expires on <strong>{d.licenseExpiryDate}</strong> (Critical).</span>
                            </div>
                            <span className="text-[10px] text-rose-700 font-mono font-bold bg-rose-100 px-2 py-0.5 rounded-md">EXPIRING</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionCard>


            {/* SECTION 2: LIVE FLEET MAP */}
            <SectionCard
              id="map"
              title="Live Fleet Map"
              description="Real-time route visualization, ETA tracking, and active GPS locations."
              icon={<Compass className="w-5 h-5 text-[#ef233c]" />}
              badge={
                <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider animate-pulse">
                  ACTIVE GPS
                </span>
              }
              isExpanded={expandedSections.map}
              onToggle={() => toggleSection("map")}
              collapsedPreview={
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Tracking {activeShipmentsList.length} Active Vehicles</span>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Active Shipments Map Selector */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-left">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">Select Vehicle</span>
                    <strong className="text-xs text-slate-800">Active shipment and route tracking</strong>
                  </div>
                  <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {shipments.map((s) => {
                      const isActive = ['IN_TRANSIT', 'DELAYED', 'PICKED_UP', 'AT_HUB', 'OUT_FOR_DELIVERY'].includes(s.status);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedMapShipmentId(s.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold uppercase transition-all tracking-wider shrink-0 cursor-pointer ${
                            selectedMapShipmentId === s.id
                              ? "bg-[#ef233c] text-white"
                              : isActive
                                ? "bg-white border border-slate-200 text-[#ef233c] hover:bg-rose-50"
                                : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {s.id} {isActive ? "🚚" : "🏁"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Map Render */}
                {selectedMapShipmentId ? (
                  (() => {
                    const matchedShip = shipments.find(s => s.id === selectedMapShipmentId);
                    if (matchedShip) {
                      return (
                        <MapWidget
                          shipmentId={matchedShip.id}
                          pickup={matchedShip.pickup}
                          destination={matchedShip.destination}
                          progress={matchedShip.progress}
                          status={matchedShip.status}
                        />
                      );
                    }
                    return null;
                  })()
                ) : (
                  <div className="h-[400px] bg-slate-900 rounded-[32px] flex items-center justify-center font-mono text-xs text-slate-400 border border-slate-800">
                    Select a shipment above to view route and tracking information.
                  </div>
                )}
              </div>
            </SectionCard>


            {/* SECTION 3: CRITICAL ALERTS */}
            <SectionCard
              id="alerts"
              title="Critical Alerts"
              description="High priority logistics delays, vehicle overhauls, and driver license renewals."
              icon={<ShieldAlert className="w-5 h-5 text-[#ef233c]" />}
              badge={
                totalCriticalAlertsCount > 0 ? (
                  <span className="text-[10px] bg-[#ef233c] text-white px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider animate-pulse">
                    {totalCriticalAlertsCount} Action Required
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                    Normal Status
                  </span>
                )
              }
              isExpanded={expandedSections.alerts}
              onToggle={() => toggleSection("alerts")}
              collapsedPreview={
                <span className={`text-xs font-mono font-bold ${totalCriticalAlertsCount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  {totalCriticalAlertsCount > 0 ? `${totalCriticalAlertsCount} urgent issues` : "All systems normal"}
                </span>
              }
            >
              {totalCriticalAlertsCount === 0 ? (
                <div className="text-center py-8 text-slate-400 font-mono text-xs uppercase border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  All systems operating within normal limits. No active alerts.
                </div>
              ) : (
                <div className="space-y-3 text-xs text-left">
                  {criticalOverdueVehicles.map(v => (
                    <div key={v.id} className="p-4 rounded-xl bg-rose-50/50 border border-rose-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-[#ef233c] animate-pulse" />
                          <strong className="text-slate-800 font-mono text-sm">{v.plateNumber} (Overdue overhaul)</strong>
                        </div>
                        <p className="text-slate-500">This heavy commercial truck has exceeded its recommended service interval by 30+ days. Operating without maintenance may impact performance.</p>
                      </div>
                      <button 
                        onClick={() => alert(`Service dispatch checklist generated for vehicle ${v.plateNumber}`)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shrink-0 cursor-pointer"
                      >
                        Dispatch to workshop
                      </button>
                    </div>
                  ))}

                  {delayedShipmentsList.map(s => (
                    <div key={s.id} className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <strong className="text-slate-800 font-mono text-sm">{s.id} (Route delayed)</strong>
                        </div>
                        <p className="text-slate-500">Currently stalled at <strong>{s.pickup.split(",")[0]} ↔ {s.destination.split(",")[0]}</strong> route. Estimated delivery pushed to: {s.eta}.</p>
                      </div>
                      <button 
                        onClick={() => alert(`Client communication logged. Push notification sent to ${s.customerName}.`)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shrink-0 cursor-pointer"
                      >
                        Notify customer
                      </button>
                    </div>
                  ))}

                  {criticalExpiringLicenses.map(d => (
                    <div key={d.id} className="p-4 rounded-xl bg-rose-50/50 border border-rose-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-[#ef233c] animate-pulse" />
                          <strong className="text-slate-800 text-sm">{d.name} (License Expiring)</strong>
                        </div>
                        <p className="text-slate-500">Commercial driver license expires on <strong>{d.licenseExpiryDate}</strong>. Drivers are not permitted to operate commercial vehicles with expired licenses.</p>
                      </div>
                      <button 
                        onClick={() => alert(`SMS warning notification sent to driver ${d.name}`)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shrink-0 cursor-pointer"
                      >
                        Alert driver
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>


            {/* SECTION 4: FLEET HEALTH */}
            <SectionCard
              id="health"
              title="Fleet Health"
              description="Engine health indices, tire tread wear, and active battery status."
              icon={<HeartPulse className="w-5 h-5 text-[#ef233c]" />}
              badge={
                <span className="text-[10px] bg-indigo-900 text-indigo-100 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                  Health Index: {fleetHealth}%
                </span>
              }
              isExpanded={expandedSections.health}
              onToggle={() => toggleSection("health")}
              collapsedPreview={
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span>Score: <strong className="text-slate-800">{fleetHealth}/100</strong></span>
                </div>
              }
            >
              <div className="space-y-5 text-left">
                {/* Score Summary Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Consolidated Fleet Health</span>
                    <h3 className="text-3xl font-bold font-mono mt-1 text-white">{fleetHealth} <span className="text-xs text-slate-400 font-normal">/ 100</span></h3>
                    <p className="text-[11px] text-slate-300 mt-1">Based on health metrics tracking engine parameters, tyre conditions, and battery levels.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-xl text-[10px] font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Operational
                  </div>
                </div>

                {/* Search Bar for Vehicles */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search fleet by plate number, model..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#ef233c] focus:border-[#ef233c] pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-800"
                  />
                </div>

                {/* Fleet Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles
                    .filter(v => v.plateNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.model.toLowerCase().includes(vehicleSearch.toLowerCase()))
                    .map(v => (
                      <div key={v.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-200">
                        <div className="flex justify-between items-start border-b border-slate-200/50 pb-2 mb-3">
                          <div>
                            <strong className="text-xs text-slate-800 block font-mono">{v.plateNumber}</strong>
                            <span className="text-[10px] text-slate-500">{v.model} &bull; Odo: {v.odometer.toLocaleString()} km</span>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            v.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {v.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div>
                            <div className="flex justify-between text-slate-500 mb-1">
                              <span>Engine Health</span>
                              <strong className="font-mono text-slate-700">{v.engineHealth}%</strong>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1">
                              <div className={`h-1 rounded-full ${v.engineHealth < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${v.engineHealth}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-500 mb-1">
                              <span>Tyre Health</span>
                              <strong className="font-mono text-slate-700">{v.tyreHealth}%</strong>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1">
                              <div className={`h-1 rounded-full ${v.tyreHealth < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${v.tyreHealth}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-500 mb-1">
                              <span>Battery Charge</span>
                              <strong className="font-mono text-slate-700">{v.batteryLevel}%</strong>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1">
                              <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${v.batteryLevel}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-500 mb-1">
                              <span>Fuel Level</span>
                              <strong className="font-mono text-slate-700">{v.fuelLevel}%</strong>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1">
                              <div className={`h-1 rounded-full ${v.fuelLevel < 25 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${v.fuelLevel}%` }} />
                            </div>
                          </div>
                        </div>

                        {v.maintenanceOverdue && (
                          <div className="mt-3 text-[9px] text-rose-600 bg-rose-50 border border-rose-100 p-1.5 rounded-lg font-mono font-bold uppercase flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500" /> OVERDUE INSPECTION REPAIRS REQUIRED
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </SectionCard>


            {/* SECTION 5: REVENUE & COST */}
            <SectionCard
              id="revenue"
              title="Revenue & Cost"
              description="Gross ledger summaries, diesel fuel expenses, and cost inefficiency tracking."
              icon={<DollarSign className="w-5 h-5 text-[#ef233c]" />}
              badge={
                <span className="text-[10px] bg-[#ef233c]/10 text-[#ef233c] border border-[#ef233c]/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                  Margin: {((netProfit / (totalInvoicedToday || 1)) * 100).toFixed(0)}%
                </span>
              }
              isExpanded={expandedSections.revenue}
              onToggle={() => toggleSection("revenue")}
              collapsedPreview={
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span>Gross: <strong className="text-slate-800 font-bold">₹{(totalInvoicedToday / 100000).toFixed(1)}L</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-600 font-bold">Profit: ₹{(netProfit / 100000).toFixed(1)}L</span>
                </div>
              }
            >
              <div className="space-y-6 text-left">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Total Freight Invoices</span>
                      <h3 className="text-2xl font-bold font-mono text-slate-800">₹{totalInvoicedToday.toLocaleString("en-IN")}</h3>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-3">
                      <TrendingUp className="w-3.5 h-3.5" /> Normal Cargo Operations
                    </span>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Aggregated Fleet Cost</span>
                      <h3 className="text-2xl font-bold font-mono text-slate-800">₹{totalCostToday.toLocaleString("en-IN")}</h3>
                    </div>
                    <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-3">
                      <TrendingUp className="w-3.5 h-3.5" /> High Toll Overheads
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between text-white">
                    <div>
                      <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block mb-1">Estimated Operational Earnings</span>
                      <h3 className="text-2xl font-bold font-mono text-emerald-400">₹{netProfit.toLocaleString("en-IN")}</h3>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 mt-3">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Margin: {((netProfit / (totalInvoicedToday || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* MONEY LEAKS */}
                <div className="bg-rose-50/30 border border-rose-150 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-rose-900 uppercase font-mono tracking-widest mb-3 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-600 animate-pulse" /> Cost Inefficiencies
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-white p-3.5 rounded-lg border border-rose-150 flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Highest Fuel Usage</span>
                        <strong className="text-slate-800 block truncate font-semibold">{leaks.fuelLeak.name}</strong>
                        <p className="text-xs font-mono font-bold text-[#ef233c] mt-1">₹{leaks.fuelLeak.cost.toLocaleString("en-IN")} / round</p>
                      </div>
                      <span className="text-[9px] text-rose-600 font-bold block mt-3">&bull; Solution: Injector nozzle check</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-rose-150 flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Highest Maintenance</span>
                        <strong className="text-slate-800 block truncate font-semibold">{leaks.maintLeak.name}</strong>
                        <p className="text-xs font-mono font-bold text-[#ef233c] mt-1">₹{leaks.maintLeak.cost.toLocaleString("en-IN")} total</p>
                      </div>
                      <span className="text-[9px] text-rose-600 font-bold block mt-3">&bull; Recommended: Warranty audit</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-rose-150 flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Inefficient Highway Route</span>
                        <strong className="text-slate-800 block truncate font-semibold">{leaks.routeLeak}</strong>
                        <p className="text-[10px] text-slate-400 mt-1">Extreme bypass congestion and heavy state toll tariffs.</p>
                      </div>
                      <span className="text-[9px] text-[#ef233c] font-bold block mt-3">&bull; Alternative: Divert to Bypass B</span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>


            {/* SECTION 6: MAINTENANCE DUE */}
            <SectionCard
              id="maintenance"
              title="Maintenance Due"
              description="Engine inspections, parts replacement checklists, and repair logs."
              icon={<AlertTriangle className="w-5 h-5 text-[#ef233c]" />}
              badge={
                criticalOverdueVehicles.length > 0 ? (
                  <span className="text-[10px] bg-amber-500 text-slate-900 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                    {criticalOverdueVehicles.length} Overdue
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                    No Overdue Maintenance
                  </span>
                )
              }
              isExpanded={expandedSections.maintenance}
              onToggle={() => toggleSection("maintenance")}
              collapsedPreview={
                <span className="text-xs font-mono text-slate-500">
                  Overdue Servicings: <strong className={criticalOverdueVehicles.length > 0 ? 'text-rose-600' : 'text-slate-800'}>{criticalOverdueVehicles.length}</strong>
                </span>
              }
            >
              <div className="space-y-4 text-xs text-left">
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <strong className="text-slate-800 text-sm font-semibold">DL-01-AA-4439 (Mahindra Blazo X 49)</strong>
                        <p className="text-slate-500 mt-0.5">Critical compression leakage detected in cylinders & 37 days overdue for scheduled maintenance.</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-rose-100 text-rose-700 font-mono font-bold px-3 py-1 rounded-full uppercase shrink-0">
                      CRITICAL OVERDUE
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <strong className="text-slate-800 text-sm font-semibold">GJ-05-UU-2941 (BharatBenz 2823R)</strong>
                        <p className="text-slate-500 mt-0.5">Left rear tire pressures degraded by 18% & friction pads approaching 7% warning limit.</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-amber-100 text-amber-700 font-mono font-bold px-3 py-1 rounded-full uppercase shrink-0">
                      SERVICE NOTICE
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-2">Recent Servicings</span>
                  <div className="space-y-2">
                    {maintenance.slice(0, 3).map(m => (
                      <div key={m.id} className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center text-[11px] shadow-sm">
                        <div>
                          <strong className="text-slate-800 font-mono font-semibold">{m.vehicleId}</strong>
                          <span className="text-slate-500 block">{m.description}</span>
                        </div>
                        <div className="text-right font-mono font-bold text-slate-600">
                          ₹{m.cost.toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>


            {/* SECTION 7: DRIVER LICENSE RENEWALS */}
            <SectionCard
              id="renewals"
              title="Driver License Renewals"
              description="Track driver licenses and renewal timelines."
              icon={<ShieldCheck className="w-5 h-5 text-[#ef233c]" />}
              badge={
                expiringDrivers.length > 0 ? (
                  <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    {expiringDrivers.length} Expiring soon
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                    100% Authorized
                  </span>
                )
              }
              isExpanded={expandedSections.renewals}
              onToggle={() => toggleSection("renewals")}
              collapsedPreview={
                <span className="text-xs font-mono text-slate-500">
                  Expiring in {expiryDaysFilter}D: <strong className={expiringDrivers.length > 0 ? 'text-rose-600' : 'text-slate-800'}>{expiringDrivers.length}</strong>
                </span>
              }
            >
              <div className="space-y-4 text-left text-xs">
                {/* Renewals Filter and Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Timeline Filter</span>
                  
                  <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-[10px] font-bold">
                    {([7, 30, 60] as const).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setExpiryDaysFilter(d)}
                        className={`px-3 py-1 rounded-md transition-all uppercase cursor-pointer ${
                          expiryDaysFilter === d 
                            ? 'bg-[#ef233c] text-white shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expiry List */}
                {expiringDrivers.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-[10px] font-mono uppercase">
                    No driver licenses expiring within the selected {expiryDaysFilter}-day period.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expiringDrivers.map((drv) => (
                      <div key={drv.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex justify-between items-start">
                            <strong className="text-slate-800 text-sm font-semibold">{drv.name}</strong>
                            <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded font-mono font-bold">
                              {drv.licenseExpiryDate}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
                            <span>License ID: {drv.licenseNumber}</span>
                            <span>Completed: {drv.completedTrips} trips</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-200/50 pt-2.5 mt-2">
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Safety Rating: <span className="text-emerald-600 font-bold">{drv.safetyScore}%</span>
                          </span>
                          <button
                            onClick={() => alert(`Warning notification successfully sent to ${drv.name}`)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition-all cursor-pointer"
                          >
                            Send Alert
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

          </div>
        )}

      </div>
    </div>
  );
}
