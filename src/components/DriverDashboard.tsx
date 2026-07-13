import React, { useState, useEffect } from "react";
import { 
  CheckSquare, Navigation, ShieldAlert, Phone, AlertTriangle, 
  MapPin, Clock, ShieldCheck, HeartPulse, HelpCircle, Flame, 
  Award, Eye, Check, AlertCircle, Play, Bell,
  Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Shipment, User as UserType } from "../types";

interface DriverDashboardProps {
  user: UserType;
  onLogout: () => void;
  theme?: string;
  toggleTheme?: () => void;
}

export default function DriverDashboard({ user, onLogout, theme, toggleTheme }: DriverDashboardProps) {
  const [assignedShipment, setAssignedShipment] = useState<Shipment | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [simulatedDistance, setSimulatedDistance] = useState(124); // km remaining
  const [tripProgress, setTripProgress] = useState(72);
  const [checklist, setChecklist] = useState({
    inspection: true,
    cargoLoaded: true,
    docsVerified: true,
    signature: false,
    photo: false
  });

  // Emergency triggers
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosType, setSosType] = useState<string | null>(null);

  // Driver notifications feed
  const [driverNotifications, setDriverNotifications] = useState([
    { id: 1, text: "Heavy Traffic Alert: Congestion on Mumbai Entrance highway NH-48 (+18m delay)", type: "WARNING", time: "5m ago" },
    { id: 2, text: "Route Updated: Bypass Navsari bypass for high fuel efficiency routing", type: "INFO", time: "1h ago" },
    { id: 3, text: "Fuel Station Near: HP Petrol Pump located 2.4 km ahead on NH-48 left exit", type: "SUCCESS", time: "2h ago" }
  ]);

  useEffect(() => {
    fetchAssignedRun();
  }, []);

  const fetchAssignedRun = async () => {
    try {
      const res = await fetch("/api/shipments");
      const data = await res.json();
      
      // 1. Fetch drivers to find this user's driver ID
      let matchedDriverId = "";
      try {
        const driversRes = await fetch("/api/drivers");
        if (driversRes.ok) {
          const driversList = await driversRes.json();
          const foundDriver = driversList.find((d: any) => 
            (d.name && d.name.toLowerCase() === user.name.toLowerCase()) || 
            (d.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
            (d.phone && d.phone === user.phone) ||
            (user.email && d.email && d.email.toLowerCase().includes(user.email.toLowerCase().split("@")[0]))
          );
          if (foundDriver) {
            matchedDriverId = foundDriver.id;
          }
        }
      } catch (e) {
        console.error("Failed to fetch drivers list for mapping", e);
      }

      // 2. Filter shipments assigned to the logged-in driver
      const myShipments = data.filter((s: Shipment) => {
        const isNameMatch = s.driverName?.toLowerCase() === user.name.toLowerCase();
        const isIdMatch = s.driverId === user.id || (matchedDriverId && s.driverId === matchedDriverId);
        return isNameMatch || isIdMatch;
      });

      // 3. Define priority for active/upcoming statuses
      const getStatusPriority = (status: string) => {
        switch (status) {
          case "IN_TRANSIT": return 1;
          case "DELAYED": return 1;
          case "OUT_FOR_DELIVERY": return 2;
          case "AT_HUB": return 3;
          case "PICKED_UP": return 4;
          case "CONFIRMED": return 5;
          case "BOOKED": return 6;
          default: return 999; // Filtered out/completed statuses (e.g. DELIVERED, CANCELLED)
        }
      };

      // 4. Filter only active or upcoming shipments
      const activeUpcomingShipments = myShipments.filter((s: Shipment) => getStatusPriority(s.status) < 999);

      if (activeUpcomingShipments.length > 0) {
        activeUpcomingShipments.sort((a: Shipment, b: Shipment) => {
          return getStatusPriority(a.status) - getStatusPriority(b.status);
        });
        const run = activeUpcomingShipments[0];
        setAssignedShipment(run);
        setTripProgress(run.progress);
        setSimulatedDistance(Math.max(15, Math.round(280 * (1 - run.progress / 100))));
        setIsNavigating(false);
        setChecklist({
          inspection: true,
          cargoLoaded: true,
          docsVerified: true,
          signature: false,
          photo: false
        });
        // Dynamically load notifications for that shipment
        const destCity = run.destination.split(",")[0] || "Mumbai";
        const pickupCity = run.pickup.split(",")[0] || "Surat";
        setDriverNotifications([
          { id: 1, text: `Heavy Traffic Alert: Congestion on ${destCity} Entrance highway NH-48 (+18m delay)`, type: "WARNING", time: "5m ago" },
          { id: 2, text: `Route Updated: Bypass ${pickupCity} bypass for high fuel efficiency routing`, type: "INFO", time: "1h ago" },
          { id: 3, text: "Fuel Station Near: HP Petrol Pump located 2.4 km ahead on NH-48 left exit", type: "SUCCESS", time: "2h ago" }
        ]);
      } else {
        setAssignedShipment(null);
        setIsNavigating(false);
      }
    } catch (err) {
      console.error("Failed to fetch driver assignment", err);
    }
  };

  // One-click live status updater
  const handleUpdateStatus = async (newStatus: 'BOOKED' | 'CONFIRMED' | 'PICKED_UP' | 'IN_TRANSIT' | 'AT_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED') => {
    if (!assignedShipment) return;

    let targetProgress = tripProgress;
    if (newStatus === "PICKED_UP") targetProgress = 15;
    else if (newStatus === "IN_TRANSIT") targetProgress = 40;
    else if (newStatus === "AT_HUB") targetProgress = 60;
    else if (newStatus === "OUT_FOR_DELIVERY") targetProgress = 85;
    else if (newStatus === "DELIVERED") {
      targetProgress = 100;
      setChecklist(prev => ({ ...prev, signature: true, photo: true }));
    }

    try {
      const res = await fetch(`/api/shipments/${assignedShipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          progress: targetProgress,
          currentLocation: "NH-48 Corridor Outpost",
          statusDescription: `Status updated to ${newStatus} by Driver ${user.name} via Mobile Terminal.`
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (newStatus === "DELIVERED") {
          // Immediately refresh the driver's assigned shipment list and pick the next active one
          await fetchAssignedRun();
        } else {
          setAssignedShipment(updated);
          setTripProgress(targetProgress);
          setSimulatedDistance(Math.max(0, Math.round(280 * (1 - targetProgress / 100))));
        }
        alert(`Status successfully broadcasted to central command: ${newStatus}`);
      }
    } catch (err) {
      console.error("Failed to broadcast status update", err);
    }
  };

  const toggleChecklistItem = (item: keyof typeof checklist) => {
    setChecklist(prev => {
      const updated = { ...prev, [item]: !prev[item] };
      return updated;
    });
  };

  const triggerSOS = (type: string) => {
    setSosType(type);
    setSosTriggered(true);
    // Simulate logging alert with dispatch
    setTimeout(() => {
      setSosTriggered(false);
      alert(`SOS CRITICAL BROADCAST SENT! Dispatch has acknowledged ${type} event at current coordinates.`);
    }, 2500);
  };

  const driverStats = [
    { label: "Fuel level", val: 82, color: "stroke-[#ef233c] text-[#ef233c]" },
    { label: "Battery life", val: 94, color: "stroke-emerald-600 text-emerald-600" },
    { label: "Engine heat", val: 88, color: "stroke-amber-500 text-amber-600" },
    { label: "Tyre pressure", val: 92, color: "stroke-blue-500 text-blue-600" }
  ];

  return (
    <div className="min-h-screen bg-[#f6f5f0] text-slate-800 flex flex-col font-sans pb-16 transition-all">
      
      {/* Mobile Tactical Top Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#ef233c] rounded-full animate-ping" />
          <h1 className="text-sm font-black tracking-widest text-slate-800 uppercase">{user.name.toUpperCase()} // PROFILE</h1>
        </div>
        <div className="flex items-center gap-3">
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
            <span className="text-[10px] text-[#ef233c] font-mono block font-bold uppercase">Safety Rating</span>
            <strong className="text-xs text-emerald-600 font-mono">92% Level-A</strong>
          </div>
          <button onClick={onLogout} className="text-xs text-rose-600 font-mono font-bold uppercase tracking-wider bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer">Sign Out</button>
        </div>
      </header>

      <div className="max-w-md mx-auto w-full px-4 mt-4 space-y-6">

        {/* TODAY'S ASSIGNMENT PRIMARY FOCUS CARD */}
        {assignedShipment ? (
          <div className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#ef233c]/2 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Shipment ID</span>
                <strong className="text-md text-slate-800 font-mono tracking-tight">{assignedShipment.id}</strong>
              </div>
              <span className="text-[9px] font-bold bg-rose-50 border border-rose-200 text-rose-600 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {assignedShipment.priority} PRIORITY
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#ef233c] mt-1 shrink-0" />
                <div className="text-xs text-left">
                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Pickup Point</span>
                  <p className="font-bold text-slate-700">{assignedShipment.pickup}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Navigation className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                <div className="text-xs text-left">
                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Destination</span>
                  <p className="font-bold text-slate-700">{assignedShipment.destination}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 mt-1 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Cargo Weight</span>
                  <strong className="text-slate-600 font-mono">{assignedShipment.weight.toLocaleString()} kg</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Target ETA</span>
                  <strong className="text-indigo-600">{assignedShipment.eta}</strong>
                </div>
              </div>
            </div>

            {/* Start Navigation Interactive Section */}
            <div className="border-t border-slate-100 pt-4 mt-4">
              {!isNavigating ? (
                <button
                  onClick={() => setIsNavigating(true)}
                  className="w-full bg-[#ef233c] hover:bg-[#d90429] text-white font-black py-3 rounded-2xl transition-all shadow-md shadow-[#ef233c]/15 uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start Route
                </button>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                   <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-slate-500 flex items-center gap-1.5 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                        Route Map
                      </span>
                      <strong className="text-emerald-600 font-mono">{simulatedDistance} KM LEFT</strong>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ef233c] to-emerald-500 rounded-full transition-all duration-700" 
                        style={{ width: `${tripProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Departed</span>
                      <span>Next Stop: Valsad Depot</span>
                      <span>100% End</span>
                    </div>
                  </div>

                  {/* One-Click Status Broadcasting CTAs */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider mb-1">Update Status:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => handleUpdateStatus("PICKED_UP")}
                        className={`py-2 rounded-xl border transition-all font-bold uppercase text-[10px] cursor-pointer ${
                          assignedShipment.status === "PICKED_UP" 
                            ? "bg-[#ef233c]/10 text-[#ef233c] border-[#ef233c]/30 font-bold" 
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Cargo Loaded
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("IN_TRANSIT")}
                        className={`py-2 rounded-xl border transition-all font-bold uppercase text-[10px] cursor-pointer ${
                          assignedShipment.status === "IN_TRANSIT" 
                            ? "bg-[#ef233c]/10 text-[#ef233c] border-[#ef233c]/30 font-bold" 
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        In Transit
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("AT_HUB")}
                        className={`py-2 rounded-xl border transition-all font-bold uppercase text-[10px] cursor-pointer ${
                          assignedShipment.status === "AT_HUB" 
                            ? "bg-[#ef233c]/10 text-[#ef233c] border-[#ef233c]/30 font-bold" 
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Reached Hub
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("DELIVERED")}
                        className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100/60 py-2 rounded-xl transition-all font-bold uppercase text-[10px] cursor-pointer"
                      >
                        Delivered
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsNavigating(false)}
                    className="w-full bg-white border border-slate-200 text-slate-500 hover:text-slate-700 py-2.5 rounded-xl text-xs uppercase font-mono tracking-wider transition-all cursor-pointer"
                  >
                    Pause Navigation
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-8 rounded-[28px] text-center text-slate-450 shadow-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs uppercase font-mono">No Active Trip Assignments</p>
          </div>
        )}

        {/* DRIVER NOTIFICATIONS INBOUND FEED */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-mono font-bold text-[#ef233c] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#ef233c]" />
            Dispatch Notifications
          </h3>

          <div className="space-y-2.5">
            {driverNotifications.map((note) => (
              <div key={note.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex items-start gap-2.5">
                <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${note.type === 'WARNING' ? 'text-amber-600' : 'text-[#ef233c]'}`} />
                <div className="flex-1 text-left">
                  <p className="text-slate-700 font-sans leading-tight">{note.text}</p>
                  <span className="text-[9px] font-mono text-slate-400 block mt-1">{note.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VEHICLE TELEMETRY STATS (Progress Rings) */}
        <div className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm">
          <h3 className="text-xs font-mono font-bold text-[#ef233c] tracking-widest uppercase mb-4 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-[#ef233c]" />
            Vehicle Status
          </h3>

          <div className="grid grid-cols-4 gap-2">
            {driverStats.map((stat, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col items-center">
                {/* SVG Progress Ring */}
                <div className="relative w-11 h-11">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 stroke-current"
                      strokeWidth="3.5"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                    />
                    <path
                      className={`${stat.color.split(" ")[0]} stroke-current`}
                      strokeDasharray={`${stat.val}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold font-mono text-slate-800">{stat.val}%</span>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold tracking-tight text-center mt-2 leading-tight">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DELIVERY TASK CHECKLIST */}
        <div className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm">
          <h3 className="text-xs font-mono font-bold text-[#ef233c] tracking-widest uppercase mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#ef233c]" />
            Task Checklist
          </h3>

          <div className="space-y-3">
            <div 
              onClick={() => toggleChecklistItem("inspection")}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer hover:bg-slate-100/40 transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checklist.inspection ? 'bg-[#ef233c] border-[#ef233c] text-white' : 'border-slate-300 bg-white'}`}>
                  {checklist.inspection && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs ${checklist.inspection ? 'text-slate-400 line-through' : 'text-slate-700 font-semibold'}`}>Pre-trip inspection completed</span>
              </div>
            </div>

            <div 
              onClick={() => toggleChecklistItem("cargoLoaded")}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer hover:bg-slate-100/40 transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checklist.cargoLoaded ? 'bg-[#ef233c] border-[#ef233c] text-white' : 'border-slate-300 bg-white'}`}>
                  {checklist.cargoLoaded && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs ${checklist.cargoLoaded ? 'text-slate-400 line-through' : 'text-slate-700 font-semibold'}`}>Cargo loading verified</span>
              </div>
            </div>

            <div 
              onClick={() => toggleChecklistItem("docsVerified")}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer hover:bg-slate-100/40 transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checklist.docsVerified ? 'bg-[#ef233c] border-[#ef233c] text-white' : 'border-slate-300 bg-white'}`}>
                  {checklist.docsVerified && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs ${checklist.docsVerified ? 'text-slate-400 line-through' : 'text-slate-700 font-semibold'}`}>Documents verified</span>
              </div>
            </div>

            <div 
              onClick={() => toggleChecklistItem("signature")}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer hover:bg-slate-100/40 transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checklist.signature ? 'bg-[#ef233c] border-[#ef233c] text-white' : 'border-slate-300 bg-white'}`}>
                  {checklist.signature && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs ${checklist.signature ? 'text-slate-400 line-through' : 'text-slate-700 font-semibold'}`}>Customer signature</span>
              </div>
            </div>

            <div 
              onClick={() => toggleChecklistItem("photo")}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer hover:bg-slate-100/40 transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checklist.photo ? 'bg-[#ef233c] border-[#ef233c] text-white' : 'border-slate-300 bg-white'}`}>
                  {checklist.photo && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs ${checklist.photo ? 'text-slate-400 line-through' : 'text-slate-700 font-semibold'}`}>Delivery photo uploaded</span>
              </div>
            </div>
          </div>
        </div>

        {/* EMERGENCY TACTICAL CONTROL PANEL */}
        <div className="bg-rose-50 border border-rose-100 rounded-[28px] p-5 shadow-sm">
          <h3 className="text-xs font-mono font-bold text-rose-700 uppercase tracking-widest mb-3.5 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
            Emergency & SOS
          </h3>

          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => triggerSOS("VEHICLE_BREAKDOWN")}
              className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 py-3 rounded-2xl text-xs uppercase font-extrabold font-sans transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
              Breakdown Alert
            </button>
            <button
              onClick={() => triggerSOS("HIGHWAY_ACCIDENT")}
              className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 py-3 rounded-2xl text-xs uppercase font-extrabold font-sans transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Accident SOS
            </button>
            <button
              onClick={() => triggerSOS("POLICE_CHECKPOINT_DISPUTE")}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 py-3 rounded-2xl text-[10px] uppercase font-bold font-mono transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              Contact Dispatch
            </button>
            <button
              onClick={() => triggerSOS("GENERAL_OPERATIONS_SOS")}
              className="bg-[#ef233c] hover:bg-[#d90429] text-white py-3 rounded-2xl text-xs uppercase font-black font-sans transition-all active:scale-95 shadow-md shadow-[#ef233c]/20 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-white animate-pulse" />
              Emergency Call
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
