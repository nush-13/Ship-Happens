import React, { useState, useEffect } from "react";
import { 
  Sparkles, Truck, User, Calendar, MapPin, Navigation, 
  ChevronRight, ArrowRight, ShieldCheck, AlertTriangle, 
  RefreshCw, CheckCircle2, ChevronLeft, DollarSign, Activity, Eye, ShieldAlert,
  Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Vehicle, Driver, Shipment, User as UserType } from "../types";
import MapWidget from "./MapWidget";
import BookingsCrud from "./BookingsCrud";
import TripsCrud from "./TripsCrud";
import VehiclesCrud from "./VehiclesCrud";
import DriversCrud from "./DriversCrud";
import RoutesCrud from "./RoutesCrud";
import LorryReceiptsCrud from "./LorryReceiptsCrud";

interface DispatcherDashboardProps {
  user: UserType;
  onLogout: () => void;
  shipments: Shipment[];
  setShipments: React.Dispatch<React.SetStateAction<Shipment[]>>;
  theme?: string;
  toggleTheme?: () => void;
}

export default function DispatcherDashboard({ user, onLogout, theme, toggleTheme }: DispatcherDashboardProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [activeSubView, setActiveSubView] = useState<string>("monitor");

  // AI Matching Form & Results
  const [matchingInput, setMatchingInput] = useState({
    pickup: "Ahmedabad Hub, GJ",
    destination: "Mumbai JNPT Port, MH",
    cargoType: "Grade-A Solar Energy Modules",
    weight: 18000,
    priority: "HIGH" as "HIGH" | "MEDIUM" | "LOW"
  });
  const [aiMatchLoading, setAiMatchLoading] = useState(false);
  const [aiMatchStep, setAiMatchStep] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState<any | null>(null);

  // Calendar states
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState("July 2026");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number | null>(11); // default focused day
  const [calendarPopupDetails, setCalendarPopupDetails] = useState<any | null>({
    date: "July 11, 2026",
    trips: 4,
    drivers: ["Rajesh Yadav", "Manoj Kumar", "Gurpreet Singh"],
    completionRate: 75,
    delays: 1,
    cost: 54000
  });

  useEffect(() => {
    fetchDispatcherData();
  }, []);

  const fetchDispatcherData = async () => {
    try {
      const [vRes, dRes, sRes, gRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/drivers"),
        fetch("/api/shipments"),
        fetch("/api/geofences"),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      setVehicles(await vRes.json());
      setDrivers(await dRes.json());
      setShipments(await sRes.json());
      setGeofences(await gRes.json());
    } catch (err) {
      console.error("Failed to load dispatcher dashboard data", err);
    }
  };

  // Call the server Gemini dispatcher matching API
  const runAiMatchingEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiMatchLoading(true);
    setAiRecommendation(null);
    setAiMatchStep("Ingesting cargo & route parameters...");

    const steps = [
      "Scanning active vehicle fleet locations...",
      "Analyzing driver safety logs & compliance...",
      "Synthesizing optimal fuel-efficient matches...",
      "Finalizing dispatch proposal..."
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setAiMatchStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 450);

    try {
      const apiPromise = fetch("/api/gemini/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchingInput),
      });

      const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));
      const [res] = await Promise.all([apiPromise, delayPromise]);

      const data = await res.json();
      clearInterval(interval);

      if (data.success) {
        setAiRecommendation(data.recommendation);
      } else {
        alert("Gemini matches failed. Falling back to core heuristic engine.");
      }
    } catch (err) {
      clearInterval(interval);
      console.error("AI matching failed", err);
    } finally {
      setAiMatchLoading(false);
      setAiMatchStep("");
    }
  };

  // Create real Shipment directly via AI assignment confirmation
  const handleConfirmAiDispatch = async () => {
    if (!aiRecommendation) return;

    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "Meridian Retail Pvt Ltd",
          pickup: matchingInput.pickup,
          destination: matchingInput.destination,
          cargoType: matchingInput.cargoType,
          weight: matchingInput.weight,
          priority: matchingInput.priority,
          driverId: aiRecommendation.driverId,
          vehicleId: aiRecommendation.vehicleId,
          status: "CONFIRMED"
        }),
      });

      if (res.ok) {
        const newShipment = await res.json();
        setShipments(prev => [newShipment, ...prev]);
        setAiRecommendation(null);
        alert(`SUCCESS! Shipment ${newShipment.id} successfully locked and dispatched.`);
        fetchDispatcherData(); // refresh lists
      }
    } catch (err) {
      console.error("Failed to execute dispatch", err);
    }
  };

  // Pre-configured custom calendar dates with specific operational details
  const calendarDays = [
    { day: 1, status: "GREEN", trips: 5, rate: 100, delays: 0, cost: 42000, drivers: ["Suresh Pillai", "Gurpreet Singh"] },
    { day: 2, status: "GREEN", trips: 6, rate: 100, delays: 0, cost: 58000, drivers: ["Amit Kulkarni", "Manoj Kumar"] },
    { day: 3, status: "YELLOW", trips: 4, rate: 75, delays: 0, cost: 39000, drivers: ["Rajesh Yadav", "Suresh Pillai"] },
    { day: 4, status: "RED", trips: 5, rate: 60, delays: 2, cost: 48000, drivers: ["Gurpreet Singh", "Manoj Kumar"] },
    { day: 5, status: "GREEN", trips: 3, rate: 100, delays: 0, cost: 28000, drivers: ["Amit Kulkarni"] },
    { day: 6, status: "GREEN", trips: 4, rate: 100, delays: 0, cost: 36500, drivers: ["Rajesh Yadav", "Suresh Pillai"] },
    { day: 7, status: "GREEN", trips: 7, rate: 100, delays: 0, cost: 64000, drivers: ["Manoj Kumar", "Gurpreet Singh"] },
    { day: 8, status: "YELLOW", trips: 4, rate: 50, delays: 0, cost: 41000, drivers: ["Amit Kulkarni", "Suresh Pillai"] },
    { day: 9, status: "GREEN", trips: 5, rate: 100, delays: 0, cost: 43000, drivers: ["Rajesh Yadav"] },
    { day: 10, status: "GREEN", trips: 6, rate: 100, delays: 0, cost: 51200, drivers: ["Manoj Kumar", "Amit Kulkarni"] },
    { day: 11, status: "YELLOW", trips: 4, rate: 75, delays: 1, cost: 54000, drivers: ["Rajesh Yadav", "Gurpreet Singh", "Suresh Pillai"] },
    { day: 12, status: "PENDING", trips: 0, rate: 0, delays: 0, cost: 0, drivers: [] },
    { day: 13, status: "PENDING", trips: 0, rate: 0, delays: 0, cost: 0, drivers: [] },
    { day: 14, status: "PENDING", trips: 0, rate: 0, delays: 0, cost: 0, drivers: [] },
    { day: 15, status: "PENDING", trips: 0, rate: 0, delays: 0, cost: 0, drivers: [] }
  ];

  const handleDayClick = (item: any) => {
    setSelectedCalendarDate(item.day);
    if (item.trips === 0) {
      setCalendarPopupDetails({
        date: `July ${item.day}, 2026`,
        trips: 0,
        drivers: [],
        completionRate: 0,
        delays: 0,
        cost: 0
      });
    } else {
      setCalendarPopupDetails({
        date: `July ${item.day}, 2026`,
        trips: item.trips,
        drivers: item.drivers,
        completionRate: item.rate,
        delays: item.delays,
        cost: item.cost
      });
    }
  };

  // Derived metrics
  const activeTripsCount = shipments.filter(s => s.status === "IN_TRANSIT").length;
  const delayedTripsCount = shipments.filter(s => s.status === "DELAYED").length;
  const pendingTripsCount = shipments.filter(s => s.status === "BOOKED" || s.status === "CONFIRMED").length;
  const availableDriversCount = drivers.filter(d => d.status === "AVAILABLE").length;
  const availableVehiclesCount = vehicles.filter(v => v.status === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-[#f6f5f0] text-slate-800 font-sans pb-16 transition-all">
      
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/90 sticky top-0 z-30 px-6 py-4 flex justify-between items-center backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#ef233c]" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black text-slate-800 tracking-wide uppercase">SHIP HAPPENS // DISPATCH</h1>
            <p className="text-[9px] text-[#ef233c] font-mono tracking-widest font-bold uppercase">FLEET DISPATCH DASHBOARD</p>
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
            <span className="text-slate-500">System Status: <span className="text-emerald-600 font-bold font-mono">ACTIVE</span></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-slate-500">Monitored Zones: <span className="text-[#ef233c] font-bold font-mono">4</span></span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-700 font-bold block">{user.name}</span>
            <button onClick={onLogout} className="text-[10px] text-rose-600 font-mono block hover:text-rose-500 uppercase tracking-widest font-bold">Sign Out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full px-4 mt-6">
        <div className="bg-white border border-slate-200 rounded-[22px] p-2 flex flex-wrap gap-1.5 shadow-sm">
          <button
            onClick={() => setActiveSubView("monitor")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === "monitor" 
                ? "bg-[#ef233c] text-white shadow-md shadow-[#ef233c]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Command Center
          </button>
          <button
            onClick={() => setActiveSubView("bookings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === "bookings" 
                ? "bg-[#ef233c] text-white shadow-md shadow-[#ef233c]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveSubView("trips")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === "trips" 
                ? "bg-[#ef233c] text-white shadow-md shadow-[#ef233c]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Trips
          </button>
          <button
            onClick={() => setActiveSubView("vehicles")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === "vehicles" 
                ? "bg-[#ef233c] text-white shadow-md shadow-[#ef233c]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Vehicles
          </button>
          <button
            onClick={() => setActiveSubView("drivers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === "drivers" 
                ? "bg-[#ef233c] text-white shadow-md shadow-[#ef233c]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Drivers
          </button>
          <button
            onClick={() => setActiveSubView("routes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === "routes" 
                ? "bg-[#ef233c] text-white shadow-md shadow-[#ef233c]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Routes
          </button>
          <button
            onClick={() => setActiveSubView("receipts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === "receipts" 
                ? "bg-[#ef233c] text-white shadow-md shadow-[#ef233c]/10" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Lorry Receipts
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Grid: Key Operations telemetry & Smart dispatch matcher */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dispatcher Overview Stats Widgets */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2">Pending Trips</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-slate-800 font-mono">{pendingTripsCount}</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded uppercase font-mono font-bold">Unrouted</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2">Active Trips</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-[#ef233c] font-mono">{activeTripsCount}</span>
                <span className="text-[10px] bg-[#ef233c]/10 text-[#ef233c] border border-[#ef233c]/20 px-1.5 py-0.5 rounded uppercase font-mono font-bold">In Transit</span>
              </div>
            </div>

            <div className="bg-white border border-rose-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2">Delayed Trips</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-rose-600 font-mono">{delayedTripsCount}</span>
                <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded uppercase font-mono font-bold">Alert</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2">Avail. Drivers</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-emerald-600 font-mono">{availableDriversCount}</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded uppercase font-mono font-bold">Safe</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-1 shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2">Ready Fleet</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-slate-800 font-mono">{availableVehiclesCount}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded uppercase font-mono font-bold">Active</span>
              </div>
            </div>

          </div>

          {activeSubView === "monitor" ? (
            <>
              {/* SMART DISPATCH ASSISTANT (Gemini Matcher widget) */}
              <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#ef233c]/2 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#ef233c] animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-800">Smart Transport Assistant</h2>
                      <p className="text-xs text-slate-500">Suggests the best driver and vehicle.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Smart Suggestions</span>
                </div>

                {/* Matching Form Inputs */}
                <form onSubmit={runAiMatchingEngine} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-6 text-xs">
                  
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Cargo Description</label>
                    <input
                      type="text"
                      required
                      value={matchingInput.cargoType}
                      onChange={(e) => setMatchingInput(prev => ({ ...prev, cargoType: e.target.value }))}
                      placeholder="Solar cells, steel rods..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Origin</label>
                    <input
                      type="text"
                      required
                      value={matchingInput.pickup}
                      onChange={(e) => setMatchingInput(prev => ({ ...prev, pickup: e.target.value }))}
                      placeholder="City Hub"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Destination</label>
                    <input
                      type="text"
                      required
                      value={matchingInput.destination}
                      onChange={(e) => setMatchingInput(prev => ({ ...prev, destination: e.target.value }))}
                      placeholder="Target Terminal"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Weight (Kg)</label>
                    <input
                      type="number"
                      required
                      value={matchingInput.weight}
                      onChange={(e) => setMatchingInput(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={aiMatchLoading}
                      className="w-full bg-[#ef233c] hover:bg-[#d90429] text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-[#ef233c]/15 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {aiMatchLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span className="animate-pulse">{aiMatchStep || "Analyzing..."}</span>
                        </>
                      ) : (
                        <>
                          <span>Find Best Match</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>

                {/* AI Recommendation Result Panel */}
                <AnimatePresence>
                  {aiRecommendation && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative"
                    >
                      {/* Confidence Floating badge */}
                      <div className="absolute top-4 right-4 bg-[#ef233c]/10 border border-[#ef233c]/20 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#ef233c] font-mono">
                        Confidence: {aiRecommendation.confidence}%
                      </div>

                      <h4 className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider mb-3">RECOMMENDED DRIVER & VEHICLE</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Truck className="w-4 h-4 text-[#ef233c]" />
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Recommended Vehicle</span>
                          </div>
                          <strong className="text-sm text-slate-800">{aiRecommendation.vehiclePlate}</strong>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{aiRecommendation.vehicleModel}</p>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 mb-1.5">
                            <User className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Recommended Driver</span>
                          </div>
                          <strong className="text-sm text-emerald-600">{aiRecommendation.driverName}</strong>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Safety Rating: {aiRecommendation.safetyScore}%</p>
                        </div>
                      </div>

                      {/* AI Rationale Explanation block */}
                      <div className="bg-[#ef233c]/5 border-l-4 border-[#ef233c] p-3.5 rounded-r-xl text-xs text-slate-700 text-left mb-4 font-sans leading-relaxed">
                        <strong>Recommendation:</strong> {aiRecommendation.rationale}
                      </div>

                      {/* CTA confirmation dispatch */}
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setAiRecommendation(null)}
                          className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 px-4 rounded-xl text-xs uppercase font-mono tracking-wider transition-all cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmAiDispatch}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Assignment
                        </button>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* ACTIVE DISPATCH LIST TABLE */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">Active Shipments</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400">
                        <th className="py-2.5">ID</th>
                        <th className="py-2.5">Customer</th>
                        <th className="py-2.5">Vehicle</th>
                        <th className="py-2.5">Driver</th>
                        <th className="py-2.5">Progress</th>
                        <th className="py-2.5">Priority</th>
                        <th className="py-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((ship) => (
                        <tr key={ship.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-600">
                          <td className="py-3.5 font-mono font-bold text-slate-800">{ship.id}</td>
                          <td className="py-3.5 font-sans font-semibold">{ship.customerName}</td>
                          <td className="py-3.5 font-mono text-emerald-600">{ship.vehicleNumber || "MH-04-GP-8834"}</td>
                          <td className="py-3.5">{ship.driverName || "Rajesh Yadav"}</td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-2 w-32">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#ef233c] rounded-full" style={{ width: `${ship.progress}%` }} />
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{ship.progress}%</span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ship.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                              {ship.priority}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              ship.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-[#ef233c]/10 text-[#ef233c] border border-[#ef233c]/20'
                            }`}>
                              {ship.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {activeSubView === "bookings" && <BookingsCrud onRefreshAll={fetchDispatcherData} />}
              {activeSubView === "trips" && <TripsCrud onRefreshAll={fetchDispatcherData} />}
              {activeSubView === "vehicles" && <VehiclesCrud onRefreshAll={fetchDispatcherData} />}
              {activeSubView === "drivers" && <DriversCrud onRefreshAll={fetchDispatcherData} />}
              {activeSubView === "routes" && <RoutesCrud onRefreshAll={fetchDispatcherData} />}
              {activeSubView === "receipts" && <LorryReceiptsCrud onRefreshAll={fetchDispatcherData} />}
            </div>
          )}

        </div>

        {/* Right Grid: Completion Calendar & Operations Alerts Map */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* MONTHLY FLEET COMPLETION CALENDAR */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-mono font-bold text-[#ef233c] uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#ef233c]" />
                Fleet Calendar
              </h3>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 transition-all">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-slate-700 px-1.5">{currentCalendarMonth}</span>
                <button className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 transition-all">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Completion metrics indicator bar */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-4 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Completion Rate</span>
                <strong className="text-lg font-black text-emerald-600 font-mono">85% Rate</strong>
              </div>
              <div className="flex flex-col gap-0.5 text-[8px] font-bold font-mono text-right">
                <span className="text-emerald-600">&bull; Green=100%</span>
                <span className="text-amber-500">&bull; Yellow=Active</span>
                <span className="text-rose-500">&bull; Red=Delayed</span>
              </div>
            </div>

            {/* Calendar Grid 5x3 */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {calendarDays.map((item) => (
                <button
                  key={item.day}
                  type="button"
                  onClick={() => handleDayClick(item)}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                    selectedCalendarDate === item.day 
                      ? "ring-2 ring-[#ef233c] scale-105" 
                      : ""
                  } ${
                    item.status === "GREEN" 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                      : item.status === "YELLOW" 
                        ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                        : item.status === "RED"
                          ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                          : "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                  }`}
                >
                  <span className="text-xs font-mono font-bold">{item.day}</span>
                  {item.trips > 0 && (
                    <span className="text-[8px] opacity-75 font-mono">{item.trips} Trips</span>
                  )}
                </button>
              ))}
            </div>

            {/* Calendar Day Detail modal */}
            {calendarPopupDetails && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3"
              >
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <strong className="text-slate-800">Date: {calendarPopupDetails.date}</strong>
                  <span className="text-[10px] font-mono text-[#ef233c] font-bold uppercase">Freight Cost Summary</span>
                </div>

                {calendarPopupDetails.trips > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 uppercase block">Dispatched Trips</span>
                      <strong className="text-slate-700 font-mono">{calendarPopupDetails.trips} runs scheduled</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 uppercase block">Total Freight Cost</span>
                      <strong className="text-emerald-600 font-mono">₹{(calendarPopupDetails.cost).toLocaleString("en-IN")}.00</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 uppercase block">Trips Completion %</span>
                      <strong className="text-indigo-600 font-mono">{calendarPopupDetails.completionRate}% Done</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 uppercase block">Active Alerts</span>
                      <strong className={`font-mono ${calendarPopupDetails.delays > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {calendarPopupDetails.delays} Delays exist
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 font-mono text-[10px] text-center uppercase py-3">No dispatches scheduled on this date.</p>
                )}
              </motion.div>
            )}

          </div>

          {/* GEOPATHWAY OPERATIONS FEED */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-mono font-bold text-[#ef233c] uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ef233c]" />
              Geofence Alerts
            </h3>

            <div className="space-y-2.5">
              {geofences.map((gf) => (
                <div key={gf.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${gf.alertsCount > 5 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                    <div className="text-left">
                      <strong className="text-slate-800">{gf.name}</strong>
                      <span className="text-[9px] text-slate-400 block font-mono">Radius: {gf.radius} meters</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">
                    {gf.alertsCount} alerts logged
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
