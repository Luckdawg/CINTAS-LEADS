import { Link, useLocation } from "wouter";
import { Building2, Users, Copy, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/leads", label: "Business Leads", icon: Building2 },
    { path: "/contacts", label: "Contacts", icon: Users },
    { path: "/duplicates", label: "Duplicates", icon: Copy },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-lg border-b-4 border-blue-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity">
            <div className="bg-white p-2 rounded-lg shadow-md">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cintas_logo.svg/320px-Cintas_logo.svg.png" 
                alt="CINTAS" 
                className="h-6 w-auto"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold">Western Georgia</div>
              <div className="text-xs text-blue-100">Lead Generation Dashboard</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`
                      flex items-center gap-2 transition-all
                      ${isActive 
                        ? "bg-white text-blue-700 hover:bg-white/90 shadow-md" 
                        : "text-white hover:bg-white/20"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
