import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header and API key
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// ==========================================
// MOCK Logistical Database (Stateful)
// ==========================================

let users = [
  { id: "u-1", email: "admin@transitops.com", password: "password", name: "Vikram Malhotra", role: "ADMIN", phone: "+91 98765 43210", company: "TransitOps Global" },
  { id: "u-2", email: "dispatcher@transitops.com", password: "password", name: "Neha Sharma", role: "DISPATCHER", phone: "+91 91234 56789", company: "TransitOps West India" },
  { id: "u-3", email: "driver@transitops.com", password: "password", name: "Rajesh Yadav", role: "DRIVER", phone: "+91 88888 77777", company: "TransitOps Fleet Services" },
  { id: "u-4", email: "client@transitops.com", password: "password", name: "Arjun Mehta", role: "CLIENT", phone: "+91 99999 99999", company: "Meridian Retail Pvt Ltd" },
  { id: "u-5", email: "gurpreet.singh@transitops.com", password: "password", name: "Gurpreet Singh", role: "DRIVER", phone: "+91 97777 66666", company: "TransitOps Fleet Services" },
  { id: "u-6", email: "amit.k@transitops.com", password: "password", name: "Amit Kulkarni", role: "DRIVER", phone: "+91 95555 44444", company: "TransitOps Fleet Services" },
  { id: "u-7", email: "suresh.p@transitops.com", password: "password", name: "Suresh Pillai", role: "DRIVER", phone: "+91 93333 22222", company: "TransitOps Fleet Services" },
  { id: "u-8", email: "manoj.k@transitops.com", password: "password", name: "Manoj Kumar", role: "DRIVER", phone: "+91 92222 11111", company: "TransitOps Fleet Services" }
];

let vehicles = [
  { id: "v-101", plateNumber: "MH-04-GP-8834", model: "Tata Signa 5530.S", status: "ACTIVE", fuelLevel: 82, batteryLevel: 94, engineHealth: 91, tyreHealth: 88, maintenanceOverdue: false, fuelEfficiency: 3.8, capacity: "30 Tons", lastServiceDate: "2026-06-15", odometer: 142350 },
  { id: "v-102", plateNumber: "GJ-05-UU-2941", model: "BharatBenz 2823R", status: "ACTIVE", fuelLevel: 45, batteryLevel: 89, engineHealth: 85, tyreHealth: 72, maintenanceOverdue: false, fuelEfficiency: 4.2, capacity: "18 Tons", lastServiceDate: "2026-05-10", odometer: 189400 },
  { id: "v-103", plateNumber: "DL-01-AA-4439", model: "Mahindra Blazo X 49", status: "MAINTENANCE", fuelLevel: 12, batteryLevel: 42, engineHealth: 55, tyreHealth: 48, maintenanceOverdue: true, fuelEfficiency: 3.2, capacity: "40 Tons", lastServiceDate: "2025-12-05", odometer: 245100 },
  { id: "v-104", plateNumber: "KA-03-MM-9912", model: "Eicher Pro 6055", status: "ACTIVE", fuelLevel: 91, batteryLevel: 96, engineHealth: 98, tyreHealth: 94, maintenanceOverdue: false, fuelEfficiency: 4.5, capacity: "35 Tons", lastServiceDate: "2026-07-01", odometer: 42900 },
  { id: "v-105", plateNumber: "MH-12-RS-6192", model: "Ashok Leyland 3520", status: "ACTIVE", fuelLevel: 28, batteryLevel: 79, engineHealth: 74, tyreHealth: 52, maintenanceOverdue: false, fuelEfficiency: 3.6, capacity: "25 Tons", lastServiceDate: "2026-04-18", odometer: 122600 },
  { id: "v-106", plateNumber: "HR-26-CV-3391", model: "Tata Ultra T.16", status: "ACTIVE", fuelLevel: 67, batteryLevel: 90, engineHealth: 89, tyreHealth: 84, maintenanceOverdue: false, fuelEfficiency: 5.1, capacity: "16 Tons", lastServiceDate: "2026-06-20", odometer: 67300 },
  { id: "v-107", plateNumber: "GJ-01-XX-5561", model: "BharatBenz 1917R", status: "ACTIVE", fuelLevel: 78, batteryLevel: 92, engineHealth: 95, tyreHealth: 91, maintenanceOverdue: false, fuelEfficiency: 5.5, capacity: "12 Tons", lastServiceDate: "2026-06-11", odometer: 51200 },
  { id: "v-108", plateNumber: "MH-14-EU-2281", model: "Mahindra Furio 14", status: "ACTIVE", fuelLevel: 50, batteryLevel: 85, engineHealth: 82, tyreHealth: 79, maintenanceOverdue: false, fuelEfficiency: 5.8, capacity: "14 Tons", lastServiceDate: "2026-05-30", odometer: 89200 },
  { id: "v-109", plateNumber: "KA-51-AB-1204", model: "Ashok Leyland Partner", status: "ACTIVE", fuelLevel: 35, batteryLevel: 75, engineHealth: 78, tyreHealth: 70, maintenanceOverdue: false, fuelEfficiency: 7.2, capacity: "4 Tons", lastServiceDate: "2026-03-25", odometer: 110400 },
  { id: "v-110", plateNumber: "MH-46-XY-9005", model: "Tata Prima 4030.S", status: "ACTIVE", fuelLevel: 85, batteryLevel: 95, engineHealth: 90, tyreHealth: 88, maintenanceOverdue: false, fuelEfficiency: 3.0, capacity: "40 Tons", lastServiceDate: "2026-07-05", odometer: 35100 },
  { id: "v-111", plateNumber: "DL-03-TY-4521", model: "Eicher Pro 2049", status: "ACTIVE", fuelLevel: 90, batteryLevel: 98, engineHealth: 96, tyreHealth: 95, maintenanceOverdue: false, fuelEfficiency: 8.0, capacity: "5 Tons", lastServiceDate: "2026-07-08", odometer: 12400 },
  { id: "v-112", plateNumber: "HR-55-P-0982", model: "BharatBenz 3523R", status: "ACTIVE", fuelLevel: 40, batteryLevel: 80, engineHealth: 84, tyreHealth: 75, maintenanceOverdue: false, fuelEfficiency: 3.5, capacity: "22 Tons", lastServiceDate: "2026-05-18", odometer: 147800 }
];

let drivers = [
  { id: "d-201", name: "Rajesh Yadav", email: "rajesh.yadav@transitops.com", phone: "+91 88888 77777", licenseNumber: "DL-14201800495", licenseExpiryDate: "2026-07-16", safetyScore: 92, status: "ON_TRIP", completedTrips: 148 },
  { id: "d-202", name: "Gurpreet Singh", email: "gurpreet.singh@transitops.com", phone: "+91 97777 66666", licenseNumber: "PB-02201500321", licenseExpiryDate: "2028-11-22", safetyScore: 88, status: "AVAILABLE", completedTrips: 210 },
  { id: "d-203", name: "Amit Kulkarni", email: "amit.k@transitops.com", phone: "+91 95555 44444", licenseNumber: "MH-12201900892", licenseExpiryDate: "2026-08-10", safetyScore: 95, status: "OFF_DUTY", completedTrips: 84 },
  { id: "d-204", name: "Suresh Pillai", email: "suresh.p@transitops.com", phone: "+91 93333 22222", licenseNumber: "KL-07201200122", licenseExpiryDate: "2026-07-25", safetyScore: 76, status: "AVAILABLE", completedTrips: 345 },
  { id: "d-205", name: "Manoj Kumar", email: "manoj.k@transitops.com", phone: "+91 92222 11111", licenseNumber: "HR-26201700654", licenseExpiryDate: "2029-03-14", safetyScore: 90, status: "ON_TRIP", completedTrips: 112 },
  { id: "d-206", name: "Satish Sharma", email: "satish.s@transitops.com", phone: "+91 96666 55555", licenseNumber: "UP-16201400234", licenseExpiryDate: "2027-10-18", safetyScore: 94, status: "AVAILABLE", completedTrips: 165 },
  { id: "d-207", name: "Harpreet Gill", email: "harpreet.g@transitops.com", phone: "+91 94444 33333", licenseNumber: "PB-03201800109", licenseExpiryDate: "2029-12-05", safetyScore: 89, status: "AVAILABLE", completedTrips: 122 },
  { id: "d-208", name: "Vikram Rathore", email: "vikram.r@transitops.com", phone: "+91 91111 22222", licenseNumber: "RJ-14201300951", licenseExpiryDate: "2026-11-30", safetyScore: 91, status: "ON_TRIP", completedTrips: 203 },
  { id: "d-209", name: "Sanjay Dutt", email: "sanjay.d@transitops.com", phone: "+91 92222 33333", licenseNumber: "MH-01201100554", licenseExpiryDate: "2028-04-15", safetyScore: 82, status: "OFF_DUTY", completedTrips: 98 },
  { id: "d-210", name: "Ramesh Gowda", email: "ramesh.g@transitops.com", phone: "+91 98888 99999", licenseNumber: "KA-04201600871", licenseExpiryDate: "2027-05-20", safetyScore: 96, status: "AVAILABLE", completedTrips: 278 }
];

let routes = [
  { id: "r-301", name: "Surat ↔ Mumbai (Corridor A)", distance: 280, duration: "6h 15m", stops: ["Surat Hub", "Navsari Toll", "Valsad Depot", "Vapi Geofence", "Mumbai Hub"], coordinates: [[21.1702, 72.8311], [20.9467, 72.9520], [20.5992, 72.9342], [20.3893, 72.9106], [19.0760, 72.8777]] },
  { id: "r-302", name: "Ahmedabad ↔ Vadodara ↔ Mumbai", distance: 530, duration: "10h 30m", stops: ["Ahmedabad Central", "Nadiad Bypass", "Vadodara Hub", "Bharuch Toll", "Surat Hub", "Vapi Geofence", "Mumbai Hub"], coordinates: [[23.0225, 72.5714], [22.6916, 72.8634], [22.3072, 73.1812], [21.7051, 72.9959], [21.1702, 72.8311], [20.3893, 72.9106], [19.0760, 72.8777]] },
  { id: "r-303", name: "Delhi NCR ↔ Jaipur Express", distance: 270, duration: "5h 45m", stops: ["Gurgaon Hub", "Dharuhera Toll", "Kotputli Depot", "Shahpura Stop", "Jaipur Hub"], coordinates: [[28.4595, 77.0266], [28.2045, 76.7905], [27.7056, 76.2238], [27.3879, 75.9616], [26.9124, 75.7873]] },
  { id: "r-304", name: "Mumbai ↔ Pune Express Route", distance: 150, duration: "3h 45m", stops: ["Mumbai Hub", "Panvel Gate", "Lonavala Bypass", "Chinchwad Hub", "Pune Depot"], coordinates: [[19.0760, 72.8777], [18.9894, 73.1175], [18.7557, 73.4091], [18.6279, 73.7997], [18.5204, 73.8567]] }
];

let shipments = [
  {
    id: "TRK-90412",
    customerName: "Meridian Retail Pvt Ltd",
    pickup: "Surat Textile Hub, Gujarat",
    destination: "Meridian Logistics Terminal, Mumbai, MH",
    eta: "4:35 PM (Today)",
    departureTime: "10:20 AM",
    status: "IN_TRANSIT",
    progress: 72,
    driverId: "d-201",
    driverName: "Rajesh Yadav",
    vehicleId: "v-101",
    vehicleNumber: "MH-04-GP-8834",
    weight: 12500,
    cargoType: "Premium Cotton Textile Rolls",
    priority: "HIGH",
    invoiceId: "INV-90412-A",
    lorryReceiptId: "LR-90412-B",
    podId: "POD-90412-C",
    passId: "PASS-90412-X",
    trackingHistory: [
      { timestamp: "2026-07-11T10:20:00", status: "PICKED_UP", location: "Surat Textile Hub", description: "Cargo loaded and signed by dispatcher Rajesh Yadav." },
      { timestamp: "2026-07-11T11:45:00", status: "IN_TRANSIT", location: "Navsari Express Toll", description: "Vehicle entered highway, average speed 65 km/h." },
      { timestamp: "2026-07-11T13:10:00", status: "IN_TRANSIT", location: "Valsad Geofence Entry", description: "Routine driver halt for safety inspection. Fuel verified." },
      { timestamp: "2026-07-11T14:55:00", status: "IN_TRANSIT", location: "Vapi Geofence Crossing", description: "Vehicle passed Surat-Maharashtra border safely." }
    ]
  },
  {
    id: "TRK-88129",
    customerName: "Adani Solar Panels",
    pickup: "Mundra Port Depot, Gujarat",
    destination: "Pune Green Energy Field, Maharashtra",
    eta: "08:15 AM (Tomorrow)",
    departureTime: "02:40 PM",
    status: "CONFIRMED",
    progress: 20,
    driverId: "d-205",
    driverName: "Manoj Kumar",
    vehicleId: "v-105",
    vehicleNumber: "MH-12-RS-6192",
    weight: 24000,
    cargoType: "Photovoltaic Panels Grade-A",
    priority: "MEDIUM",
    invoiceId: "INV-88129-A",
    lorryReceiptId: "LR-88129-B",
    podId: "POD-88129-C",
    passId: "PASS-88129-X",
    trackingHistory: [
      { timestamp: "2026-07-11T14:40:00", status: "CONFIRMED", location: "Mundra Port Depot", description: "Shipment confirmed and ready for dispatch assignment." },
      { timestamp: "2026-07-11T15:30:00", status: "CONFIRMED", location: "Mundra Central Gate", description: "Custom clearance verified." }
    ]
  },
  {
    id: "TRK-77110",
    customerName: "Tata Motors Spare Parts",
    pickup: "Sanand Plant, Ahmedabad",
    destination: "Vikhroli Service Station, Mumbai",
    eta: "Completed (Yesterday)",
    departureTime: "2026-07-10T08:00:00",
    status: "DELIVERED",
    progress: 100,
    driverId: "d-202",
    driverName: "Gurpreet Singh",
    vehicleId: "v-102",
    vehicleNumber: "GJ-05-UU-2941",
    weight: 9500,
    cargoType: "Engine Parts & Suspensions",
    priority: "HIGH",
    invoiceId: "INV-77110-A",
    lorryReceiptId: "LR-77110-B",
    podId: "POD-77110-C",
    passId: "PASS-77110-X",
    trackingHistory: [
      { timestamp: "2026-07-10T08:00:00", status: "PICKED_UP", location: "Ahmedabad Sanand Plant", description: "Cargo dispatched with gate pass GP-99120." },
      { timestamp: "2026-07-10T14:15:00", status: "AT_HUB", location: "Surat Central Hub", description: "Halting for mandatory hub checklist." },
      { timestamp: "2026-07-10T21:40:00", status: "DELIVERED", location: "Vikhroli Depot, Mumbai", description: "Cargo delivered. Signed by Supervisor Sunil Kumar." }
    ]
  },
  {
    id: "TRK-55410",
    customerName: "Amazon Logistics Center",
    pickup: "Delhi NCR Warehouse",
    destination: "Jaipur Fulfillment Center",
    eta: "Delayed by Traffic (07:30 PM)",
    departureTime: "01:00 PM",
    status: "DELAYED",
    progress: 55,
    driverId: "d-204",
    driverName: "Suresh Pillai",
    vehicleId: "v-104",
    vehicleNumber: "KA-03-MM-9912",
    weight: 18000,
    cargoType: "Fulfillment Retail Packages",
    priority: "HIGH",
    invoiceId: "INV-55410-A",
    lorryReceiptId: "LR-55410-B",
    podId: "POD-55410-C",
    passId: "PASS-55410-X",
    trackingHistory: [
      { timestamp: "2026-07-11T13:00:00", status: "PICKED_UP", location: "Gurgaon Hub", description: "Dispatched from terminal." },
      { timestamp: "2026-07-11T15:45:00", status: "DELAYED", location: "Kotputli Highway Junction", description: "Severe traffic backlog due to highway repair. ETA revised." }
    ]
  },
  {
    id: "TRK-10005",
    customerName: "Meridian Retail Pvt Ltd",
    pickup: "Bhiwandi Hub, Mumbai",
    destination: "Vashi Wholesale Market, Navi Mumbai",
    eta: "02:00 PM (Today)",
    departureTime: "11:30 AM",
    status: "BOOKED",
    progress: 0,
    weight: 8000,
    cargoType: "Packaged FMCG Foods",
    priority: "LOW",
    invoiceId: "INV-10005-A",
    lorryReceiptId: "LR-10005-B",
    podId: "POD-10005-C",
    passId: "PASS-10005-X",
    trackingHistory: [
      { timestamp: "2026-07-12T11:30:00", status: "BOOKED", location: "Bhiwandi Hub", description: "Order logged and registered on logistics ledger." }
    ]
  },
  {
    id: "TRK-10006",
    customerName: "UltraTech Cement",
    pickup: "Satna Plant, Madhya Pradesh",
    destination: "Noida Construction Sector 62",
    eta: "11:00 AM (Tomorrow)",
    departureTime: "06:00 AM",
    status: "IN_TRANSIT",
    progress: 40,
    driverId: "d-208",
    driverName: "Vikram Rathore",
    vehicleId: "v-112",
    vehicleNumber: "HR-55-P-0982",
    weight: 35000,
    cargoType: "Grade-43 OPC Cement Bags",
    priority: "MEDIUM",
    invoiceId: "INV-10006-A",
    lorryReceiptId: "LR-10006-B",
    podId: "POD-10006-C",
    passId: "PASS-10006-X",
    trackingHistory: [
      { timestamp: "2026-07-12T06:00:00", status: "PICKED_UP", location: "Satna Cement Yard", description: "Heavy cement carrier loaded." }
    ]
  },
  {
    id: "TRK-10007",
    customerName: "Jindal Steel & Power",
    pickup: "Angul Smelter, Odisha",
    destination: "Faridabad Fabrication Unit",
    eta: "04:00 PM (Tomorrow)",
    departureTime: "04:30 AM",
    status: "IN_TRANSIT",
    progress: 60,
    driverId: "d-201",
    driverName: "Rajesh Yadav",
    vehicleId: "v-110",
    vehicleNumber: "MH-46-XY-9005",
    weight: 28000,
    cargoType: "TMT Reinforced Steel Rebars",
    priority: "HIGH",
    invoiceId: "INV-10007-A",
    lorryReceiptId: "LR-10007-B",
    podId: "POD-10007-C",
    passId: "PASS-10007-X",
    trackingHistory: [
      { timestamp: "2026-07-12T04:30:00", status: "PICKED_UP", location: "Angul Steel Gate 2", description: "Oversized structural iron consignment rolled out." }
    ]
  },
  {
    id: "TRK-10008",
    customerName: "Meridian Retail Pvt Ltd",
    pickup: "Surat Apparel Zone, Gujarat",
    destination: "Commercial Plaza, Pune, MH",
    eta: "09:45 PM (Today)",
    departureTime: "03:00 PM",
    status: "BOOKED",
    progress: 0,
    weight: 4500,
    cargoType: "Premium Festive Wear Outfits",
    priority: "MEDIUM",
    invoiceId: "INV-10008-A",
    lorryReceiptId: "LR-10008-B",
    podId: "POD-10008-C",
    passId: "PASS-10008-X",
    trackingHistory: [
      { timestamp: "2026-07-12T09:00:00", status: "BOOKED", location: "Surat Apparel Zone", description: "Package dimensions scanned and passed customs verification." }
    ]
  },
  {
    id: "TRK-10009",
    customerName: "ITC Food Division",
    pickup: "Haridwar Food Park, Uttarakhand",
    destination: "Lucknow Central Warehouse, UP",
    eta: "08:15 PM (Today)",
    departureTime: "09:00 AM",
    status: "OUT_FOR_DELIVERY",
    progress: 95,
    driverId: "d-206",
    driverName: "Satish Sharma",
    vehicleId: "v-106",
    vehicleNumber: "HR-26-CV-3391",
    weight: 15000,
    cargoType: "Aashirvaad Atta & Sunfeast Biscuits",
    priority: "HIGH",
    invoiceId: "INV-10009-A",
    lorryReceiptId: "LR-10009-B",
    podId: "POD-10009-C",
    passId: "PASS-10009-X",
    trackingHistory: [
      { timestamp: "2026-07-12T09:00:00", status: "PICKED_UP", location: "Haridwar Logistics Depot", description: "FMCG cartons loaded safely into closed container." }
    ]
  },
  {
    id: "TRK-10010",
    customerName: "Aurobindo Pharma",
    pickup: "Hyderabad Genome Valley, TS",
    destination: "JNPT Port Terminal, Mumbai, MH",
    eta: "11:55 PM (Today)",
    departureTime: "05:00 AM",
    status: "DELAYED",
    progress: 45,
    driverId: "d-207",
    driverName: "Harpreet Gill",
    vehicleId: "v-108",
    vehicleNumber: "MH-14-EU-2281",
    weight: 6200,
    cargoType: "Temperature-Controlled Drugs",
    priority: "HIGH",
    invoiceId: "INV-10010-A",
    lorryReceiptId: "LR-10010-B",
    podId: "POD-10010-C",
    passId: "PASS-10010-X",
    trackingHistory: [
      { timestamp: "2026-07-12T05:00:00", status: "PICKED_UP", location: "Hyderabad Pharma Vault", description: "Reefer cooling system activated and locked at 4°C." },
      { timestamp: "2026-07-12T11:00:00", status: "DELAYED", location: "Solapur Bypass", description: "Reefer power fluctuation triggered warning. Halted for checkup." }
    ]
  },
  {
    id: "TRK-10011",
    customerName: "Amul Dairy",
    pickup: "Anand Cooperatives, Gujarat",
    destination: "Delhi Cold Storage Hub",
    eta: "01:10 AM (Tomorrow)",
    departureTime: "11:00 AM",
    status: "IN_TRANSIT",
    progress: 80,
    driverId: "d-210",
    driverName: "Ramesh Gowda",
    vehicleId: "v-107",
    vehicleNumber: "GJ-01-XX-5561",
    weight: 11000,
    cargoType: "Pasteurized Salted Butter Cartons",
    priority: "HIGH",
    invoiceId: "INV-10011-A",
    lorryReceiptId: "LR-10011-B",
    podId: "POD-10011-C",
    passId: "PASS-10011-X",
    trackingHistory: [
      { timestamp: "2026-07-12T11:00:00", status: "PICKED_UP", location: "Anand Processing Plant", description: "Dairy cold consignment sealed under logistics supervisor." }
    ]
  },
  {
    id: "TRK-10012",
    customerName: "Meridian Retail Pvt Ltd",
    pickup: "Bhiwandi Hub, Mumbai",
    destination: "Indore Retail Plaza, MP",
    eta: "05:30 PM (Tomorrow)",
    departureTime: "04:00 PM",
    status: "BOOKED",
    progress: 0,
    weight: 14000,
    cargoType: "Seasonal Retail Goods & Electronics",
    priority: "MEDIUM",
    invoiceId: "INV-10012-A",
    lorryReceiptId: "LR-10012-B",
    podId: "POD-10012-C",
    passId: "PASS-10012-X",
    trackingHistory: [
      { timestamp: "2026-07-12T14:30:00", status: "BOOKED", location: "Bhiwandi Hub", description: "Invoice details registered." }
    ]
  },
  {
    id: "TRK-10013",
    customerName: "Apollo Tyres Ltd",
    pickup: "Limda Plant, Vadodara",
    destination: "Chennai Port Depot, TN",
    eta: "Completed (Yesterday)",
    departureTime: "2026-07-10T12:00:00",
    status: "DELIVERED",
    progress: 100,
    driverId: "d-202",
    driverName: "Gurpreet Singh",
    vehicleId: "v-102",
    vehicleNumber: "GJ-05-UU-2941",
    weight: 16500,
    cargoType: "All-Weather Radial Tubeless Tyres",
    priority: "MEDIUM",
    invoiceId: "INV-10013-A",
    lorryReceiptId: "LR-10013-B",
    podId: "POD-10013-C",
    passId: "PASS-10013-X",
    trackingHistory: [
      { timestamp: "2026-07-10T12:00:00", status: "PICKED_UP", location: "Vadodara Plant Terminal", description: "Radial tyres stacked and secured with nylon braces." },
      { timestamp: "2026-07-11T19:30:00", status: "DELIVERED", location: "Chennai Port Gate 4", description: "Handed over to export logistics officer." }
    ]
  },
  {
    id: "TRK-10014",
    customerName: "Asian Paints Ltd",
    pickup: "Ankleshwar Plant, Gujarat",
    destination: "Goa Central Warehouse",
    eta: "Completed (Yesterday)",
    departureTime: "2026-07-09T14:00:00",
    status: "DELIVERED",
    progress: 100,
    driverId: "d-204",
    driverName: "Suresh Pillai",
    vehicleId: "v-104",
    vehicleNumber: "KA-03-MM-9912",
    weight: 19000,
    cargoType: "Premium Emulsion Paints & Solvents",
    priority: "LOW",
    invoiceId: "INV-10014-A",
    lorryReceiptId: "LR-10014-B",
    podId: "POD-10014-C",
    passId: "PASS-10014-X",
    trackingHistory: [
      { timestamp: "2026-07-09T14:00:00", status: "PICKED_UP", location: "Ankleshwar Chemical Zone", description: "Fitted hazmat safety guidelines and completed loading." },
      { timestamp: "2026-07-10T22:15:00", status: "DELIVERED", location: "Goa Warehouse Yard", description: "Delivered in full. Zero spillage reported." }
    ]
  },
  {
    id: "TRK-10015",
    customerName: "Meridian Retail Pvt Ltd",
    pickup: "Bengaluru Logistics Yard",
    destination: "Mysuru Superstore Terminal",
    eta: "04:30 PM (Today)",
    departureTime: "10:00 AM",
    status: "OUT_FOR_DELIVERY",
    progress: 90,
    driverId: "d-210",
    driverName: "Ramesh Gowda",
    vehicleId: "v-109",
    vehicleNumber: "KA-51-AB-1204",
    weight: 3800,
    cargoType: "Household Home Furnishings",
    priority: "LOW",
    invoiceId: "INV-10015-A",
    lorryReceiptId: "LR-10015-B",
    podId: "POD-10015-C",
    passId: "PASS-10015-X",
    trackingHistory: [
      { timestamp: "2026-07-12T10:00:00", status: "PICKED_UP", location: "Bengaluru Yard", description: "Local city delivery loaded." }
    ]
  },
  {
    id: "TRK-10016",
    customerName: "L&T Heavy Engineering",
    pickup: "Hazira Complex, Surat",
    destination: "NTPC Plant, Ramagundam",
    eta: "03:00 PM (Tomorrow)",
    departureTime: "11:00 AM",
    status: "BOOKED",
    progress: 0,
    weight: 38000,
    cargoType: "Industrial Steam Turbine Castings",
    priority: "HIGH",
    invoiceId: "INV-10016-A",
    lorryReceiptId: "LR-10016-B",
    podId: "POD-10016-C",
    passId: "PASS-10016-X",
    trackingHistory: [
      { timestamp: "2026-07-12T11:00:00", status: "BOOKED", location: "Hazira Complex", description: "Oversized cargo permissions requested from NHAI." }
    ]
  },
  {
    id: "TRK-10017",
    customerName: "Samsung India",
    pickup: "Noida SEZ Factory, UP",
    destination: "Ahmedabad Distribution Hub",
    eta: "11:15 AM (Tomorrow)",
    departureTime: "12:00 PM",
    status: "IN_TRANSIT",
    progress: 35,
    driverId: "d-205",
    driverName: "Manoj Kumar",
    vehicleId: "v-111",
    vehicleNumber: "DL-03-TY-4521",
    weight: 4800,
    cargoType: "Smartphones & Smart LED Televisions",
    priority: "HIGH",
    invoiceId: "INV-10017-A",
    lorryReceiptId: "LR-10017-B",
    podId: "POD-10017-C",
    passId: "PASS-10017-X",
    trackingHistory: [
      { timestamp: "2026-07-12T12:00:00", status: "PICKED_UP", location: "Noida SEZ Gate 1", description: "Electronics security transit seal checked and signed." }
    ]
  },
  {
    id: "TRK-10018",
    customerName: "Haldiram Foods",
    pickup: "Nagpur Production Unit, MS",
    destination: "Bandra Depot, Mumbai, MH",
    eta: "Completed (Yesterday)",
    departureTime: "2026-07-11T04:00:00",
    status: "DELIVERED",
    progress: 100,
    driverId: "d-206",
    driverName: "Satish Sharma",
    vehicleId: "v-106",
    vehicleNumber: "HR-26-CV-3391",
    weight: 12000,
    cargoType: "Traditional Savory Snacks & Sweets",
    priority: "MEDIUM",
    invoiceId: "INV-10018-A",
    lorryReceiptId: "LR-10018-B",
    podId: "POD-10018-C",
    passId: "PASS-10018-X",
    trackingHistory: [
      { timestamp: "2026-07-11T04:00:00", status: "PICKED_UP", location: "Nagpur Plant Yard", description: "Boxes packed and stacked on double-deck pallets." },
      { timestamp: "2026-07-11T20:45:00", status: "DELIVERED", location: "Mumbai Bandra Yard", description: "Consignment checked and verified by security supervisor." }
    ]
  }
];

let trips = [
  { id: "t-401", vehicleId: "v-101", driverId: "d-201", routeId: "r-301", status: "ACTIVE", startTime: "2026-07-11T10:20:00", cost: 14500 },
  { id: "t-402", vehicleId: "v-105", driverId: "d-205", routeId: "r-302", status: "ACTIVE", startTime: "2026-07-11T15:00:00", cost: 26000 },
  { id: "t-403", vehicleId: "v-102", driverId: "d-202", routeId: "r-302", status: "COMPLETED", startTime: "2026-07-10T08:00:00", endTime: "2026-07-10T21:40:00", fuelConsumed: 125, cost: 24500 },
  { id: "t-404", vehicleId: "v-112", driverId: "d-208", routeId: "r-301", status: "ACTIVE", startTime: "2026-07-12T06:00:00", cost: 18400 },
  { id: "t-405", vehicleId: "v-110", driverId: "d-201", routeId: "r-302", status: "ACTIVE", startTime: "2026-07-12T04:30:00", cost: 28900 },
  { id: "t-406", vehicleId: "v-106", driverId: "d-206", routeId: "r-304", status: "ACTIVE", startTime: "2026-07-12T09:00:00", cost: 9800 },
  { id: "t-407", vehicleId: "v-108", driverId: "d-207", routeId: "r-302", status: "DELAYED", startTime: "2026-07-12T05:00:00", cost: 24300 },
  { id: "t-408", vehicleId: "v-107", driverId: "d-210", routeId: "r-302", status: "ACTIVE", startTime: "2026-07-12T11:00:00", cost: 25000 },
  { id: "t-409", vehicleId: "v-102", driverId: "d-202", routeId: "r-302", status: "COMPLETED", startTime: "2026-07-10T12:00:00", endTime: "2026-07-11T19:30:00", fuelConsumed: 110, cost: 22000 },
  { id: "t-410", vehicleId: "v-104", driverId: "d-204", routeId: "r-303", status: "COMPLETED", startTime: "2026-07-09T14:00:00", endTime: "2026-07-10T22:15:00", fuelConsumed: 95, cost: 19500 },
  { id: "t-411", vehicleId: "v-111", driverId: "d-205", routeId: "r-303", status: "ACTIVE", startTime: "2026-07-12T12:00:00", cost: 11500 },
  { id: "t-412", vehicleId: "v-106", driverId: "d-206", routeId: "r-302", status: "COMPLETED", startTime: "2026-07-11T04:00:00", endTime: "2026-07-11T20:45:00", fuelConsumed: 120, cost: 21000 }
];

let lorryReceipts = [
  { id: "LR-90412-B", shipmentId: "TRK-90412", consignor: "Meridian Retail Ltd. / Surat Hub", consignee: "Meridian Logistics Terminal, Mumbai, MH", vehiclePlate: "MH-04-GP-8834", driverName: "Rajesh Yadav", cargoType: "Premium Cotton Textile Rolls", weight: 12500, date: "2026-07-11" },
  { id: "LR-88129-B", shipmentId: "TRK-88129", consignor: "Adani Solar Panels / Mundra Port", consignee: "Pune Green Energy Field, Maharashtra", vehiclePlate: "MH-12-RS-6192", driverName: "Manoj Kumar", cargoType: "Photovoltaic Panels Grade-A", weight: 24000, date: "2026-07-11" },
  { id: "LR-77110-B", shipmentId: "TRK-77110", consignor: "Tata Motors Spare Parts", consignee: "Vikhroli Service Station, Mumbai", vehiclePlate: "GJ-05-UU-2941", driverName: "Gurpreet Singh", cargoType: "Engine Parts & Suspensions", weight: 9500, date: "2026-07-10" },
  { id: "LR-55410-B", shipmentId: "TRK-55410", consignor: "Amazon Logistics Center", consignee: "Jaipur Fulfillment Center", vehiclePlate: "KA-03-MM-9912", driverName: "Suresh Pillai", cargoType: "Fulfillment Retail Packages", weight: 18000, date: "2026-07-11" },
  { id: "LR-10006-B", shipmentId: "TRK-10006", consignor: "Satna Cement Yard / MP", consignee: "Noida Construction Sector 62", vehiclePlate: "HR-55-P-0982", driverName: "Vikram Rathore", cargoType: "Grade-43 OPC Cement Bags", weight: 35000, date: "2026-07-12" },
  { id: "LR-10007-B", shipmentId: "TRK-10007", consignor: "Angul Steel Gate 2 / Odisha", consignee: "Faridabad Fabrication Unit", vehiclePlate: "MH-46-XY-9005", driverName: "Rajesh Yadav", cargoType: "TMT Reinforced Steel Rebars", weight: 28000, date: "2026-07-12" },
  { id: "LR-10009-B", shipmentId: "TRK-10009", consignor: "Haridwar Logistics Depot", consignee: "Lucknow Central Warehouse, UP", vehiclePlate: "HR-26-CV-3391", driverName: "Satish Sharma", cargoType: "Aashirvaad Atta & Sunfeast Biscuits", weight: 15000, date: "2026-07-12" },
  { id: "LR-10010-B", shipmentId: "TRK-10010", consignor: "Hyderabad Pharma Vault", consignee: "JNPT Port Terminal, Mumbai, MH", vehiclePlate: "MH-14-EU-2281", driverName: "Harpreet Gill", cargoType: "Temperature-Controlled Drugs", weight: 6200, date: "2026-07-12" },
  { id: "LR-10011-B", shipmentId: "TRK-10011", consignor: "Anand Processing Plant", consignee: "Delhi Cold Storage Hub", vehiclePlate: "GJ-01-XX-5561", driverName: "Ramesh Gowda", cargoType: "Pasteurized Salted Butter Cartons", weight: 11000, date: "2026-07-12" },
  { id: "LR-10013-B", shipmentId: "TRK-10013", consignor: "Vadodara Plant Terminal", consignee: "Chennai Port Depot, TN", vehiclePlate: "GJ-05-UU-2941", driverName: "Gurpreet Singh", cargoType: "All-Weather Radial Tubeless Tyres", weight: 16500, date: "2026-07-10" },
  { id: "LR-10014-B", shipmentId: "TRK-10014", consignor: "Ankleshwar Chemical Zone", consignee: "Goa Central Warehouse", vehiclePlate: "KA-03-MM-9912", driverName: "Suresh Pillai", cargoType: "Premium Emulsion Paints & Solvents", weight: 19000, date: "2026-07-09" },
  { id: "LR-10015-B", shipmentId: "TRK-10015", consignor: "Bengaluru Logistics Yard", consignee: "Mysuru Superstore Terminal", vehiclePlate: "KA-51-AB-1204", driverName: "Ramesh Gowda", cargoType: "Household Home Furnishings", weight: 3800, date: "2026-07-12" },
  { id: "LR-10017-B", shipmentId: "TRK-10017", consignor: "Noida SEZ Factory, UP", consignee: "Ahmedabad Distribution Hub", vehiclePlate: "DL-03-TY-4521", driverName: "Manoj Kumar", cargoType: "Smartphones & Smart LED Televisions", weight: 4800, date: "2026-07-12" },
  { id: "LR-10018-B", shipmentId: "TRK-10018", consignor: "Nagpur Plant Yard", consignee: "Mumbai Bandra Yard", vehiclePlate: "HR-26-CV-3391", driverName: "Satish Sharma", cargoType: "Traditional Savory Snacks & Sweets", weight: 12000, date: "2026-07-11" }
];

let expenses = [
  { id: "e-501", tripId: "t-401", category: "FUEL", amount: 8400, date: "2026-07-11", description: "Diesel top-up at Surat NH-48 HP Pump" },
  { id: "e-502", tripId: "t-401", category: "TOLL", amount: 1250, date: "2026-07-11", description: "Navsari and Vapi toll plazas" },
  { id: "e-503", tripId: "t-403", category: "FUEL", amount: 14500, date: "2026-07-10", description: "Full tank diesel - Ahmedabad Central Depot" },
  { id: "e-504", tripId: "t-403", category: "MAINTENANCE", amount: 3500, date: "2026-07-10", description: "Tyre pressure alignment & washer fluid" }
];

let maintenanceRecords = [
  { id: "m-601", vehicleId: "v-103", description: "Engine overhaul, compression leak fixing, and fuel injector calibration", cost: 42000, date: "2026-07-08", status: "SCHEDULED" },
  { id: "m-602", vehicleId: "v-102", description: "Brake pad replacements & suspension lubrication checkup", cost: 8500, date: "2026-05-10", status: "COMPLETED" },
  { id: "m-603", vehicleId: "v-105", description: "Cabin AC repair & structural rear door lock alignment", cost: 4500, date: "2026-04-18", status: "COMPLETED" }
];

let geofences = [
  { id: "g-701", name: "Valsad Bypass Geofence", lat: 20.5992, lng: 72.9342, radius: 2500, alertsCount: 3 },
  { id: "g-702", name: "Surat Hub Perimeter", lat: 21.1702, lng: 72.8311, radius: 1000, alertsCount: 0 },
  { id: "g-703", name: "Vapi Checkpost Barrier", lat: 20.3893, lng: 72.9106, radius: 1500, alertsCount: 14 },
  { id: "g-704", name: "Mumbai JNPT Port Entrance", lat: 18.9482, lng: 72.9490, radius: 3000, alertsCount: 8 }
];

let aiInsights = [
  { id: "i-801", category: "FUEL", text: "Truck MH-04-GP-8834 fuel efficiency dropped 22% compared to historical average on Surat-Mumbai run.", severity: "CRITICAL", timestamp: "2026-07-11T14:30:00" },
  { id: "i-802", category: "LICENSE", text: "Driver Rajesh Yadav license (DL-14201800495) expires in 5 days (July 16, 2026). Immediate renewal required.", severity: "CRITICAL", timestamp: "2026-07-11T10:00:00" },
  { id: "i-803", category: "MAINTENANCE", text: "Vehicle DL-01-AA-4439 maintenance overhaul is 37 days overdue. High risk of breakdown on route.", severity: "WARNING", timestamp: "2026-07-10T18:00:00" },
  { id: "i-804", category: "PROFITABILITY", text: "Route Ahmedabad-Vadodara-Mumbai profitability has increased by 14% due to optimal multi-point cargo aggregation.", severity: "SUCCESS", timestamp: "2026-07-11T11:15:00" },
  { id: "i-805", category: "UTILIZATION", text: "Fleet utilization improved by 8% this week by automated scheduling and matching.", severity: "INFO", timestamp: "2026-07-11T09:00:00" }
];

// ==========================================
// REST APIs & Access Controls
// ==========================================

// Authentication Router
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (user && user.password === password) {
    const token = `mock-jwt-token-for-${user.id}-${user.role}`;
    return res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, company: user.company }
    });
  }
  return res.status(401).json({ error: "Invalid email or password." });
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, name, role, phone, company } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "Missing required registration parameters." });
  }
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Email is already registered." });
  }
  const newUser = {
    id: `u-${users.length + 1}`,
    email,
    password,
    name,
    role: role.toUpperCase(),
    phone: phone || "+91 99999 88888",
    company: company || "Logistics Partner"
  };
  users.push(newUser);
  const token = `mock-jwt-token-for-${newUser.id}-${newUser.role}`;
  return res.json({
    success: true,
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, phone: newUser.phone, company: newUser.company }
  });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  return res.json({ success: true, message: `A premium password reset link has been dispatched to ${email}.` });
});

app.put("/api/auth/profile", (req, res) => {
  const { id, name, phone, company } = req.body;
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex !== -1) {
    users[userIndex].name = name || users[userIndex].name;
    users[userIndex].phone = phone || users[userIndex].phone;
    users[userIndex].company = company || users[userIndex].company;
    return res.json({ success: true, user: users[userIndex] });
  }
  return res.status(404).json({ error: "User not found." });
});

// CRUD - Shipments
app.get("/api/shipments", (req, res) => {
  res.json(shipments);
});

app.post("/api/shipments", (req, res) => {
  const data = req.body;
  const newShipment = {
    id: `TRK-${Math.floor(10000 + Math.random() * 90000)}`,
    customerName: data.customerName || "Independent Corporate Client",
    pickup: data.pickup || "Ahmedabad central depot",
    destination: data.destination || "Mumbai warehouse, MH",
    eta: data.eta || "In 2 days",
    departureTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: data.status || "BOOKED",
    progress: 5,
    driverId: data.driverId || "",
    driverName: drivers.find(d => d.id === data.driverId)?.name || "Unassigned",
    vehicleId: data.vehicleId || "",
    vehicleNumber: vehicles.find(v => v.id === data.vehicleId)?.plateNumber || "Unassigned",
    weight: Number(data.weight) || 4500,
    cargoType: data.cargoType || "Standard Logistics Parcel",
    priority: data.priority || "MEDIUM",
    invoiceId: `INV-${Math.floor(10000 + Math.random() * 90000)}-A`,
    lorryReceiptId: `LR-${Math.floor(10000 + Math.random() * 90000)}-B`,
    podId: `POD-${Math.floor(10000 + Math.random() * 90000)}-C`,
    passId: `PASS-${Math.floor(10000 + Math.random() * 90000)}-X`,
    trackingHistory: [
      { timestamp: new Date().toISOString(), status: "BOOKED", location: data.pickup || "Origin Warehouse", description: "Shipment booked and initial pass generated." }
    ]
  };
  shipments.push(newShipment);
  res.json(newShipment);
});

app.put("/api/shipments/:id", (req, res) => {
  const { id } = req.params;
  const index = shipments.findIndex((s) => s.id === id);
  if (index !== -1) {
    const original = shipments[index];
    const updated = { ...original, ...req.body };
    
    // Add history entry if status changed
    if (req.body.status && req.body.status !== original.status) {
      updated.trackingHistory = [
        ...original.trackingHistory,
        {
          timestamp: new Date().toISOString(),
          status: req.body.status,
          location: req.body.currentLocation || original.destination,
          description: req.body.statusDescription || `Shipment transitioned to status: ${req.body.status}`
        }
      ];
    }
    shipments[index] = updated;
    return res.json(updated);
  }
  res.status(404).json({ error: "Shipment not found." });
});

app.delete("/api/shipments/:id", (req, res) => {
  const { id } = req.params;
  shipments = shipments.filter((s) => s.id !== id);
  res.json({ success: true });
});

// CRUD - Vehicles
app.get("/api/vehicles", (req, res) => {
  res.json(vehicles);
});

app.post("/api/vehicles", (req, res) => {
  const data = req.body;
  const newVehicle = {
    id: `v-${100 + vehicles.length + 1}`,
    plateNumber: data.plateNumber,
    model: data.model,
    status: data.status || "ACTIVE",
    fuelLevel: data.fuelLevel || 100,
    batteryLevel: data.batteryLevel || 100,
    engineHealth: data.engineHealth || 100,
    tyreHealth: data.tyreHealth || 100,
    maintenanceOverdue: data.maintenanceOverdue || false,
    fuelEfficiency: data.fuelEfficiency || 4.0,
    capacity: data.capacity || "15 Tons",
    lastServiceDate: data.lastServiceDate || new Date().toISOString().split('T')[0],
    odometer: Number(data.odometer) || 0
  };
  vehicles.push(newVehicle);
  res.json(newVehicle);
});

app.put("/api/vehicles/:id", (req, res) => {
  const { id } = req.params;
  const index = vehicles.findIndex((v) => v.id === id);
  if (index !== -1) {
    vehicles[index] = { ...vehicles[index], ...req.body };
    return res.json(vehicles[index]);
  }
  res.status(404).json({ error: "Vehicle not found." });
});

app.delete("/api/vehicles/:id", (req, res) => {
  const { id } = req.params;
  vehicles = vehicles.filter((v) => v.id !== id);
  res.json({ success: true });
});

// CRUD - Drivers
app.get("/api/drivers", (req, res) => {
  res.json(drivers);
});

app.post("/api/drivers", (req, res) => {
  const data = req.body;
  const newDriver = {
    id: `d-${200 + drivers.length + 1}`,
    name: data.name,
    email: data.email,
    phone: data.phone,
    licenseNumber: data.licenseNumber,
    licenseExpiryDate: data.licenseExpiryDate || "2028-12-31",
    safetyScore: data.safetyScore || 90,
    status: data.status || "AVAILABLE",
    completedTrips: 0
  };
  drivers.push(newDriver);
  res.json(newDriver);
});

app.put("/api/drivers/:id", (req, res) => {
  const { id } = req.params;
  const index = drivers.findIndex((d) => d.id === id);
  if (index !== -1) {
    drivers[index] = { ...drivers[index], ...req.body };
    return res.json(drivers[index]);
  }
  res.status(404).json({ error: "Driver not found." });
});

app.delete("/api/drivers/:id", (req, res) => {
  const { id } = req.params;
  drivers = drivers.filter((d) => d.id !== id);
  res.json({ success: true });
});

// Other CRUDs & stats
app.get("/api/expenses", (req, res) => res.json(expenses));
app.get("/api/maintenance", (req, res) => res.json(maintenanceRecords));
app.get("/api/geofences", (req, res) => res.json(geofences));
app.get("/api/insights", (req, res) => res.json(aiInsights));

// CRUD - Trips
app.get("/api/trips", (req, res) => {
  res.json(trips);
});

app.post("/api/trips", (req, res) => {
  const data = req.body;
  const newTrip = {
    id: `t-${400 + trips.length + 1}`,
    vehicleId: data.vehicleId || "",
    driverId: data.driverId || "",
    routeId: data.routeId || "",
    status: data.status || "SCHEDULED",
    startTime: data.startTime || new Date().toISOString(),
    endTime: data.endTime || "",
    fuelConsumed: data.fuelConsumed ? Number(data.fuelConsumed) : undefined,
    cost: Number(data.cost) || 15000
  };
  trips.push(newTrip);
  res.json(newTrip);
});

app.put("/api/trips/:id", (req, res) => {
  const { id } = req.params;
  const index = trips.findIndex((t) => t.id === id);
  if (index !== -1) {
    trips[index] = { ...trips[index], ...req.body };
    return res.json(trips[index]);
  }
  res.status(404).json({ error: "Trip not found." });
});

app.delete("/api/trips/:id", (req, res) => {
  const { id } = req.params;
  trips = trips.filter((t) => t.id !== id);
  res.json({ success: true });
});

// CRUD - Routes
app.get("/api/routes", (req, res) => {
  res.json(routes);
});

app.post("/api/routes", (req, res) => {
  const data = req.body;
  const newRoute = {
    id: `r-${300 + routes.length + 1}`,
    name: data.name || "Custom Route",
    distance: Number(data.distance) || 100,
    duration: data.duration || "2h 0m",
    stops: data.stops || [],
    coordinates: data.coordinates || [[21.1702, 72.8311], [18.9482, 72.9490]]
  };
  routes.push(newRoute);
  res.json(newRoute);
});

app.put("/api/routes/:id", (req, res) => {
  const { id } = req.params;
  const index = routes.findIndex((r) => r.id === id);
  if (index !== -1) {
    routes[index] = { ...routes[index], ...req.body };
    return res.json(routes[index]);
  }
  res.status(404).json({ error: "Route not found." });
});

app.delete("/api/routes/:id", (req, res) => {
  const { id } = req.params;
  routes = routes.filter((r) => r.id !== id);
  res.json({ success: true });
});

// CRUD - Lorry Receipts
app.get("/api/lorry-receipts", (req, res) => {
  res.json(lorryReceipts);
});

app.post("/api/lorry-receipts", (req, res) => {
  const data = req.body;
  const newLR = {
    id: data.id || `LR-${Math.floor(10000 + Math.random() * 90000)}-B`,
    shipmentId: data.shipmentId || "",
    consignor: data.consignor || "Consignor Name",
    consignee: data.consignee || "Consignee Name",
    vehiclePlate: data.vehiclePlate || "",
    driverName: data.driverName || "",
    cargoType: data.cargoType || "General Cargo",
    weight: Number(data.weight) || 1000,
    date: data.date || new Date().toISOString().split('T')[0]
  };
  lorryReceipts.push(newLR);
  res.json(newLR);
});

app.put("/api/lorry-receipts/:id", (req, res) => {
  const { id } = req.params;
  const index = lorryReceipts.findIndex((lr) => lr.id === id);
  if (index !== -1) {
    lorryReceipts[index] = { ...lorryReceipts[index], ...req.body };
    return res.json(lorryReceipts[index]);
  }
  res.status(404).json({ error: "Lorry Receipt not found." });
});

app.delete("/api/lorry-receipts/:id", (req, res) => {
  const { id } = req.params;
  lorryReceipts = lorryReceipts.filter((lr) => lr.id !== id);
  res.json({ success: true });
});

// Post new logs or expenses
app.post("/api/expenses", (req, res) => {
  const { category, amount, tripId, description } = req.body;
  const newExpense = {
    id: `e-${500 + expenses.length + 1}`,
    tripId: tripId || "t-401",
    category: category || "FUEL",
    amount: Number(amount) || 500,
    date: new Date().toISOString().split('T')[0],
    description: description || "Expense logged via console"
  };
  expenses.push(newExpense);
  res.json(newExpense);
});

app.post("/api/maintenance", (req, res) => {
  const { vehicleId, description, cost, status } = req.body;
  const newRecord = {
    id: `m-${600 + maintenanceRecords.length + 1}`,
    vehicleId,
    description,
    cost: Number(cost) || 1200,
    date: new Date().toISOString().split('T')[0],
    status: status || "SCHEDULED"
  };
  maintenanceRecords.push(newRecord);
  res.json(newRecord);
});

// ==========================================
// DOCUMENT PRINT & PREVIEW GENERATORS (HTML templates)
// ==========================================

app.get("/api/documents/print/:type/:shipmentId", (req, res) => {
  const { type, shipmentId } = req.params;
  const shipment = shipments.find((s) => s.id === shipmentId);

  if (!shipment) {
    return res.status(404).send("<h3>Document Error: Shipment reference not found</h3>");
  }

  const currentDate = new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' });

  let docTitle = "";
  let bodyContent = "";

  switch (type) {
    case "invoice":
      docTitle = `INVOICE - ${shipment.invoiceId}`;
      bodyContent = `
        <div class="invoice-card">
          <!-- Invoice Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">TransitOps</span>
                <span style="background-color: #fef2f2; border: 1px solid #fee2e2; color: #ef233c; font-size: 10px; font-family: monospace; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Logistics</span>
              </div>
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; font-family: inherit;">
                NH-48 Corridor Gate-4, Surat Hub<br/>
                Gujarat, India<br/>
                GSTIN: 24AAACT1294F1Z3<br/>
                Email: accounts@transitops.com
              </p>
            </div>
            
            <div style="text-align: right;">
              <h1 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; text-transform: uppercase;">Tax Invoice</h1>
              <table style="border-collapse: collapse; margin-left: auto; font-size: 12px; color: #475569;">
                <tr>
                  <td style="padding: 2px 8px; text-align: right; color: #64748b; font-weight: 500;">Invoice No:</td>
                  <td style="padding: 2px 8px; text-align: left; font-weight: 700; color: #0f172a; font-family: monospace;">${shipment.invoiceId}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 8px; text-align: right; color: #64748b; font-weight: 500;">Date:</td>
                  <td style="padding: 2px 8px; text-align: left; font-weight: 600; color: #0f172a;">${currentDate}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 8px; text-align: right; color: #64748b; font-weight: 500;">Place of Supply:</td>
                  <td style="padding: 2px 8px; text-align: left; font-weight: 600; color: #0f172a;">${shipment.destination.split(",")[1]?.trim() || "Gujarat"}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Billing Addresses -->
          <div style="display: flex; gap: 48px; margin: 32px 0;">
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Transport From (Carrier)</h3>
              <div style="font-size: 13px; color: #1e293b; line-height: 1.5;">
                <strong style="color: #0f172a; font-weight: 600;">TransitOps Global Private Limited</strong><br/>
                NH-48 Corridor, Gate-4, Surat Logistics Hub<br/>
                Gujarat, India &bull; Pin: 395006<br/>
                GSTIN: <span style="font-family: monospace;">24AAACT1294F1Z3</span>
              </div>
            </div>
            
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Bill To (Consignee)</h3>
              <div style="font-size: 13px; color: #1e293b; line-height: 1.5;">
                <strong style="color: #0f172a; font-weight: 600;">${shipment.customerName}</strong><br/>
                Delivery Site: ${shipment.destination}<br/>
                Contact No: +91 99999 99999<br/>
                Email: billing@${shipment.customerName.toLowerCase().replace(/[^a-z0-9]/g, "") || "client"}.com
              </div>
            </div>
          </div>

          <!-- Shipment Metadata Table -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 18px; margin-bottom: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #475569;">
            <div><strong>Shipment ID:</strong> <span style="font-family: monospace;">${shipment.id}</span></div>
            <div><strong>Vehicle No:</strong> <span style="font-family: monospace;">${shipment.vehicleNumber || "MH-04-GP-8834"}</span></div>
            <div><strong>Lorry Receipt (LR):</strong> <span style="font-family: monospace;">${shipment.lorryReceiptId}</span></div>
            <div><strong>Cargo Weight:</strong> <span>${shipment.weight.toLocaleString("en-IN")} Kg</span></div>
          </div>

          <!-- GST Line Items Table -->
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-bottom: 32px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0; color: #475569;">
                <th style="padding: 12px 8px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; width: 45%;">Description of Services</th>
                <th style="padding: 12px 8px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; width: 10%;">SAC</th>
                <th style="padding: 12px 8px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; width: 12%;">Weight</th>
                <th style="padding: 12px 8px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; width: 13%;">Rate (INR)</th>
                <th style="padding: 12px 8px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; width: 20%;">Freight Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9; color: #0f172a;">
                <td style="padding: 16px 8px;">
                  <strong style="display: block; font-size: 13px; color: #0f172a; font-weight: 600;">Freight Transportation Services</strong>
                  <span style="font-size: 11px; color: #64748b; margin-top: 4px; display: block;">Route: ${shipment.pickup} &rarr; ${shipment.destination}</span>
                  <span style="font-size: 11px; color: #64748b; display: block;">Cargo Type: ${shipment.cargoType}</span>
                </td>
                <td style="padding: 16px 8px; text-align: center; font-family: monospace; color: #475569;">996511</td>
                <td style="padding: 16px 8px; text-align: right; color: #334155;">${shipment.weight.toLocaleString("en-IN")} Kg</td>
                <td style="padding: 16px 8px; text-align: right; color: #334155; font-family: monospace;">₹3.50</td>
                <td style="padding: 16px 8px; text-align: right; font-weight: 600; font-family: monospace;">₹${(shipment.weight * 3.5).toLocaleString("en-IN")}.00</td>
              </tr>
              
              <!-- Subtotals and Tax Breakdown -->
              <tr>
                <td colspan="3"></td>
                <td style="padding: 12px 8px 6px 8px; text-align: right; color: #64748b; font-size: 12px;">Taxable Subtotal:</td>
                <td style="padding: 12px 8px 6px 8px; text-align: right; font-weight: 600; color: #1e293b; font-family: monospace;">₹${(shipment.weight * 3.5).toLocaleString("en-IN")}.00</td>
              </tr>
              <tr>
                <td colspan="3"></td>
                <td style="padding: 6px 8px; text-align: right; color: #64748b; font-size: 12px;">Central GST (CGST @ 9%):</td>
                <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #475569; font-family: monospace;">₹${(shipment.weight * 3.5 * 0.09).toLocaleString("en-IN")}.00</td>
              </tr>
              <tr>
                <td colspan="3"></td>
                <td style="padding: 6px 8px; text-align: right; color: #64748b; font-size: 12px;">State GST (SGST @ 9%):</td>
                <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #475569; font-family: monospace;">₹${(shipment.weight * 3.5 * 0.09).toLocaleString("en-IN")}.00</td>
              </tr>
              <tr style="border-top: 1px solid #f1f5f9;">
                <td colspan="3"></td>
                <td style="padding: 16px 8px; text-align: right; font-size: 14px; font-weight: 700; color: #0f172a;">Total Payable:</td>
                <td style="padding: 16px 8px; text-align: right; font-size: 16px; font-weight: 800; color: #ef233c; font-family: monospace;">₹${(shipment.weight * 3.5 * 1.18).toLocaleString("en-IN")}.00</td>
              </tr>
            </tbody>
          </table>

          <!-- Declarations and Signature Footer -->
          <div style="border-top: 1px dashed #cbd5e1; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 32px;">
            <div style="flex: 1.5; font-size: 11px; color: #64748b; line-height: 1.6;">
              <h4 style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Terms & Conditions</h4>
              <p style="margin: 0;">
                1. All payments are due immediately upon cargo arrival or as per pre-agreed contract.<br/>
                2. Cargo carried at carrier risk under Indian Carriage by Road Act 2007.<br/>
                3. This is a computer-generated invoice and requires no physical seal or signature.
              </p>
              
              <div style="margin-top: 20px; display: flex; align-items: center; gap: 12px;">
                <div style="padding: 6px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; display: inline-block;">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TransitOps-INV-${shipment.id}&color=0f172a" style="width: 56px; height: 56px; display: block;" />
                </div>
                <div style="line-height: 1.4;">
                  <strong style="color: #475569; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Digitally Signed Instrument</strong>
                  <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">ID: TO-2026-${shipment.id}</span>
                </div>
              </div>
            </div>
            
            <div style="flex: 1; text-align: right; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; height: 120px;">
              <div>
                <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px;">For TransitOps Logistics Pvt. Ltd.</span>
                <strong style="font-size: 12px; color: #0f172a; display: block; font-weight: 700;">Authorized Signatory</strong>
              </div>
              
              <!-- Fake Elegant Digital Stamp/Signature -->
              <div style="border: 2px solid #10b981; border-radius: 8px; padding: 6px 12px; display: inline-block; transform: rotate(-3deg); background-color: rgba(16, 185, 129, 0.02);">
                <span style="color: #10b981; font-weight: 800; font-size: 11px; font-family: monospace; tracking-spacing: 0.1em; text-transform: uppercase;">VERIFIED & SECURED</span>
                <span style="color: #94a3b8; font-size: 8px; display: block; text-align: center; margin-top: 2px;">DIGITAL CORE ENGINE</span>
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    case "receipt":
      docTitle = `LORRY RECEIPT - ${shipment.lorryReceiptId}`;
      bodyContent = `
        <div style="border: 2px dashed #fbbf24; padding: 30px; border-radius: 12px; background: #0b0f19; color: #f3f4f6; font-family: sans-serif; max-width: 800px; margin: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f2937; padding-bottom: 20px;">
            <div>
              <h2 style="color: #fbbf24; margin: 0; font-size: 24px;">TransitOps Lorry Receipt</h2>
              <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 11px;">MOTO VEHICLE ACT RULE FORM 65</p>
            </div>
            <div style="text-align: right;">
              <span style="background: #fbbf24; color: #000; font-weight: bold; padding: 4px 10px; border-radius: 4px; font-size: 12px;">CONSIGNMENT COPY</span>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 13px;">LR No: ${shipment.lorryReceiptId}</p>
            </div>
          </div>

          <div style="margin: 20px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 13px;">
            <div style="background: #111827; padding: 12px; border-radius: 6px;">
              <strong style="color: #fbbf24;">CONSIGNOR (Shipper)</strong><br/>
              Reliance Retail Ltd. / Surat Hub<br/>
              GSTIN: 24AAACT1294F1Z3
            </div>
            <div style="background: #111827; padding: 12px; border-radius: 6px;">
              <strong style="color: #fbbf24;">CONSIGNEE (Recipient)</strong><br/>
              ${shipment.customerName}<br/>
              Terminal: ${shipment.destination}
            </div>
          </div>

          <div style="background: #111827; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
            <h4 style="margin: 0 0 10px 0; color: #fbbf24; border-bottom: 1px solid #1f2937; padding-bottom: 5px;">VEHICLE & CREW DECLARATION</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div><strong>Vehicle Plate No:</strong> ${shipment.vehicleNumber || 'MH-04-GP-8834'}</div>
              <div><strong>Odo Outbound:</strong> 142,350 km</div>
              <div><strong>Allocated Driver:</strong> ${shipment.driverName || 'Rajesh Yadav'}</div>
              <div><strong>License Registered:</strong> DL-14201800495</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #1f2937; color: #fbbf24;">
                <th style="padding: 10px;">No. of Packages</th>
                <th style="padding: 10px;">Method of Packing</th>
                <th style="padding: 10px;">Declared Content</th>
                <th style="padding: 10px; text-align: right;">Weight (Kg)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #1f2937;">
                <td style="padding: 10px;">48 Boxes</td>
                <td style="padding: 10px;">Industrial Wooden Crates</td>
                <td style="padding: 10px;">${shipment.cargoType}</td>
                <td style="padding: 10px; text-align: right;">${shipment.weight} Kg</td>
              </tr>
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; font-size: 13px;">
            <div style="text-align: center; width: 150px; border-top: 1px solid #9ca3af; padding-top: 5px;">
              Consignor Signature
            </div>
            <div style="text-align: center; width: 150px; border-top: 1px solid #9ca3af; padding-top: 5px;">
              Driver Endorsement
            </div>
            <div style="text-align: center; width: 150px; border-top: 1px solid #9ca3af; padding-top: 5px;">
              Authorised TransitOps
            </div>
          </div>
        </div>
      `;
      break;

    case "pod":
      docTitle = `PROOF OF DELIVERY - ${shipment.podId}`;
      bodyContent = `
        <div style="border: 2px solid #10b981; padding: 30px; border-radius: 12px; background: #0b0f19; color: #f3f4f6; font-family: sans-serif; max-width: 800px; margin: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 20px;">
            <div>
              <h2 style="color: #10b981; margin: 0; font-size: 24px;">Proof Of Delivery (POD)</h2>
              <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 12px;">TransitOps Secured Chain of Custody</p>
            </div>
            <div style="text-align: right;">
              <span style="background: rgba(16,185,129,0.2); color: #10b981; font-weight: bold; padding: 6px 12px; border-radius: 20px; border: 1px solid #10b981; font-size: 12px;">STATUS: FULLY SIGNED</span>
            </div>
          </div>

          <div style="background: #111827; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 25px;">
            <h4 style="margin: 0 0 10px 0; color: #10b981;">SHIPMENT DETAILS</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; line-height: 1.6;">
              <div><strong>Shipment Reference:</strong> ${shipment.id}</div>
              <div><strong>Consignee Partner:</strong> ${shipment.customerName}</div>
              <div><strong>Destination Point:</strong> ${shipment.destination}</div>
              <div><strong>Dispatched via:</strong> Truck ${shipment.vehicleNumber}</div>
            </div>
          </div>

          <div style="border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 30px; background: #0d1321;">
            <h4 style="margin: 0 0 15px 0; color: #10b981;">DELIVERY CONFIRMATION RECORD</h4>
            <table style="width: 100%; font-size: 13px; line-height: 2;">
              <tr>
                <td style="width: 40%; color: #9ca3af;">Actual Arrival Date:</td>
                <td><strong>July 11, 2026 - 04:35 PM</strong></td>
              </tr>
              <tr>
                <td style="color: #9ca3af;">Package Condition:</td>
                <td><strong style="color: #10b981;">&bull; Intact / Zero Defect Seal Verified</strong></td>
              </tr>
              <tr>
                <td style="color: #9ca3af;">Delivered To:</td>
                <td><strong>Reliance Logistics Terminal Receiver (Floor-2)</strong></td>
              </tr>
              <tr>
                <td style="color: #9ca3af;">Authorized Signature Name:</td>
                <td><strong>Siddharth Rawal (Operations Head)</strong></td>
              </tr>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; background: #111827; padding: 20px; border-radius: 8px;">
            <div style="font-size: 13px;">
              <p style="margin: 0; color: #9ca3af;">Secure Receipt Token:</p>
              <code style="color: #10b981; font-size: 11px;">SHA256: 9f82a938c109df28a9c8bce738217d12f1120aa29b9e11</code>
            </div>
            <div style="border: 1px solid #10b981; padding: 10px; border-radius: 4px; background: white; text-align: center;">
              <p style="color: #0b0f19; font-weight: bold; margin: 0 0 4px 0; font-size: 8px;">DIGITALLY SIGNED</p>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TransitOps-POD-${shipment.id}&color=0b0f19" style="width: 60px; height: 60px;" />
            </div>
          </div>
        </div>
      `;
      break;

    case "pass":
      docTitle = `BOARDING PASS - ${shipment.passId}`;
      bodyContent = `
        <div style="border: 2px solid #a855f7; border-radius: 20px; background: linear-gradient(135deg, #110d24 0%, #07040f 100%); color: #f3f4f6; font-family: sans-serif; max-width: 650px; margin: auto; overflow: hidden; box-shadow: 0 15px 35px rgba(124, 58, 237, 0.3);">
          <!-- Top airline header -->
          <div style="background: #a855f7; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: bold; font-size: 18px; letter-spacing: 1px; color: #fff;">TRANSITOPS AI</span>
              <span style="font-size: 11px; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; color: #fff;">BOARDING PASS</span>
            </div>
            <div style="font-family: monospace; font-size: 14px; font-weight: bold; color: #fff;">${shipment.id}</div>
          </div>

          <!-- Airport-style Route Display -->
          <div style="padding: 25px; text-align: center; display: flex; justify-content: space-between; align-items: center; background: rgba(168, 85, 247, 0.05); border-bottom: 2px dashed rgba(168, 85, 247, 0.2);">
            <div style="text-align: left;">
              <h2 style="margin: 0; color: #a855f7; font-size: 32px;">SRT</h2>
              <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 11px; text-transform: uppercase;">SURAT HUB</p>
            </div>
            
            <div style="flex: 1; position: relative; margin: 0 20px;">
              <div style="border-top: 2px dashed #a855f7; width: 100%; position: absolute; top: 50%; left: 0;"></div>
              <span style="background: #a855f7; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; margin: auto; box-shadow: 0 0 10px #a855f7;">
                🚚
              </span>
              <p style="margin: 18px 0 0 0; color: #10b981; font-size: 10px; font-weight: bold;">ETA: ${shipment.eta}</p>
            </div>

            <div style="text-align: right;">
              <h2 style="margin: 0; color: #a855f7; font-size: 32px;">BOM</h2>
              <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 11px; text-transform: uppercase;">MUMBAI CORE</p>
            </div>
          </div>

          <!-- Flight ticket details grid -->
          <div style="padding: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 13px; border-bottom: 2px dashed rgba(168, 85, 247, 0.2);">
            <div>
              <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase;">CUSTOMER PARTNER</p>
              <strong style="font-size: 15px; color: #fff;">${shipment.customerName}</strong>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase;">VEHICLE / TRUCK</p>
              <strong style="font-size: 15px; color: #10b981;">${shipment.vehicleNumber || 'MH-04-GP-8834'}</strong>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase;">ASSIGNED DRIVER</p>
              <strong style="font-size: 15px; color: #fff;">${shipment.driverName || 'Rajesh Yadav'}</strong>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase;">PRIORITY GROUP</p>
              <strong style="font-size: 15px; color: #f59e0b;">CLASS-A / ${shipment.priority} PRIORITY</strong>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase;">DEPARTURE TIME</p>
              <strong style="font-size: 15px; color: #fff;">${shipment.departureTime}</strong>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 11px; text-transform: uppercase;">PROGRESS STATUS</p>
              <strong style="font-size: 15px; color: #a855f7;">${shipment.status} (${shipment.progress}%)</strong>
            </div>
          </div>

          <!-- Ticket bottom with barcode/QR -->
          <div style="padding: 25px; display: flex; justify-content: space-between; align-items: center; background: rgba(168, 85, 247, 0.02);">
            <div>
              <span style="font-family: monospace; font-size: 12px; color: #9ca3af; display: block; margin-bottom: 5px;">PASS NO: ${shipment.passId}</span>
              <div style="height: 45px; width: 220px; background: repeating-linear-gradient(90deg, #fff, #fff 2px, #07040f 2px, #07040f 10px); border-radius: 4px;"></div>
            </div>
            <div style="background: white; padding: 10px; border-radius: 12px;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TransitOps-BOARDING-PASS-${shipment.id}&color=0b0f19" style="width: 75px; height: 75px;" />
            </div>
          </div>
        </div>
      `;
      break;

    default:
      return res.status(400).send("<h3>Invalid Document Category Requested</h3>");
  }

  // Send beautifully compiled complete HTML page for viewing or print triggering
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            color: #1e293b;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          /* Toolbar Styling */
          .toolbar {
            position: sticky;
            top: 0;
            background-color: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border-bottom: 1px solid #e2e8f0;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          }

          .toolbar-brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .toolbar-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.02em;
          }

          .toolbar-tag {
            font-size: 10px;
            font-family: monospace;
            background-color: #f1f5f9;
            color: #64748b;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            border: 1px solid transparent;
            font-family: inherit;
            text-decoration: none;
          }

          .btn-secondary {
            background-color: #ffffff;
            border-color: #e2e8f0;
            color: #334155;
          }

          .btn-secondary:hover {
            background-color: #f8fafc;
            border-color: #cbd5e1;
            color: #0f172a;
          }

          .btn-primary {
            background-color: #ef233c;
            color: #ffffff;
          }

          .btn-primary:hover {
            background-color: #d90429;
          }

          /* Document Container */
          .preview-container {
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 32px 16px;
            box-sizing: border-box;
          }

          /* Invoice Container */
          .invoice-card {
            width: 100%;
            max-width: 800px;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            box-sizing: border-box;
            padding: 48px;
            margin: 0 auto;
          }

          /* Toast Notification */
          .toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background-color: #0f172a;
            color: #ffffff;
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
            z-index: 2000;
          }

          .toast.show {
            opacity: 1;
            transform: translateY(0);
          }

          /* Print Overrides */
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            .preview-container {
              padding: 0 !important;
              display: block !important;
            }
            .invoice-card {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        <!-- Sticky Top Toolbar -->
        <div class="toolbar no-print">
          <div class="toolbar-brand">
            <svg style="color: #ef233c;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            <span class="toolbar-title">TransitOps</span>
            <span class="toolbar-tag">Document Viewer</span>
          </div>
          <div class="toolbar-actions">
            <!-- ← Back -->
            <button onclick="handleBack()" class="btn btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back
            </button>
            
            <!-- Download PDF -->
            <button onclick="handleDownload()" class="btn btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download PDF
            </button>
            
            <!-- Print -->
            <button onclick="window.print()" class="btn btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print
            </button>
            
            <!-- Share -->
            <button onclick="handleShare()" class="btn btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Share
            </button>
            
            <!-- Close -->
            <button onclick="window.close()" class="btn btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Close
            </button>
          </div>
        </div>

        <!-- Preview Canvas -->
        <div class="preview-container">
          ${bodyContent}
        </div>

        <!-- Interactive Toast Feedback -->
        <div id="toast" class="toast"></div>

        <script>
          function handleBack() {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = '/';
            }
          }

          function handleDownload() {
            showToast("Opening print dialogue. Set Destination as 'Save as PDF' to download.", 4000);
            setTimeout(function() {
              window.print();
            }, 1000);
          }

          function handleShare() {
            var url = window.location.href;
            navigator.clipboard.writeText(url).then(function() {
              showToast("Invoice link copied to clipboard!", 3000);
            }).catch(function(err) {
              showToast("Could not copy link. Copy from address bar: " + url, 4000);
            });
          }

          function showToast(message, duration) {
            var toast = document.getElementById("toast");
            toast.innerText = message;
            toast.classList.add("show");
            setTimeout(function() {
              toast.classList.remove("show");
            }, duration || 3000);
          }
        </script>
      </body>
    </html>
  `);
});

// ==========================================
// GEMINI INTELLIGENT ROUTER ENDPOINTS
// ==========================================

// AI Operational insights using Gemini 3.5 Flash
app.post("/api/gemini/insights", async (req, res) => {
  if (!ai) {
    // Fallback if API key is not present or SDK fails to load
    return res.json({
      success: true,
      insights: [
        { id: "gen-1", category: "FUEL", text: "AI Analysis: Truck v-101 (Tata Signa) shows fuel consumption spike of 18% matching dense western highway congestion alerts.", severity: "WARNING", timestamp: new Date().toISOString() },
        { id: "gen-2", category: "MAINTENANCE", text: "AI Diagnostic: Ashok Leyland (v-105) brake temperature patterns suggest replacement required in next 750 km.", severity: "INFO", timestamp: new Date().toISOString() },
        { id: "gen-3", category: "PROFITABILITY", text: "AI Routing: Shifting Surat corridor routing via Expressway NH-48 Ext-3 saves average of 34 minutes per dispatch run.", severity: "SUCCESS", timestamp: new Date().toISOString() }
      ]
    });
  }

  try {
    const contextStr = JSON.stringify({
      vehicles,
      drivers,
      shipments: shipments.slice(0, 10),
      maintenanceOverdue: vehicles.filter(v => v.maintenanceOverdue).length,
      alertsCount: geofences.reduce((acc, g) => acc + g.alertsCount, 0)
    });

    const prompt = `
      You are the AI Intelligence Engine of TransitOps AI, an ultra-premium logistical operating system.
      Analyze the current logistics state data and generate 3 to 4 highly-professional, actionable operational insights.
      Each insight must be distinct, specific to the vehicles or drivers mentioned, and directly solve business issues like money leaks, driver safety, license expiries, or predictive maintenance.
      
      Respond STRICTLY with a valid JSON array matching the following schema. No markdown backticks, no explanatory text outside the JSON.
      
      Schema:
      [
        {
          "id": "gen-x",
          "category": "FUEL" | "LICENSE" | "MAINTENANCE" | "PROFITABILITY" | "UTILIZATION" | "ALERT",
          "text": "The detailed insight text citing specific IDs, names or values.",
          "severity": "CRITICAL" | "WARNING" | "INFO" | "SUCCESS",
          "timestamp": "ISO Date string"
        }
      ]
      
      Data Context:
      ${contextStr}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    return res.json({ success: true, insights: parsed });
  } catch (error: any) {
    console.error("Gemini insights failure:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Smart Dispatch Recommendation using Gemini 3.5 Flash
app.post("/api/gemini/dispatch", async (req, res) => {
  const { pickup, destination, cargoType, weight, priority } = req.body;

  if (!pickup || !destination) {
    return res.status(400).json({ error: "Pickup and destination points are required." });
  }

  const payload = { pickup, destination, cargoType, weight, priority };

  if (!ai) {
    // Intelligent fallback algorithm if Gemini key is not configured
    const recommendedVehicle = vehicles.find(v => v.status === "ACTIVE") || vehicles[0];
    const recommendedDriver = drivers.find(d => d.status === "AVAILABLE") || drivers[0];
    
    return res.json({
      success: true,
      recommendation: {
        vehicleId: recommendedVehicle.id,
        vehicleModel: recommendedVehicle.model,
        vehiclePlate: recommendedVehicle.plateNumber,
        driverId: recommendedDriver.id,
        driverName: recommendedDriver.name,
        safetyScore: recommendedDriver.safetyScore,
        confidence: 85,
        rationale: `Rule-based backup optimizer selected ${recommendedDriver.name} due to active availability, license validity, and highly safe driver scoring of ${recommendedDriver.safetyScore}%. Vehicle ${recommendedVehicle.plateNumber} is chosen based on its excellent engine health (${recommendedVehicle.engineHealth}%) and load suitability.`
      }
    });
  }

  try {
    const prompt = `
      You are the Smart Dispatch Assistant in the TransitOps AI logistics dashboard.
      A dispatcher is assigning a new shipment. Review the request details and match it with the absolute best available vehicle and driver from our database.
      
      Shipment Query:
      - Origin: ${pickup}
      - Destination: ${destination}
      - Cargo: ${cargoType || "General Cargo"}
      - Weight: ${weight || "5,000"} kg
      - Priority: ${priority || "MEDIUM"}
      
      Logistics Database:
      - Vehicles: ${JSON.stringify(vehicles)}
      - Drivers: ${JSON.stringify(drivers)}
      
      Recommend one specific vehicle and one specific driver based on these logical rules:
      - Prefer Active vehicles and Available drivers.
      - Match heavy cargo weights with vehicle capacity metrics.
      - Highlight high driver safety scores and good vehicle health.
      
      Respond with a JSON object strictly matching this schema. No markdown or wrappers.
      
      Schema:
      {
        "vehicleId": "v-xxx",
        "vehicleModel": "Tata / Eicher...",
        "vehiclePlate": "MH-xx-...",
        "driverId": "d-xxx",
        "driverName": "Amit Kulkarni...",
        "safetyScore": 95,
        "confidence": 92,
        "rationale": "A concise explanation detailing why this match is perfect based on fuel level, cargo capacity, license validity, and safety rating."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const recommendation = JSON.parse(response.text?.trim() || "{}");
    return res.json({ success: true, recommendation });
  } catch (error: any) {
    console.error("Gemini dispatch failure:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// VITE DEV SERVER / STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite inside development flow for instant live previews
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static compiled output inside production context
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TransitOps Core Server] running at http://localhost:${PORT}`);
  });
}

startServer();
