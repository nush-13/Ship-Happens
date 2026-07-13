export type UserRole = 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  company?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  fuelLevel: number; // 0 - 100
  batteryLevel: number; // 0 - 100
  engineHealth: number; // 0 - 100
  tyreHealth: number; // 0 - 100
  maintenanceOverdue: boolean;
  fuelEfficiency: number; // km/l
  capacity: string; // e.g. "15 Tons"
  lastServiceDate: string;
  odometer: number; // km
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiryDate: string; // YYYY-MM-DD
  safetyScore: number; // 0 - 100
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
  completedTrips: number;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface Shipment {
  id: string;
  customerName: string;
  pickup: string;
  destination: string;
  eta: string;
  departureTime: string;
  status: 'BOOKED' | 'CONFIRMED' | 'PICKED_UP' | 'IN_TRANSIT' | 'AT_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'DELAYED';
  progress: number; // 0 - 100
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  weight: number; // kg
  cargoType: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  trackingHistory: TrackingEvent[];
  invoiceId: string;
  lorryReceiptId: string;
  podId: string;
  passId: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  routeId: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'DELAYED';
  startTime: string;
  endTime?: string;
  fuelConsumed?: number;
  cost: number;
}

export interface Expense {
  id: string;
  tripId: string;
  category: 'FUEL' | 'MAINTENANCE' | 'TOLL' | 'OTHER';
  amount: number;
  date: string;
  description: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  date: string;
  status: 'SCHEDULED' | 'COMPLETED';
}

export interface Route {
  id: string;
  name: string;
  distance: number; // km
  duration: string; // e.g., "5h 30m"
  stops: string[];
  coordinates: [number, number][]; // [lat, lng] array
}

export interface Geofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
  alertsCount: number;
}

export interface LorryReceipt {
  id: string;
  shipmentId: string;
  consignor: string;
  consignee: string;
  vehiclePlate: string;
  driverName: string;
  cargoType: string;
  weight: number;
  date: string;
}

export interface AIInsight {
  id: string;
  category: 'FUEL' | 'LICENSE' | 'MAINTENANCE' | 'PROFITABILITY' | 'UTILIZATION' | 'ALERT';
  text: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  timestamp: string;
}
