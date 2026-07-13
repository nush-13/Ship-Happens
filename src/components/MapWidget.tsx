import React, { useEffect, useState } from "react";
import { Truck, Navigation, AlertTriangle, Shield, MapPin, Clock, Compass, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MapWidgetProps {
  shipmentId?: string;
  pickup: string;
  destination: string;
  progress: number; // 0 - 100
  status: string;
}

const HUB_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "delhi": { lat: 28.6139, lng: 77.2090 },
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "pune": { lat: 18.5204, lng: 73.8567 },
  "surat": { lat: 21.1702, lng: 72.8311 },
  "ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "vadodara": { lat: 22.3072, lng: 73.1812 },
  "mundra": { lat: 22.8374, lng: 69.7247 },
  "valsad": { lat: 20.5992, lng: 72.9342 },
  "vapi": { lat: 20.3893, lng: 72.9106 },
  "navsari": { lat: 20.9467, lng: 72.9520 },
  "bharuch": { lat: 21.7051, lng: 72.9959 },
  "nadiad": { lat: 22.6916, lng: 72.8634 },
  "gurgaon": { lat: 28.4595, lng: 77.0266 },
  "noida": { lat: 28.5355, lng: 77.3910 },
  "lucknow": { lat: 26.8467, lng: 80.9462 },
  "indore": { lat: 22.7196, lng: 75.8577 },
  "bhopal": { lat: 23.2599, lng: 77.4126 },
  "nagpur": { lat: 21.1458, lng: 79.0882 },
};

function getCoordinatesForString(str: string): { lat: number; lng: number; name: string } {
  const normalized = str.toLowerCase();
  
  for (const [key, coords] of Object.entries(HUB_COORDINATES)) {
    if (normalized.includes(key)) {
      return { 
        lat: coords.lat, 
        lng: coords.lng, 
        name: key.charAt(0).toUpperCase() + key.slice(1) 
      };
    }
  }
  
  // Fallback: Deterministic coordinate hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const lat = 16 + (Math.abs(hash) % 110) / 10;
  const lng = 72 + (Math.abs(hash * 13) % 110) / 10;
  const name = str.split(',')[0].trim();
  
  return { lat, lng, name };
}

function projectPoints(points: any[]) {
  if (points.length === 0) return [];
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const latSpan = maxLat - minLat || 0.1;
  const lngSpan = maxLng - minLng || 0.1;
  
  const padding = 15; // percentage padding
  const widthRange = 100 - 2 * padding;
  const heightRange = 100 - 2 * padding;
  
  return points.map(p => {
    const x = padding + ((p.lng - minLng) / lngSpan) * widthRange;
    const y = 100 - (padding + ((p.lat - minLat) / latSpan) * heightRange);
    return { ...p, x, y };
  });
}

function generateStaticPoints(pickup: string, destination: string) {
  const start = getCoordinatesForString(pickup || "Ahmedabad");
  const end = getCoordinatesForString(destination || "Mumbai");
  
  const pointsCount = 5;
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const length = Math.sqrt(dx * dx + dy * dy);
  const px = -dy / (length || 1);
  const py = dx / (length || 1);
  
  const points = [];
  for (let i = 0; i < pointsCount; i++) {
    const ratio = i / (pointsCount - 1);
    let lat = start.lat + (end.lat - start.lat) * ratio;
    let lng = start.lng + (end.lng - start.lng) * ratio;
    
    if (i > 0 && i < pointsCount - 1) {
      const offsetMagnitude = Math.sin(ratio * Math.PI) * (length * 0.12);
      lat += py * offsetMagnitude;
      lng += px * offsetMagnitude;
    }
    
    let name = "";
    if (i === 0) name = start.name;
    else if (i === pointsCount - 1) name = end.name;
    else {
      const labels = ["Toll Gate", "Waystation", "State Border"];
      name = `${start.name} ↔ ${end.name} ${labels[i - 1]}`;
    }
    
    points.push({
      name,
      lat,
      lng,
      isHub: i === 0 || i === pointsCount - 1,
      isGeofence: i > 0 && i < pointsCount - 1
    });
  }
  
  return projectPoints(points);
}

function getDynamicETA(hoursRemaining: number, status: string): string {
  if (status === "DELIVERED") return "Delivered";
  if (status === "CANCELLED") return "Cancelled";
  if (hoursRemaining <= 0) return "Arriving Now";
  
  const now = new Date();
  now.setMinutes(now.getMinutes() + hoursRemaining * 60);
  
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  };
  const timeStr = now.toLocaleTimeString("en-IN", options);
  
  const today = new Date();
  if (now.getDate() === today.getDate()) {
    return `${timeStr} (Today)`;
  } else if (now.getDate() === today.getDate() + 1) {
    return `${timeStr} (Tomorrow)`;
  } else {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${timeStr} (${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]})`;
  }
}

export default function MapWidget({ shipmentId, pickup, destination, progress, status }: MapWidgetProps) {
  const [routePoints, setRoutePoints] = useState<any[]>(() => generateStaticPoints(pickup, destination));
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Load route details asynchronously using backend APIs
  useEffect(() => {
    let isMounted = true;
    const loadBackendRoute = async () => {
      setSyncing(true);
      try {
        const [tripsRes, routesRes] = await Promise.all([
          fetch("/api/trips"),
          fetch("/api/routes")
        ]);
        if (!isMounted) return;
        
        const allTrips = await tripsRes.json();
        const allRoutes = await routesRes.json();
        
        let matchedRoute = null;
        
        if (shipmentId) {
          const shipRes = await fetch("/api/shipments");
          const allShips = await shipRes.json();
          const currentShip = allShips.find((s: any) => s.id === shipmentId);
          if (currentShip) {
            // Match trip by vehicleId or driverId or direct properties
            const matchedTrip = allTrips.find((t: any) => 
              t.vehicleId === currentShip.vehicleId || t.driverId === currentShip.driverId
            );
            if (matchedTrip) {
              matchedRoute = allRoutes.find((r: any) => r.id === matchedTrip.routeId);
            }
          }
        }

        if (!isMounted) return;

        if (matchedRoute && matchedRoute.coordinates && matchedRoute.coordinates.length > 0) {
          const coords = matchedRoute.coordinates;
          const stops = matchedRoute.stops || [];
          const pts = coords.map((c: [number, number], idx: number) => {
            const stopName = stops[idx] || (idx === 0 ? "Origin" : idx === coords.length - 1 ? "Destination" : `Stop ${idx}`);
            return {
              name: stopName,
              lat: c[0],
              lng: c[1],
              isHub: idx === 0 || idx === coords.length - 1,
              isGeofence: idx > 0 && idx < coords.length - 1
            };
          });
          setRoutePoints(projectPoints(pts));
        } else {
          // If no specific backend trip/route matched, regenerate dynamically from pickup & destination
          setRoutePoints(generateStaticPoints(pickup, destination));
        }
      } catch (err) {
        console.error("Failed to load map route details from backend", err);
        setRoutePoints(generateStaticPoints(pickup, destination));
      } finally {
        if (isMounted) setSyncing(false);
      }
    };

    loadBackendRoute();
    return () => { isMounted = false; };
  }, [shipmentId, pickup, destination, status]);

  // Calculate segment breakdown & interpolate vehicle coordinate on path
  const segments: { start: any; end: any; length: number }[] = [];
  let totalSvgLength = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const p1 = routePoints[i];
    const p2 = routePoints[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segments.push({ start: p1, end: p2, length: len });
    totalSvgLength += len;
  }

  const targetDist = (progress / 100) * totalSvgLength;
  let accumulatedDist = 0;
  let vehicleX = routePoints[0]?.x || 20;
  let vehicleY = routePoints[0]?.y || 50;
  let currentSegmentIndex = 0;
  let segmentRatio = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (accumulatedDist + seg.length >= targetDist) {
      currentSegmentIndex = i;
      segmentRatio = (targetDist - accumulatedDist) / seg.length;
      vehicleX = seg.start.x + (seg.end.x - seg.start.x) * segmentRatio;
      vehicleY = seg.start.y + (seg.end.y - seg.start.y) * segmentRatio;
      break;
    }
    accumulatedDist += seg.length;
    if (i === segments.length - 1) {
      currentSegmentIndex = i;
      segmentRatio = 1;
      vehicleX = seg.end.x;
      vehicleY = seg.end.y;
    }
  }

  // Geofence Crossing Detection Logic
  useEffect(() => {
    const nextPoint = routePoints[currentSegmentIndex + 1];
    if (nextPoint && nextPoint.isGeofence && segmentRatio > 0.3 && segmentRatio < 0.8) {
      setActiveAlert(`Crossing: ${nextPoint.name}`);
    } else {
      setActiveAlert(null);
    }
  }, [currentSegmentIndex, segmentRatio, routePoints]);

  // Generate continuous SVG path strings
  let completedPathD = "";
  let remainingPathD = "";
  if (routePoints.length > 0) {
    // Completed line
    completedPathD = `M ${routePoints[0].x} ${routePoints[0].y}`;
    for (let i = 1; i <= currentSegmentIndex; i++) {
      completedPathD += ` L ${routePoints[i].x} ${routePoints[i].y}`;
    }
    if (progress > 0) {
      completedPathD += ` L ${vehicleX} ${vehicleY}`;
    }

    // Remaining line
    remainingPathD = `M ${vehicleX} ${vehicleY}`;
    for (let i = currentSegmentIndex + 1; i < routePoints.length; i++) {
      remainingPathD += ` L ${routePoints[i].x} ${routePoints[i].y}`;
    }
  }

  // Calculate Geodesic Distance Heuristics in KM
  let totalDistanceKm = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const p1 = routePoints[i];
    const p2 = routePoints[i + 1];
    const segmentDist = Math.sqrt(Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2)) * 111 * 1.25;
    totalDistanceKm += segmentDist;
  }

  const distanceRemaining = status === "DELIVERED" ? 0 : Math.max(0, totalDistanceKm * (1 - progress / 100));
  // average speed of 60km/h
  const hoursRemaining = status === "DELIVERED" ? 0 : distanceRemaining / 60;
  const formattedDistance = distanceRemaining.toFixed(0);
  const etaText = getDynamicETA(hoursRemaining, status);

  return (
    <div className="relative w-full h-[400px] bg-slate-900 rounded-[32px] border border-slate-800 p-5 overflow-hidden shadow-2xl flex flex-col justify-between text-white">
      {/* Dynamic Grid Overlay & Glowing Ambient Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-[#ef233c]/5 blur-[80px]" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-emerald-500/5 blur-[80px]" />

      {/* HEADER HUD */}
      <div className="relative z-10 flex justify-between items-center bg-slate-950/80 border border-slate-800/80 px-4 py-3 rounded-2xl backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse" />
            <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500/60 block animate-ping" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-mono text-slate-400 block tracking-widest uppercase">REALTIME CORRIDOR TRACKING</span>
            <span className="text-xs font-mono font-black text-[#ef233c] tracking-wider">
              {shipmentId || "LOG-TRACKER"}
            </span>
          </div>
        </div>
        {syncing ? (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
            SYNCING
          </div>
        ) : (
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            ESTABLISHED CONNECTIVITY
          </div>
        )}
      </div>

      {/* GEOFENCE TRIGGER POPUP */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-rose-950/90 border border-rose-800 text-rose-200 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold backdrop-blur-md"
          >
            <Shield className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>{activeAlert}</span>
            <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded uppercase font-mono tracking-widest animate-pulse">TELEMETRY</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAP CANVAS (SVG) */}
      <div className="relative w-full h-[180px] my-4 flex items-center justify-center">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Defined glow filters */}
          <defs>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Planned path (Gray) */}
          {remainingPathD && (
            <path
              d={remainingPathD}
              fill="none"
              stroke="#475569"
              strokeWidth="2"
              strokeDasharray="3 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000"
            />
          )}

          {/* Completed path (Green glow) */}
          {completedPathD && (
            <path
              d={completedPathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-green)"
              className="transition-all duration-1000"
            />
          )}

          {/* Node Circles (checkpoints, hubs) */}
          {routePoints.map((pt, idx) => {
            const isCompleted = idx <= currentSegmentIndex;
            const isCurrent = idx === currentSegmentIndex && segmentRatio < 0.2;
            const markerColor = isCurrent 
              ? "#ef233c" 
              : isCompleted 
                ? "#10b981" 
                : "#475569";
            const strokeColor = isCurrent 
              ? "#fca5a5" 
              : isCompleted 
                ? "#34d399" 
                : "#64748b";

            return (
              <g key={`${pt.name}-${idx}`}>
                {pt.isHub && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="none"
                    stroke={markerColor}
                    strokeWidth="0.5"
                    className="animate-ping"
                    style={{ animationDuration: "2.5s" }}
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={pt.isHub ? "2.5" : "1.8"}
                  fill={markerColor}
                  stroke={strokeColor}
                  strokeWidth="0.8"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Labels over nodes */}
        {routePoints.map((pt, idx) => {
          const isCompleted = idx <= currentSegmentIndex;
          return (
            <div
              key={`${pt.name}-${idx}-lbl`}
              style={{ left: `${pt.x}%`, top: `${pt.y + 7}%` }}
              className="absolute -translate-x-1/2 text-center pointer-events-none"
            >
              <span className={`text-[8px] font-mono font-bold tracking-tight px-1.5 py-0.5 rounded border shadow-sm backdrop-blur-md transition-all ${
                isCompleted 
                  ? "bg-emerald-950/95 text-emerald-300 border-emerald-800/80" 
                  : "bg-slate-950/95 text-slate-400 border-slate-800/80"
              }`}>
                {pt.name.split("↔")[1]?.trim() || pt.name.split(" ")[0]}
              </span>
            </div>
          );
        })}

        {/* Floating Truck marker along SVG line */}
        <div
          style={{
            left: `${vehicleX}%`,
            top: `${vehicleY}%`,
            transition: "left 1s cubic-bezier(0.1, 0.8, 0.2, 1), top 1s cubic-bezier(0.1, 0.8, 0.2, 1)"
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
        >
          {/* Glow circle aura */}
          <span className="absolute -inset-3.5 rounded-full bg-[#ef233c]/20 blur-sm group-hover:bg-[#ef233c]/35 transition-all animate-ping" style={{ animationDuration: '3s' }} />
          
          <div className="relative w-8.5 h-8.5 rounded-full bg-slate-950 border-2 border-[#ef233c] flex items-center justify-center shadow-lg shadow-[#ef233c]/20 cursor-pointer">
            <Truck className="w-4.5 h-4.5 text-[#ef233c] animate-pulse" />
          </div>

          {/* Quick interactive hover tooltip */}
          <div className="absolute bottom-11 left-1/2 -translate-x-1/2 hidden group-hover:block z-30 bg-slate-950 border border-slate-800 p-2.5 rounded-xl w-36 shadow-2xl text-left backdrop-blur-md">
            <div className="text-[10px] text-slate-400 font-mono flex flex-col gap-1">
              <div className="font-bold text-white uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#ef233c] rounded-full animate-ping" />
                {status}
              </div>
              <div className="border-t border-slate-800/60 pt-1 mt-1">
                Progress: <span className="text-[#ef233c] font-black">{Math.round(progress)}%</span>
              </div>
              <div>Remaining: <span className="text-emerald-400 font-black">{formattedDistance} KM</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER TELEMETRY HUD PANEL */}
      <div className="relative z-10 grid grid-cols-2 gap-4 bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-md shadow-lg">
        {/* Left Side: Route Segment Info */}
        <div className="flex flex-col gap-1.5 text-left border-r border-slate-800/60 pr-2">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">ACTIVE ROUTE</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-[#ef233c]" />
            <span className="truncate max-w-[100px]">{pickup.split(",")[0]}</span>
            <span className="text-slate-600">&rarr;</span>
            <span className="truncate max-w-[100px] text-indigo-400">{destination.split(",")[0]}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <span>Status:</span>
            <span className={`font-bold ${status === 'DELIVERED' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Right Side: Navigation Stats */}
        <div className="flex justify-between items-center pl-2">
          <div className="text-left space-y-1">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              DYNAMIC ETA
            </span>
            <strong className="text-xs font-bold text-slate-100 block truncate">
              {etaText}
            </strong>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">REMAINING</span>
            <strong className="text-md font-black text-emerald-400 font-mono block">
              {formattedDistance} <span className="text-[9px] font-normal text-slate-400">KM</span>
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
