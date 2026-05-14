import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  CheckSquare, 
  Megaphone, 
  Calendar, 
  BarChart, 
  UserCheck, 
  Shield,
  Settings,
  Bell,
  LogOut,
  Menu
} from "lucide-react";
import { useLogout, useListNotifications } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, setToken } = useAuth();
  const logoutMutation = useLogout();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: notifications } = useListNotifications({
    query: {
      enabled: !!user,
    }
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setToken(null);
      setLocation("/login");
    } catch (e) {
      // Fallback
      setToken(null);
      setLocation("/login");
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["student", "member", "executive", "president", "higher_official"] },
    { name: "Reports", path: "/reports", icon: FileText, roles: ["executive", "president", "higher_official"] },
    { name: "Members", path: "/members", icon: Users, roles: ["member", "executive", "president", "higher_official"] },
    { name: "Tasks", path: "/tasks", icon: CheckSquare, roles: ["member", "executive", "president"] },
    { name: "Announcements", path: "/announcements", icon: Megaphone, roles: ["student", "member", "executive", "president", "higher_official"] },
    { name: "Events", path: "/events", icon: Calendar, roles: ["student", "member", "executive", "president", "higher_official"] },
    { name: "KYC Queue", path: "/kyc-queue", icon: UserCheck, roles: ["executive", "president"] },
    { name: "Analytics", path: "/analytics", icon: BarChart, roles: ["president", "higher_official"] },
    { name: "Delegations", path: "/delegations", icon: Shield, roles: ["president"] },
  ];

  const allowedItems = menuItems.filter(item => user && item.roles.includes(user.role));

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-6">
        <h1 className="text-xl font-bold font-sans tracking-tight">AMUPF DMS</h1>
        <p className="text-xs text-sidebar-foreground/70 mt-1">Peace • Unity • Progress</p>
      </div>
      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col space-y-1">
          {allowedItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                location.startsWith(item.path) 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}>
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </a>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-col flex overflow-hidden">
            <span className="text-sm font-medium truncate">{user?.full_name}</span>
            <span className="text-xs text-sidebar-foreground/70 capitalize truncate">{user?.role.replace("_", " ")}</span>
          </div>
        </div>
        <Link href="/settings">
          <a onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors w-full mb-1">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </a>
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/80 hover:bg-destructive/90 hover:text-destructive-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b px-4 lg:px-8 bg-card">
          <div className="flex items-center md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-none bg-sidebar text-sidebar-foreground">
                <NavContent />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-lg text-primary">AMUPF</span>
          </div>
          <div className="hidden md:flex flex-1" />
          <div className="flex items-center space-x-4">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
