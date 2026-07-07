import { Home, Map as MapIcon, Briefcase, Wallet, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: MapIcon, label: "Map", path: "/map" },
    { icon: Briefcase, label: "Jobs", path: "/jobs" },
    { icon: Wallet, label: "Wallet", path: "/wallet" },
    { 
      icon: User, 
      label: "Profile", 
      path: user ? (user.user_metadata?.shop_id ? "/dashboard" : "/shop/new") : "/auth" 
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-purple-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "fill-purple-100" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
