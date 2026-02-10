import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  MessageSquare, 
  BookOpen, 
  Users, 
  User, 
  LogOut, 
  Image as ImageIcon,
  ScrollText,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  const navItems = [
    { href: "/chats", icon: MessageSquare, label: "Chats" },
    { href: "/scenarios", icon: ScrollText, label: "Scenarios" },
    { href: "/library", icon: ImageIcon, label: "Library" },
    { href: "/contacts", icon: Users, label: "Contacts" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 bg-card border-r border-border flex flex-col z-50 transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold font-display text-lg">
          R
        </div>
        <span className="font-display font-bold text-xl hidden md:block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          RolePlay
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}>
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="hidden md:block font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          {isLoggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span className="hidden md:block font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
