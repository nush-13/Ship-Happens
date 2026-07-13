import React, { useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import AdminDashboard from "./components/AdminDashboard";
import DispatcherDashboard from "./components/DispatcherDashboard";
import DriverDashboard from "./components/DriverDashboard";
import ClientDashboard from "./components/ClientDashboard";
import { User, Shipment } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Global refresh function to update all dashboards
  const triggerGlobalRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Attempt auto login using mock session token or simply bypass for instant local preview experience
    const savedUser = localStorage.getItem("transitops_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse cached session user", e);
      }
    }

    const savedTheme = localStorage.getItem("transitops_theme") as "light" | "dark" | null;
    const currentTheme = savedTheme || "light";
    setTheme(currentTheme);
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("transitops_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    localStorage.setItem("transitops_user", JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("transitops_user");
  };

  // Render Role-Based Screen Router
  const renderDashboardByRole = () => {
    if (!user) return null;

    switch (user.role) {
      case "ADMIN":
        return <AdminDashboard user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} refreshTrigger={refreshTrigger} />;
      case "DISPATCHER":
        return (
          <DispatcherDashboard 
            user={user} 
            onLogout={handleLogout} 
            shipments={shipments} 
            setShipments={setShipments} 
            theme={theme}
            toggleTheme={toggleTheme}
            refreshTrigger={refreshTrigger}
            onDataChange={triggerGlobalRefresh}
          />
        );
      case "DRIVER":
        return <DriverDashboard user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} refreshTrigger={refreshTrigger} onDataChange={triggerGlobalRefresh} />;
      case "CLIENT":
        return <ClientDashboard user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} refreshTrigger={refreshTrigger} />;
      default:
        return (
          <div className="min-h-screen bg-[#f6f5f0] dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <div className="text-center p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-md">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 mb-2">Unauthorized Role</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Role profile error detected on credentials.</p>
              <button 
                onClick={handleLogout} 
                className="mt-4 bg-[#ef233c] hover:bg-[#d90429] text-white font-bold py-2 px-6 rounded-xl text-xs uppercase"
              >
                Sign Back In
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f0] dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-all">
      {!user ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        renderDashboardByRole()
      )}
    </div>
  );
}
